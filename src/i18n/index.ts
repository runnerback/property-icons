// 语言检测 + 取词。默认英文；检测到中文界面自动切中文。
//
// Obsidian 把界面语言存在 localStorage 的 'language' 键（简体中文 = 'zh'，
// 繁体 = 'zh-TW'，英文默认时可能为空）。切语言需重开 Obsidian，故加载时判定一次即可。

import { en, Messages } from './en';
import { zh } from './zh';

let current: Messages = en;

function detectLang(): string {
  try {
    return (window.localStorage.getItem('language') || 'en').toLowerCase();
  } catch {
    return 'en';
  }
}

/** 插件加载时调用一次，确定当前语言。 */
export function initLocale(): void {
  const lang = detectLang();
  current = lang.startsWith('zh') ? zh : en; // 目前提供 en / zh，其余回退英文
}

/** 取当前语言的文案对象：用法 t().addRuleGroup / t().ruleDefaultName(1)。 */
export function t(): Messages {
  return current;
}
