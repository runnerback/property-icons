// 数据模型：规则组 + 自定义图标。全部持久化到插件 data.json。

/** 条件匹配方式：精确等于 / 包含（子串；数组属性按任一元素判断）。 */
export type ConditionMatch = 'equals' | 'contains';

/** 单个条件：某个属性(property) 按 match 方式匹配 某个值(value)。 */
export interface Condition {
  property: string;
  value: string;
  /** 缺省（旧数据）按 'equals' 处理，向后兼容。 */
  match?: ConditionMatch;
}

/** 组内条件的组合方式：全 AND 或 全 OR（同一组只用一种，见需求约定）。 */
export type RuleOperator = 'AND' | 'OR';

/**
 * 图标引用：
 *  - 'builtin:<id>'  内置品牌图标（见 icons.ts BUILTIN_ICON_IDS）
 *  - 'custom:<id>'   用户上传的自定义图标（见 CustomIcon.id）
 */
export type IconRef = string;

/** 一组规则：满足条件后，在命中文件名前显示 icon。 */
export interface Rule {
  id: string;
  name: string;
  op: RuleOperator;
  conditions: Condition[];
  icon: IconRef;
  enabled: boolean;
}

/** 用户上传的自定义图标，图片以 data URI（base64）内联保存，便携无外部文件。 */
export interface CustomIcon {
  id: string;
  name: string;
  /** data:image/png;base64,... 或 data:image/svg+xml;base64,... */
  dataUri: string;
}

export interface PropertyIconsSettings {
  rules: Rule[];
  customIcons: CustomIcon[];
  /** 徽标像素尺寸（文件名前的图标大小）。 */
  iconSize: number;
}

export const DEFAULT_SETTINGS: PropertyIconsSettings = {
  rules: [],
  customIcons: [],
  iconSize: 16,
};
