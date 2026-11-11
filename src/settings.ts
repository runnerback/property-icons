import { App, Notice, PluginSettingTab } from 'obsidian';
import type { Setting, SettingDefinitionItem } from 'obsidian';
import type PropertyIconsPlugin from './main';
import { CustomIcon, Rule } from './types';
import { BUILTIN_ICONS, builtinSvgEl } from './icons';
import { t } from './i18n';
import { RuleEditModal } from './ruleModal';

const CUSTOM_ICON_MAX_BYTES = 256 * 1024; // 单张自定义图标上限 256KB（存 data.json，别撑太大）
const ACCEPTED_EXT = ['jpg', 'jpeg', 'png', 'svg'];

/** 只有说明文字的行要带上这个空 render：Obsidian 1.15 起，既无名称也无控件 / render 的行不再渲染。 */
const renderNothing = (): void => {};

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 按图标引用生成列表行里的小预览（内置=SVG，自定义=img）；引用无效返回 null（与 decorator 的处理一致）。 */
function iconPreviewEl(ref: string, customIcons: CustomIcon[]): HTMLElement | null {
  const wrap = createSpan({ cls: 'property-icons-preview' });
  if (ref.startsWith('builtin:')) {
    const svg = builtinSvgEl(ref.slice('builtin:'.length));
    if (!svg) return null;
    wrap.appendChild(svg);
    return wrap;
  }
  if (ref.startsWith('custom:')) {
    const custom = customIcons.find((c) => c.id === ref.slice('custom:'.length));
    if (!custom) return null;
    wrap.createEl('img', { attr: { src: custom.dataUri, alt: '' } });
    return wrap;
  }
  return null;
}

/**
 * 设置页：Obsidian 1.13 声明式 Settings API（getSettingDefinitions）。
 * 结构：顶部 group（说明 + 图标大小滑块）→ 规则组 list（增/删/拖拽排序，行内启用开关 + 编辑、复制按钮，
 * 详细编辑在 RuleEditModal）→ 自定义图标 list（上传/删除）→ 图标格式说明脚注。
 * 增删改后统一 persist()（保存 + 刷新文件树），结构变化再 update() 重渲染（框架重绘时保留滚动位置）。
 */
export class PropertyIconsSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: PropertyIconsPlugin) {
    super(app, plugin);
  }

  private async persist(): Promise<void> {
    await this.plugin.saveSettings();
    this.plugin.refreshDecorations();
  }

  /** 声明式 control（目前只有 iconSize 滑块）的写入口：写 settings → 保存 → 立刻刷新文件树。 */
  async setControlValue(key: string, value: unknown): Promise<void> {
    (this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
    await this.persist();
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const L = t();
    const settings = this.plugin.settings;

    return [
      {
        type: 'group',
        heading: L.heading,
        items: [
          // 无 control 的说明行：只承载 headingDesc
          { name: '', desc: L.headingDesc, searchable: false, render: renderNothing },
          {
            name: L.iconSize,
            desc: L.iconSizeDesc,
            control: { type: 'slider', key: 'iconSize', min: 12, max: 24, step: 1, defaultValue: 16 },
          },
        ],
      },
      {
        type: 'list',
        heading: L.rulesHeading,
        emptyState: L.noRules,
        addItem: { name: L.addRuleGroup, action: () => void this.createRule() },
        onReorder: (oldIndex, newIndex) => {
          const [moved] = settings.rules.splice(oldIndex, 1);
          settings.rules.splice(newIndex, 0, moved);
          this.update();
          void this.persist();
        },
        onDelete: (index) => {
          settings.rules.splice(index, 1);
          this.update();
          void this.persist();
        },
        items: settings.rules.map((rule, i) => ({
          name: rule.name || L.ruleDefaultName(i + 1),
          desc: this.describeConditions(rule),
          searchable: false,
          render: (setting: Setting) => this.renderRuleRow(setting, rule),
        })),
      },
      {
        type: 'list',
        heading: L.customIcons,
        emptyState: L.noCustomIcons,
        addItem: { name: L.uploadIcon, action: () => this.pickIconFile() },
        onDelete: (index) => this.deleteCustomIcon(index),
        items: settings.customIcons.map((icon) => ({
          name: icon.name,
          searchable: false,
          render: (setting: Setting) => {
            const preview = iconPreviewEl(`custom:${icon.id}`, settings.customIcons);
            if (preview) setting.nameEl.prepend(preview);
          },
        })),
      },
      // list 头部没有 desc 位，格式/大小限制作为脚注放在图标列表下方
      { name: '', desc: L.customIconsDesc, render: renderNothing },
    ];
  }

  // ── 规则组 ──

  /** 条件摘要：`prop = val 且 prop2 包含 val2`；无有效条件时提示尚未设置。 */
  private describeConditions(rule: Rule): string {
    const L = t();
    const parts = rule.conditions
      .filter((c) => c.property)
      .map((c) => `${c.property} ${c.match === 'contains' ? L.matchContains : L.matchEquals} ${c.value}`);
    if (parts.length === 0) return L.noConditions;
    return parts.join(rule.op === 'AND' ? L.joinAnd : L.joinOr);
  }

  /** 列表行：名称前图标预览 + 启用开关 + 编辑按钮 + 复制按钮（框架另行追加删除 X 与拖拽把手）。 */
  private renderRuleRow(setting: Setting, rule: Rule): void {
    const L = t();
    const preview = iconPreviewEl(rule.icon, this.plugin.settings.customIcons);
    if (preview) setting.nameEl.prepend(preview);

    setting.addToggle((tg) => {
      tg.setTooltip(L.enableRuleTooltip)
        .setValue(rule.enabled)
        .onChange(async (v) => {
          rule.enabled = v;
          await this.persist();
        });
    });
    setting.addExtraButton((b) => {
      b.setIcon('lucide-pencil')
        .setTooltip(L.editRule)
        .onClick(() => this.openRuleModal(rule));
    });
    setting.addExtraButton((b) => {
      b.setIcon('lucide-copy')
        .setTooltip(L.duplicateRule)
        .onClick(() => void this.duplicateRule(rule));
    });
  }

  private createRule(): Promise<void> {
    const L = t();
    const rules = this.plugin.settings.rules;
    return this.insertRule(rules.length, {
      id: genId('rule'),
      name: this.freeName(L.ruleDefaultName, rules.length + 1),
      op: 'AND',
      conditions: [{ property: '', value: '' }],
      icon: `builtin:${BUILTIN_ICONS[0].id}`,
      enabled: true,
    });
  }

  /** 复制一条规则组，放在原规则组的正下方。 */
  private duplicateRule(rule: Rule): Promise<void> {
    const L = t();
    const index = this.plugin.settings.rules.indexOf(rule);
    const sourceName = rule.name || L.ruleDefaultName(index + 1);
    return this.insertRule(index + 1, {
      ...rule,
      id: genId('rule'),
      name: this.freeName((n) => L.ruleCopyName(sourceName, n), 1),
      conditions: rule.conditions.map((c) => ({ ...c })),
    });
  }

  /** 把新规则组放到 index 位置，存盘、重绘列表，并直接打开编辑弹窗。 */
  private async insertRule(index: number, rule: Rule): Promise<void> {
    this.plugin.settings.rules.splice(index, 0, rule);
    await this.persist();
    this.update();
    this.openRuleModal(rule);
  }

  /** 从 nameOf(from) 起取第一个没被占用的名称：框架拿名称当列表行的标识，重名会报错。 */
  private freeName(nameOf: (n: number) => string, from: number): string {
    const taken = new Set(this.plugin.settings.rules.map((r) => r.name));
    let n = from;
    while (taken.has(nameOf(n))) n++;
    return nameOf(n);
  }

  private openRuleModal(rule: Rule): void {
    new RuleEditModal(this.app, this.plugin, rule, () => this.update()).open();
  }

  // ── 自定义图标 ──

  /**
   * 点 + 时在设置页里临时放一个隐藏的 file input 触发系统选图框，选完或取消后移除。
   * input 必须挂在设置页里：Obsidian 1.15 起设置是独立窗口，用全局 createEl 建出来的 input 属于主窗口，
   * 拿不到这次点击的用户激活，选图框会被浏览器拦掉（点了没反应）。
   */
  private pickIconFile(): void {
    const input = this.containerEl.createEl('input', { type: 'file', attr: { accept: '.jpg,.jpeg,.png,.svg,image/*' } });
    input.hide();
    input.addEventListener('cancel', () => input.remove());
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (file) void this.handleUpload(file);
    });
    input.click();
  }

  private deleteCustomIcon(index: number): void {
    const [removed] = this.plugin.settings.customIcons.splice(index, 1);
    // 用到该图标的规则回退到第一个内置图标，避免空图标
    for (const rule of this.plugin.settings.rules) {
      if (rule.icon === `custom:${removed.id}`) rule.icon = `builtin:${BUILTIN_ICONS[0].id}`;
    }
    this.update();
    void this.persist();
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
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
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
    this.update();
  }
}
