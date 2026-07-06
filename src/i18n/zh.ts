// 简体中文字符串。

import type { Messages } from './en';

export const zh: Messages = {
  heading: '规则组 → 文件树图标',
  headingDesc:
    '为每组规则配置若干「属性 = 值」条件（组内统一用 且/或），命中的笔记会在文件名前显示该组图标。命中多组则依次显示多个图标。',
  iconSize: '图标大小',
  iconSizeDesc: '文件名前徽标的像素大小。',
  addRuleGroup: '+ 新增规则组',
  ruleDefaultName: (n) => `规则 ${n}`,
  ruleNamePlaceholder: '规则名称',
  enableRuleTooltip: '启用该规则',
  deleteRuleTooltip: '删除规则组',
  conditionCombine: '条件组合',
  opAll: '且（全部满足）',
  opAny: '或（任一满足）',
  addCondition: '+ 添加条件',
  iconLabel: '图标',
  propertyPlaceholder: '属性名，如 publish_status',
  valuePlaceholder: '值，如 done',
  deleteConditionTooltip: '删除该条件',
  customIcons: '自定义图标',
  customIconsDesc: '上传自己的图片作为图标，支持 jpg / jpeg / png / svg（单张 ≤ 256KB）。',
  uploadIcon: '上传图标',
  noCustomIcons: '暂无自定义图标',
  deleteIconTooltip: '删除该图标',
  unsupportedFormat: (ext, accepted) => `不支持的格式：.${ext}（仅支持 ${accepted}）`,
  imageTooBig: (kb) => `图片过大（${kb}KB），上限 256KB`,
  readImageFailed: '读取图片失败',
};
