import { App, Modal, Setting } from 'obsidian';
import type PropertyIconsPlugin from './main';
import { Condition, Rule, RuleOperator } from './types';
import { BUILTIN_ICONS, builtinSvgEl } from './icons';
import { t } from './i18n';

/**
 * 规则组编辑弹窗：名称、启用、且/或、条件行增删、图标网格。
 * 与旧设置页卡片一致，每次变更即持久化并刷新文件树；结构变化（增删条件、选图标）就地重绘弹窗内容。
 * 删除规则不在弹窗里做——设置页的规则 list 已带 onDelete。
 * 关闭时回调 onClosed，由设置页 update() 把名称/条件摘要同步到列表行。
 */
export class RuleEditModal extends Modal {
  constructor(
    app: App,
    private plugin: PropertyIconsPlugin,
    private rule: Rule,
    private onClosed: () => void,
  ) {
    super(app);
  }

  private async persist(): Promise<void> {
    await this.plugin.saveSettings();
    this.plugin.refreshDecorations();
  }

  onOpen(): void {
    this.setTitle(t().editRule);
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
    this.onClosed();
  }

  private render(): void {
    const { contentEl, rule } = this;
    contentEl.empty();
    const L = t();

    // 名称 + 启用
    new Setting(contentEl)
      .setName(L.ruleName)
      .addText((txt) => {
        txt.setPlaceholder(L.ruleNamePlaceholder)
          .setValue(rule.name)
          .onChange(async (v) => {
            rule.name = v;
            await this.persist();
          });
      })
      .addToggle((tg) => {
        tg.setTooltip(L.enableRuleTooltip)
          .setValue(rule.enabled)
          .onChange(async (v) => {
            rule.enabled = v;
            await this.persist();
          });
      });

    // 操作符：且 / 或
    new Setting(contentEl)
      .setName(L.conditionCombine)
      .addDropdown((dd) => {
        dd.addOption('AND', L.opAll);
        dd.addOption('OR', L.opAny);
        dd.setValue(rule.op);
        dd.onChange(async (v) => {
          rule.op = v as RuleOperator;
          await this.persist();
        });
      });

    // 条件列表
    const condsWrap = contentEl.createDiv({ cls: 'property-icons-conditions' });
    rule.conditions.forEach((cond, idx) => this.renderConditionRow(condsWrap, cond, idx));

    new Setting(contentEl).addButton((btn) => {
      btn.setButtonText(L.addCondition).onClick(async () => {
        rule.conditions.push({ property: '', value: '' });
        await this.persist();
        this.render();
      });
    });

    // 图标选择
    const iconLabel = contentEl.createDiv({ cls: 'property-icons-icon-label', text: L.iconLabel });
    iconLabel.setAttr('aria-hidden', 'true');
    this.renderIconPicker(contentEl);
  }

  private renderConditionRow(parent: HTMLElement, cond: Condition, idx: number): void {
    const L = t();
    const { rule } = this;
    const setting = new Setting(parent);
    setting.settingEl.addClass('property-icons-cond-row');
    setting.infoEl.remove(); // 去掉左侧空 name 占位，条件行更紧凑

    setting.addText((txt) => {
      txt.setPlaceholder(L.propertyPlaceholder)
        .setValue(cond.property)
        .onChange(async (v) => {
          cond.property = v.trim();
          await this.persist();
        });
    });
    // 匹配方式：=（精确等于）/ 包含（子串；数组属性按任一元素判断）
    setting.addDropdown((dd) => {
      dd.addOption('equals', L.matchEquals);
      dd.addOption('contains', L.matchContains);
      dd.setValue(cond.match === 'contains' ? 'contains' : 'equals');
      dd.selectEl.setAttribute('aria-label', L.matchTooltip);
      dd.onChange(async (v) => {
        cond.match = v === 'contains' ? 'contains' : 'equals';
        await this.persist();
      });
    });
    setting.addText((txt) => {
      txt.setPlaceholder(L.valuePlaceholder)
        .setValue(cond.value)
        .onChange(async (v) => {
          cond.value = v;
          await this.persist();
        });
    });
    setting.addExtraButton((b) => {
      b.setIcon('x')
        .setTooltip(L.deleteConditionTooltip)
        .onClick(async () => {
          rule.conditions.splice(idx, 1);
          if (rule.conditions.length === 0) rule.conditions.push({ property: '', value: '' });
          await this.persist();
          this.render();
        });
    });
  }

  private renderIconPicker(parent: HTMLElement): void {
    const { rule } = this;
    const grid = parent.createDiv({ cls: 'property-icons-icon-grid' });

    const addOption = (ref: string, label: string, node: Node) => {
      const opt = grid.createDiv({ cls: 'property-icons-icon-option' });
      opt.setAttribute('aria-label', label);
      if (rule.icon === ref) opt.addClass('is-selected');
      opt.appendChild(node);
      opt.onClickEvent(async () => {
        rule.icon = ref;
        await this.persist();
        this.render();
      });
    };

    for (const icon of BUILTIN_ICONS) {
      const svg = builtinSvgEl(icon.id);
      if (svg) addOption(`builtin:${icon.id}`, icon.label, svg);
    }
    for (const custom of this.plugin.settings.customIcons) {
      const img = createEl('img', { attr: { src: custom.dataUri, alt: '' } });
      addOption(`custom:${custom.id}`, custom.name, img);
    }
  }
}
