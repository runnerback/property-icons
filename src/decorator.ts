import { App, TFile, WorkspaceLeaf } from 'obsidian';
import { PropertyIconsSettings } from './types';
import { matchingRules } from './ruleEngine';
import { getBuiltinIcon, builtinSvgEl } from './icons';

const BADGE_CONTAINER_CLASS = 'property-icons-badges';
const BADGE_CLASS = 'property-icons-badge';

/**
 * 文件树徽标装饰器：
 *  - 根据每个文件的 frontmatter + 规则组，在文件名前插入图标；
 *  - 监听文件树 DOM 变化（虚拟化/滚动/展开会重建节点），实时补图标；
 *  - 卸载时清理所有注入元素。
 */
export class ExplorerDecorator {
  private observers: MutationObserver[] = [];
  private debounceTimer: number | null = null;

  constructor(
    private app: App,
    private getSettings: () => PropertyIconsSettings,
  ) {}

  private getExplorerContainers(): HTMLElement[] {
    return this.app.workspace
      .getLeavesOfType('file-explorer')
      .map((leaf: WorkspaceLeaf) => leaf.view?.containerEl)
      .filter((el): el is HTMLElement => !!el);
  }

  /** 生成一个图标元素（内置=SVG，自定义=img[data URI]）；无效 icon 返回 null。 */
  private createIconEl(iconRef: string): HTMLElement | null {
    const settings = this.getSettings();
    const badge = createSpan({ cls: BADGE_CLASS });

    if (iconRef.startsWith('builtin:')) {
      const id = iconRef.slice('builtin:'.length);
      const icon = getBuiltinIcon(id);
      const svgEl = builtinSvgEl(id);
      if (!icon || !svgEl) return null;
      badge.appendChild(document.importNode(svgEl, true));
      badge.setAttribute('aria-label', icon.label);
      return badge;
    }

    if (iconRef.startsWith('custom:')) {
      const custom = settings.customIcons.find((c) => c.id === iconRef.slice('custom:'.length));
      if (!custom) return null;
      const img = badge.createEl('img', { attr: { src: custom.dataUri, alt: '' } });
      img.draggable = false;
      badge.setAttribute('aria-label', custom.name);
      return badge;
    }

    return null;
  }

  /** 装饰单个 .nav-file-title 元素。 */
  private decorateTitleEl(titleEl: HTMLElement): void {
    const path = titleEl.getAttribute('data-path');
    if (!path) return;

    // 先清掉旧徽标（属性/规则可能已变）
    titleEl.querySelectorAll('.' + BADGE_CONTAINER_CLASS).forEach((n) => n.remove());

    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;

    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    const rules = matchingRules(fm, this.getSettings().rules);
    if (rules.length === 0) return;

    const container = createSpan({ cls: BADGE_CONTAINER_CLASS });
    const size = this.getSettings().iconSize || 16;
    container.style.setProperty('--property-icons-size', size + 'px');

    let added = 0;
    for (const rule of rules) {
      const el = this.createIconEl(rule.icon);
      if (el) {
        el.setAttribute('data-rule', rule.name || rule.id);
        container.appendChild(el);
        added += 1;
      }
    }
    if (added === 0) return;

    // 插到文件名前面（.nav-file-title-content 之前）
    titleEl.prepend(container);
  }

  private getAllTitleEls(): HTMLElement[] {
    const out: HTMLElement[] = [];
    for (const container of this.getExplorerContainers()) {
      container
        .querySelectorAll<HTMLElement>('.nav-file-title[data-path]')
        .forEach((el) => out.push(el));
    }
    return out;
  }

  /** 全量重扫（防抖）。属性/规则/图标变更后调用。 */
  scheduleDecorateAll(): void {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.decorateAll();
    }, 60);
  }

  decorateAll(): void {
    for (const el of this.getAllTitleEls()) this.decorateTitleEl(el);
  }

  /** 只重刷某个文件（frontmatter 变更时用）。 */
  decoratePath(path: string): void {
    for (const container of this.getExplorerContainers()) {
      const el = container.querySelector<HTMLElement>(
        `.nav-file-title[data-path="${CSS.escape(path)}"]`,
      );
      if (el) this.decorateTitleEl(el);
    }
  }

  /** 监听文件树 DOM 变化（滚动虚拟化、展开折叠会重建节点）。 */
  startObserving(): void {
    this.stopObserving();
    for (const container of this.getExplorerContainers()) {
      const target = container.querySelector('.nav-files-container') || container;
      const observer = new MutationObserver(() => this.scheduleDecorateAll());
      observer.observe(target, { childList: true, subtree: true });
      this.observers.push(observer);
    }
  }

  stopObserving(): void {
    this.observers.forEach((o) => o.disconnect());
    this.observers = [];
  }

  /** 清理所有注入的徽标（卸载时）。 */
  clearAll(): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    document
      .querySelectorAll('.' + BADGE_CONTAINER_CLASS)
      .forEach((n) => n.remove());
  }
}
