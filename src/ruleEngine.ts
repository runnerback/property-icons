import { Condition, Rule } from './types';

/** frontmatter 的类型：任意键值对（可能是字符串/数字/布尔/数组）。 */
export type Frontmatter = Record<string, unknown> | undefined | null;

/**
 * 单个条件是否命中：按 cond.match 匹配（缺省 equals，旧数据兼容）。
 * - equals：属性值「精确等于」目标值；数组属性任一元素精确等于即命中。
 * - contains：属性值「包含」目标子串；数组属性任一元素包含即命中。
 * - 值统一转成字符串比较，所以 status: done 与 "done" 都能匹配。
 */
export function conditionMatches(fm: Frontmatter, cond: Condition): boolean {
  if (!fm || !cond.property) return false;
  const raw = fm[cond.property];
  if (raw === undefined || raw === null) return false;
  const target = cond.value;
  const hit = cond.match === 'contains'
    ? (value: unknown) => target !== '' && String(value).includes(target)
    : (value: unknown) => String(value) === target;
  if (Array.isArray(raw)) {
    return raw.some(hit);
  }
  return hit(raw);
}

/**
 * 一组规则是否命中：组内条件按单一操作符组合（全 AND 或全 OR）。
 * 无条件的规则视为不命中（避免误伤全部文件）。
 */
export function ruleMatches(fm: Frontmatter, rule: Rule): boolean {
  if (!rule.enabled) return false;
  const conds = rule.conditions.filter((c) => c.property);
  if (conds.length === 0) return false;
  return rule.op === 'AND'
    ? conds.every((c) => conditionMatches(fm, c))
    : conds.some((c) => conditionMatches(fm, c));
}

/**
 * 返回命中该 frontmatter 的所有规则（按规则数组顺序，保留顺序 → 多个图标按配置顺序排列）。
 */
export function matchingRules(fm: Frontmatter, rules: Rule[]): Rule[] {
  return rules.filter((rule) => ruleMatches(fm, rule));
}
