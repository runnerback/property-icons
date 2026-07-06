// English strings (default / fallback language).

export interface Messages {
  heading: string;
  headingDesc: string;
  iconSize: string;
  iconSizeDesc: string;
  addRuleGroup: string;
  ruleDefaultName: (n: number) => string;
  ruleNamePlaceholder: string;
  enableRuleTooltip: string;
  deleteRuleTooltip: string;
  conditionCombine: string;
  opAll: string;
  opAny: string;
  addCondition: string;
  iconLabel: string;
  propertyPlaceholder: string;
  valuePlaceholder: string;
  deleteConditionTooltip: string;
  customIcons: string;
  customIconsDesc: string;
  uploadIcon: string;
  noCustomIcons: string;
  deleteIconTooltip: string;
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
  addRuleGroup: '+ Add rule group',
  ruleDefaultName: (n) => `Rule ${n}`,
  ruleNamePlaceholder: 'Rule name',
  enableRuleTooltip: 'Enable this rule',
  deleteRuleTooltip: 'Delete rule group',
  conditionCombine: 'Combine conditions',
  opAll: 'AND (all must match)',
  opAny: 'OR (any matches)',
  addCondition: '+ Add condition',
  iconLabel: 'Icon',
  propertyPlaceholder: 'Property, e.g. publish_status',
  valuePlaceholder: 'Value, e.g. done',
  deleteConditionTooltip: 'Delete this condition',
  customIcons: 'Custom icons',
  customIconsDesc: 'Upload your own image as an icon. Supports jpg / jpeg / png / svg (≤ 256KB each).',
  uploadIcon: 'Upload icon',
  noCustomIcons: 'No custom icons yet',
  deleteIconTooltip: 'Delete this icon',
  unsupportedFormat: (ext, accepted) => `Unsupported format: .${ext} (only ${accepted})`,
  imageTooBig: (kb) => `Image too large (${kb}KB); the limit is 256KB`,
  readImageFailed: 'Failed to read the image',
};
