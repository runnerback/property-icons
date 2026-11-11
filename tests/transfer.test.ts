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

const REMOVE = Symbol('remove');

/** 在一份合法导出文件上按「路径 → 新值」改若干处（值为 REMOVE 表示删掉该字段），返回改后的文本。 */
function exported(...changes: [path: string, value: unknown][]): string {
  const file: unknown = JSON.parse(serializeSettings(SETTINGS, '2026-11-11T12:00:00.000Z'));
  for (const [path, value] of changes) {
    const keys = path.split(/[.[\]]+/).filter(Boolean);
    let node = file as Record<string, unknown>;
    for (const key of keys.slice(0, -1)) node = node[key] as Record<string, unknown>;
    const last = keys[keys.length - 1];
    if (value === REMOVE) delete node[last];
    else node[last] = value;
  }
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
  const file = JSON.parse(serializeSettings({ ...SETTINGS, legacy: 1 } as PropertyIconsSettings, '2026-11-11T12:00:00.000Z')) as Record<string, object>;
  assert.deepEqual(Object.keys(file), ['format', 'version', 'exportedAt', 'settings']);
  assert.equal(file.exportedAt, '2026-11-11T12:00:00.000Z');
  assert.deepEqual(Object.keys(file.settings), ['rules', 'customIcons', 'iconSize']);
});

test('不是本插件的导出文件', () => {
  for (const text of ['', '不是 JSON', '[]', 'null', '{}', JSON.stringify(SETTINGS), exported(['format', 'other'])]) {
    assert.equal(failure(text).reason, 'not-export', text.slice(0, 20));
  }
});

test('由更新版本导出的文件不导入', () => {
  assert.equal(failure(exported(['version', 2])).reason, 'newer-version');
});

test('内容不合法时指出位置，整份不导入', () => {
  // 每项：把这个路径改成这个值，报错位置应当就是这个路径
  const cases: [path: string, value: unknown][] = [
    ['version', '1'],
    ['settings', []],
    ['settings.iconSize', 40],
    ['settings.iconSize', 16.5],
    ['settings.iconSize', REMOVE],
    ['settings.rules', {}],
    ['settings.rules[1]', 'x'],
    ['settings.rules[0].id', REMOVE],
    ['settings.rules[0].name', 1],
    ['settings.rules[1].op', 'XOR'],
    ['settings.rules[0].enabled', 'true'],
    ['settings.rules[0].icon', 'weibo'],
    ['settings.rules[0].conditions', null],
    ['settings.rules[1].conditions[1].value', 3],
    ['settings.rules[1].conditions[0].match', 'regex'],
    ['settings.customIcons', REMOVE],
    ['settings.customIcons[0].name', REMOVE],
    ['settings.customIcons[0].dataUri', 'https://example.com/a.png'],
  ];
  for (const [path, value] of cases) {
    const e = failure(exported([path, value]));
    assert.deepEqual([e.reason, e.where], ['bad-content', path]);
  }
});

test('文件里多出来的字段不带进配置', () => {
  const parsed = parseSettings(
    exported(
      ['settings.extra', 1],
      ['settings.rules[0].extra', 1],
      ['settings.rules[0].conditions[0].extra', 1],
      ['settings.customIcons[0].extra', 1],
    ),
  );
  assert.deepEqual(parsed, SETTINGS);
});

test('空配置可以导出导入', () => {
  const empty: PropertyIconsSettings = { rules: [], customIcons: [], iconSize: 16 };
  assert.deepEqual(parseSettings(serializeSettings(empty, '2026-11-11T12:00:00.000Z')), empty);
});
