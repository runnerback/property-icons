import { Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PropertyIconsSettings } from './types';
import { ExplorerDecorator } from './decorator';
import { PropertyIconsSettingTab } from './settings';

export default class PropertyIconsPlugin extends Plugin {
  settings: PropertyIconsSettings = DEFAULT_SETTINGS;
  private decorator!: ExplorerDecorator;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.decorator = new ExplorerDecorator(this.app, () => this.settings);
    this.addSettingTab(new PropertyIconsSettingTab(this.app, this));

    // 首次渲染 + 挂 DOM 观察器（文件树 ready 后）
    this.app.workspace.onLayoutReady(() => this.refreshDecorations());

    // 布局变化（打开/关闭文件浏览器、切换等）→ 重新观察 + 重扫
    this.registerEvent(
      this.app.workspace.on('layout-change', () => this.refreshDecorations()),
    );

    // 某文件 frontmatter 变更 → 只重刷该文件
    this.registerEvent(
      this.app.metadataCache.on('changed', (file: TFile) => {
        this.decorator.decoratePath(file.path);
      }),
    );

    // 元数据整体解析完成（如启动、批量导入）→ 全量重扫
    this.registerEvent(
      this.app.metadataCache.on('resolved', () => this.decorator.scheduleDecorateAll()),
    );
  }

  onunload(): void {
    this.decorator?.stopObserving();
    this.decorator?.clearAll();
  }

  /** 重新观察文件树并全量重扫（设置变更/布局变化后调用）。 */
  refreshDecorations(): void {
    if (!this.decorator) return;
    this.decorator.startObserving();
    this.decorator.decorateAll();
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<PropertyIconsSettings> | null;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(loaded || {}),
      rules: loaded?.rules ?? [],
      customIcons: loaded?.customIcons ?? [],
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
