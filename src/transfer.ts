// 配置导出 / 导入：整份设置（规则组、自定义图标、图标大小）与一个 JSON 文件互转。
// 纯逻辑，不依赖 Obsidian；单测见 test/transfer.test.ts。

import { ICON_SIZE_MAX, ICON_SIZE_MIN } from './types';
import type { Condition, CustomIcon, PropertyIconsSettings, Rule } from './types';

const FORMAT = 'property-icons-settings';
const VERSION = 1;

/** 导入失败的原因：不是本插件的导出文件 / 由更新版本导出 / 内容某处不合法。 */
export type ImportFailure = 'not-export' | 'newer-version' | 'bad-content';

export class ImportError extends Error {
  readonly reason: ImportFailure;
  /** 仅 bad-content 有值：文件里出错的位置，如 settings.rules[2].op。 */
  readonly where: string;

  constructor(reason: ImportFailure, where = '') {
    super(where ? `${reason}: ${where}` : reason);
    this.reason = reason;
    this.where = where;
  }
}

/** 导出文件的内容。只写三项已知设置，不带其他字段。 */
export function serializeSettings(settings: PropertyIconsSettings, exportedAt: string): string {
  const { rules, customIcons, iconSize } = settings;
  return JSON.stringify({ format: FORMAT, version: VERSION, exportedAt, settings: { rules, customIcons, iconSize } }, null, 2);
}

/** 解析导出文件并逐项校验；任何一处不对就抛 ImportError，不做猜测性修补。文件里多出来的字段不带进配置。 */
export function parseSettings(text: string): PropertyIconsSettings {
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    throw new ImportError('not-export');
  }
  if (typeof file !== 'object' || file === null || (file as Fields).format !== FORMAT) throw new ImportError('not-export');
  const { version, settings } = file as Fields;
  if (typeof version !== 'number') fail('version');
  if (version > VERSION) throw new ImportError('newer-version');

  const s = fields(settings, 'settings');
  const { iconSize } = s;
  if (typeof iconSize !== 'number' || !Number.isInteger(iconSize) || iconSize < ICON_SIZE_MIN || iconSize > ICON_SIZE_MAX) {
    fail('settings.iconSize');
  }
  return {
    rules: list(s.rules, 'settings.rules').map((r, i) => rule(r, `settings.rules[${i}]`)),
    customIcons: list(s.customIcons, 'settings.customIcons').map((c, i) => customIcon(c, `settings.customIcons[${i}]`)),
    iconSize,
  };
}

// ── 逐项校验 ──

type Fields = Record<string, unknown>;

function fail(where: string): never {
  throw new ImportError('bad-content', where);
}

function fields(v: unknown, where: string): Fields {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(where);
  return v as Fields;
}

function list(v: unknown, where: string): unknown[] {
  if (!Array.isArray(v)) fail(where);
  return v;
}

function text(v: unknown, where: string): string {
  if (typeof v !== 'string') fail(where);
  return v;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], where: string): T {
  if (!allowed.includes(v as T)) fail(where);
  return v as T;
}

function rule(v: unknown, where: string): Rule {
  const r = fields(v, where);
  const { enabled } = r;
  if (typeof enabled !== 'boolean') fail(`${where}.enabled`);
  const icon = text(r.icon, `${where}.icon`);
  if (!/^(builtin|custom):./.test(icon)) fail(`${where}.icon`);
  return {
    id: text(r.id, `${where}.id`),
    name: text(r.name, `${where}.name`),
    op: oneOf(r.op, ['AND', 'OR'] as const, `${where}.op`),
    conditions: list(r.conditions, `${where}.conditions`).map((c, i) => condition(c, `${where}.conditions[${i}]`)),
    icon,
    enabled,
  };
}

function condition(v: unknown, where: string): Condition {
  const c = fields(v, where);
  const out: Condition = { property: text(c.property, `${where}.property`), value: text(c.value, `${where}.value`) };
  // match 可以没有：旧数据不带，按「精确等于」处理
  if (c.match !== undefined) out.match = oneOf(c.match, ['equals', 'contains'] as const, `${where}.match`);
  return out;
}

function customIcon(v: unknown, where: string): CustomIcon {
  const c = fields(v, where);
  const dataUri = text(c.dataUri, `${where}.dataUri`);
  if (!dataUri.startsWith('data:image/')) fail(`${where}.dataUri`);
  return { id: text(c.id, `${where}.id`), name: text(c.name, `${where}.name`), dataUri };
}
