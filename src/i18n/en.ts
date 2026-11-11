// English strings (default / fallback language).

export interface Messages {
  heading: string;
  headingDesc: string;
  iconSize: string;
  iconSizeDesc: string;
  rulesHeading: string;
  noRules: string;
  addRuleGroup: string;
  editRule: string;
  duplicateRule: string;
  ruleDefaultName: (n: number) => string;
  /** 复制出来的规则组名称；n 从 1 起，同名已存在时递增。 */
  ruleCopyName: (name: string, n: number) => string;
  ruleName: string;
  ruleNamePlaceholder: string;
  enableRuleTooltip: string;
  conditionCombine: string;
  opAll: string;
  opAny: string;
  joinAnd: string;
  joinOr: string;
  noConditions: string;
  addCondition: string;
  iconLabel: string;
  propertyPlaceholder: string;
  valuePlaceholder: string;
  matchEquals: string;
  matchContains: string;
  matchTooltip: string;
  deleteConditionTooltip: string;
  customIcons: string;
  customIconsDesc: string;
  uploadIcon: string;
  noCustomIcons: string;
  unsupportedFormat: (ext: string, accepted: string) => string;
  imageTooBig: (kb: number) => string;
  readImageFailed: string;
}

export const en: Messages = {
  heading: 'Rule groups → file explorer icons',
  headingDesc:
    'Give each rule group some "property = value" conditions (combined with AND/OR within the group). Matching notes show the group\'s icon before their name. Files matching several groups show several icons.',
  iconSize: 'Icon size',
  iconSizeDesc: 'Pixel size of the badge shown before the file name.',
  rulesHeading: 'Rule groups',
  noRules: 'No rule groups yet. Click + to add one.',
  addRuleGroup: 'Add rule group',
  editRule: 'Edit rule group',
  duplicateRule: 'Duplicate rule group',
  ruleDefaultName: (n) => `Rule ${n}`,
  ruleCopyName: (name, n) => (n === 1 ? `${name} copy` : `${name} copy ${n}`),
  ruleName: 'Name',
  ruleNamePlaceholder: 'Rule name',
  enableRuleTooltip: 'Enable this rule',
  conditionCombine: 'Combine conditions',
  opAll: 'AND (all must match)',
  opAny: 'OR (any matches)',
  joinAnd: ' AND ',
  joinOr: ' OR ',
  noConditions: 'No conditions yet',
  addCondition: '+ Add condition',
  iconLabel: 'Icon',
  propertyPlaceholder: 'Property, e.g. publish_status',
  valuePlaceholder: 'Value, e.g. done',
  matchEquals: '=',
  matchContains: 'contains',
  matchTooltip: 'Match mode: exact equals or substring contains (arrays match by any element)',
  deleteConditionTooltip: 'Delete this condition',
  customIcons: 'Custom icons',
  customIconsDesc: 'Upload your own image as an icon. Supports jpg / jpeg / png / svg (≤ 256KB each).',
  uploadIcon: 'Upload icon',
  noCustomIcons: 'No custom icons yet',
  unsupportedFormat: (ext, accepted) => `Unsupported format: .${ext} (only ${accepted})`,
  imageTooBig: (kb) => `Image too large (${kb}KB); the limit is 256KB`,
  readImageFailed: 'Failed to read the image',
};
