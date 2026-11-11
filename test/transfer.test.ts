// 配置导出 / 导入（src/transfer.ts）单测：npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ImportError, parseSettings, serializeSettings } from '../src/transfer';
import type { PropertyIconsSettings } from '../src/types';

const SETTINGS: PropertyIconsSettings = {
  rules: [
    { id: 'rule-a', name: '微博', op: 'AND', conditions: [{ property: 'platform', value: 'wb' }], icon: 'builtin:weibo', enabled: true },
    {
      id: 'rule-b',
      name: '已发布',
      op: 'OR',
      conditions: [
        { property: 'publish_status', value: 'done', match: 'equals' },
        { property: 'tags', value: '发布', match: 'contains' },
      ],
      icon: 'custom:icon-1',
      enabled: false,
    },
  ],
  customIcons: [{ id: 'icon-1', name: '我的图标', dataUri: 'data:image/png;base64,AAAA' }],
  iconSize: 18,
};

/** 在一份合法导出文件上改一处，返回改后的文本。 */
function exported(change: (file: any) => void = () => {}): string {
  const file = JSON.parse(serializeSettings(SETTINGS, '2026-11-11T12:00:00.000Z'));
  change(file);
  return JSON.stringify(file);
}

function failure(text: string): ImportError {
  try {
    parseSettings(text);
  } catch (e) {
    assert.ok(e instanceof ImportError, `抛的不是 ImportError：${String(e)}`);
    return e;
  }
  throw new assert.AssertionError({ message: '应当导入失败，实际通过了' });
}

test('导出再导入，配置原样还原', () => {
  assert.deepEqual(parseSettings(exported()), SETTINGS);
});

test('导出文件只含格式标记、版本、时间和三项设置', () => {
  const file = JSON.parse(serializeSettings({ ...SETTINGS, legacy: 1 } as PropertyIconsSettings, '2026-11-11T12:00:00.000Z'));
  assert.deepEqual(Object.keys(file), ['format', 'version', 'exportedAt', 'settings']);
  assert.equal(file.exportedAt, '2026-11-11T12:00:00.000Z');
  assert.deepEqual(Object.keys(file.settings), ['rules', 'customIcons', 'iconSize']);
});

test('不是本插件的导出文件', () => {
  for (const text of ['', '不是 JSON', '[]', 'null', '{}', JSON.stringify(SETTINGS), exported((f) => (f.format = 'other'))]) {
    assert.equal(failure(text).reason, 'not-export', text.slice(0, 20));
  }
});

test('由更新版本导出的文件不导入', () => {
  assert.equal(failure(exported((f) => (f.version = 2))).reason, 'newer-version');
});

test('内容不合法时指出位置，整份不导入', () => {
  const cases: [string, (f: any) => void][] = [
    ['version', (f) => (f.version = '1')],
    ['settings', (f) => (f.settings = [])],
    ['settings.iconSize', (f) => (f.settings.iconSize = 40)],
    ['settings.iconSize', (f) => (f.settings.iconSize = 16.5)],
    ['settings.iconSize', (f) => delete f.settings.iconSize],
    ['settings.rules', (f) => (f.settings.rules = {})],
    ['settings.rules[1]', (f) => (f.settings.rules[1] = 'x')],
    ['settings.rules[0].id', (f) => delete f.settings.rules[0].id],
    ['settings.rules[0].name', (f) => (f.settings.rules[0].name = 1)],
    ['settings.rules[1].op', (f) => (f.settings.rules[1].op = 'XOR')],
    ['settings.rules[0].enabled', (f) => (f.settings.rules[0].enabled = 'true')],
    ['settings.rules[0].icon', (f) => (f.settings.rules[0].icon = 'weibo')],
    ['settings.rules[0].conditions', (f) => (f.settings.rules[0].conditions = null)],
    ['settings.rules[1].conditions[1].value', (f) => (f.settings.rules[1].conditions[1].value = 3)],
    ['settings.rules[1].conditions[0].match', (f) => (f.settings.rules[1].conditions[0].match = 'regex')],
    ['settings.customIcons', (f) => delete f.settings.customIcons],
    ['settings.customIcons[0].name', (f) => delete f.settings.customIcons[0].name],
    ['settings.customIcons[0].dataUri', (f) => (f.settings.customIcons[0].dataUri = 'https://example.com/a.png')],
  ];
  for (const [where, change] of cases) {
    const e = failure(exported(change));
    assert.deepEqual([e.reason, e.where], ['bad-content', where]);
  }
});

test('文件里多出来的字段不带进配置', () => {
  const parsed = parseSettings(
    exported((f) => {
      f.settings.extra = 1;
      f.settings.rules[0].extra = 1;
      f.settings.rules[0].conditions[0].extra = 1;
      f.settings.customIcons[0].extra = 1;
    }),
  );
  assert.deepEqual(parsed, SETTINGS);
});

test('空配置可以导出导入', () => {
  const empty: PropertyIconsSettings = { rules: [], customIcons: [], iconSize: 16 };
  assert.deepEqual(parseSettings(serializeSettings(empty, '2026-11-11T12:00:00.000Z')), empty);
});
