import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type PropertyIconsPlugin from './main';
import { Condition, Rule, RuleOperator } from './types';
import { BUILTIN_ICONS, builtinSvgEl } from './icons';
import { t } from './i18n';

const CUSTOM_ICON_MAX_BYTES = 256 * 1024; // 单张自定义图标上限 256KB（存 data.json，别撑太大）
const ACCEPTED_EXT = ['jpg', 'jpeg', 'png', 'svg'];

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export class PropertyIconsSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: PropertyIconsPlugin) {
    super(app, plugin);
  }

  private async persist(): Promise<void> {
    await this.plugin.saveSettings();
    this.plugin.refreshDecorations();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const L = t();

    new Setting(containerEl)
      .setName(L.heading)
      .setDesc(L.headingDesc)
      .setHeading();

    new Setting(containerEl)
      .setName(L.iconSize)
      .setDesc(L.iconSizeDesc)
      .addSlider((slider) => {
        slider
          .setLimits(12, 24, 1)
          .setValue(this.plugin.settings.iconSize || 16)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.iconSize = value;
            await this.persist();
          });
      });

    // ── 规则组列表 ──
    const rulesWrap = containerEl.createDiv({ cls: 'property-icons-rules' });
    this.plugin.settings.rules.forEach((rule) => this.renderRuleCard(rulesWrap, rule));

    new Setting(containerEl).addButton((btn) => {
      btn
        .setButtonText(L.addRuleGroup)
        .setCta()
        .onClick(async () => {
          const rule: Rule = {
            id: genId('rule'),
            name: L.ruleDefaultName(this.plugin.settings.rules.length + 1),
            op: 'AND',
            conditions: [{ property: '', value: '' }],
            icon: `builtin:${BUILTIN_ICONS[0].id}`,
            enabled: true,
          };
          this.plugin.settings.rules.push(rule);
          await this.persist();
          this.display();
        });
    });

    // ── 自定义图标 ──
    new Setting(containerEl)
      .setName(L.customIcons)
      .setDesc(L.customIconsDesc)
      .setHeading();

    this.renderCustomIcons(containerEl);
  }

  private renderRuleCard(parent: HTMLElement, rule: Rule): void {
    const L = t();
    const card = parent.createDiv({ cls: 'property-icons-rule-card' });

    // 顶行：名称 + 启用 + 删除
    const head = new Setting(card)
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
      })
      .addExtraButton((b) => {
        b.setIcon('trash')
          .setTooltip(L.deleteRuleTooltip)
          .onClick(async () => {
            this.plugin.settings.rules = this.plugin.settings.rules.filter((r) => r.id !== rule.id);
            await this.persist();
            this.display();
          });
      });
    head.setName('');
    head.settingEl.addClass('property-icons-rule-head');

    // 操作符：且 / 或
    new Setting(card)
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
    const condsWrap = card.createDiv({ cls: 'property-icons-conditions' });
    rule.conditions.forEach((cond, idx) => this.renderConditionRow(condsWrap, rule, cond, idx));

    new Setting(card).addButton((btn) => {
      btn.setButtonText(L.addCondition).onClick(async () => {
        rule.conditions.push({ property: '', value: '' });
        await this.persist();
        this.display();
      });
    });

    // 图标选择
    const iconLabel = card.createDiv({ cls: 'property-icons-icon-label', text: L.iconLabel });
    iconLabel.setAttr('aria-hidden', 'true');
    this.renderIconPicker(card, rule);
  }

  private renderConditionRow(parent: HTMLElement, rule: Rule, cond: Condition, idx: number): void {
    const L = t();
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
    setting.controlEl.createSpan({ cls: 'property-icons-eq', text: '=' });
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
          this.display();
        });
    });
  }

  private renderIconPicker(parent: HTMLElement, rule: Rule): void {
    const grid = parent.createDiv({ cls: 'property-icons-icon-grid' });

    const addOption = (ref: string, label: string, node: Node) => {
      const opt = grid.createDiv({ cls: 'property-icons-icon-option' });
      opt.setAttribute('aria-label', label);
      if (rule.icon === ref) opt.addClass('is-selected');
      opt.appendChild(node);
      opt.onClickEvent(async () => {
        rule.icon = ref;
        await this.persist();
        this.display();
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

  private renderCustomIcons(containerEl: HTMLElement): void {
    const L = t();
    // 上传按钮（隐藏的 file input）
    const uploadSetting = new Setting(containerEl).setName(L.uploadIcon);
    const fileInput = uploadSetting.controlEl.createEl('input', {
      attr: { type: 'file', accept: '.jpg,.jpeg,.png,.svg,image/*' },
      cls: 'property-icons-file-input',
    });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) void this.handleUpload(file);
      fileInput.value = '';
    });

    // 已上传列表
    const list = containerEl.createDiv({ cls: 'property-icons-custom-list' });
    if (this.plugin.settings.customIcons.length === 0) {
      list.createDiv({ cls: 'property-icons-empty', text: L.noCustomIcons });
      return;
    }
    for (const custom of this.plugin.settings.customIcons) {
      const row = new Setting(list).setName(custom.name);
      const preview = row.nameEl.createSpan({ cls: 'property-icons-custom-preview' });
      preview.createEl('img', { attr: { src: custom.dataUri, alt: '' } });
      row.addExtraButton((b) => {
        b.setIcon('trash')
          .setTooltip(L.deleteIconTooltip)
          .onClick(async () => {
            this.plugin.settings.customIcons = this.plugin.settings.customIcons.filter((c) => c.id !== custom.id);
            // 用到该图标的规则回退到第一个内置图标，避免空图标
            for (const rule of this.plugin.settings.rules) {
              if (rule.icon === `custom:${custom.id}`) rule.icon = `builtin:${BUILTIN_ICONS[0].id}`;
            }
            await this.persist();
            this.display();
          });
      });
    }
  }

  private async handleUpload(file: File): Promise<void> {
    const L = t();
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      new Notice(L.unsupportedFormat(ext, ACCEPTED_EXT.join(' / ')));
      return;
    }
    if (file.size > CUSTOM_ICON_MAX_BYTES) {
      new Notice(L.imageTooBig(Math.round(file.size / 1024)));
      return;
    }
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }).catch(() => '');

    if (!dataUri) {
      new Notice(L.readImageFailed);
      return;
    }
    this.plugin.settings.customIcons.push({
      id: genId('icon'),
      name: file.name.replace(/\.[^.]+$/, ''),
      dataUri,
    });
    await this.persist();
    this.display();
  }
}
