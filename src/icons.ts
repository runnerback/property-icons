// 内置品牌图标。
//
// 说明：这里的 SVG 是「简化的、以品牌主色 + 极简白色符号」自绘的可辨识徽标，
// 便于在 16px 文件树里一眼区分平台；并非各平台官方 logo 的逐像素复制。
// 各平台名称与标识为其各自商标持有者所有（详见 README 商标声明）。
// 需要精确的官方 logo，可用设置里的「自定义上传」功能自行导入。

export interface BuiltinIcon {
  id: string;
  label: string;
  svg: string;
}

const tile = (color: string, inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">` +
  `<rect x="2" y="2" width="20" height="20" rx="5" fill="${color}"/>${inner}</svg>`;

export const BUILTIN_ICONS: BuiltinIcon[] = [
  {
    id: 'bilibili',
    label: 'bilibili',
    svg: tile('#00AEEC',
      '<path d="M8 5l2 2M16 5l-2 2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>' +
      '<rect x="6" y="8.5" width="12" height="8" rx="2.5" fill="none" stroke="#fff" stroke-width="1.6"/>' +
      '<circle cx="9.5" cy="12.5" r="1" fill="#fff"/><circle cx="14.5" cy="12.5" r="1" fill="#fff"/>'),
  },
  {
    id: 'xiaohongshu',
    label: '小红书',
    svg: tile('#FF2442',
      '<rect x="6.5" y="6" width="11" height="12" rx="1.6" fill="none" stroke="#fff" stroke-width="1.6"/>' +
      '<path d="M12 6v12" stroke="#fff" stroke-width="1.4"/>'),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    svg: tile('#FF0000',
      '<path d="M10 9.2l5 2.8-5 2.8z" fill="#fff"/>'),
  },
  {
    id: 'douyin',
    label: '抖音',
    svg: tile('#161823',
      '<path d="M13.5 6v7.6a2.6 2.6 0 1 1-2-2.53" fill="none" stroke="#25F4EE" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M13.5 6c.4 1.7 1.7 2.9 3.3 3.1" fill="none" stroke="#FE2C55" stroke-width="1.6" stroke-linecap="round"/>'),
  },
  {
    id: 'weibo',
    label: '微博',
    svg: tile('#E6162D',
      '<ellipse cx="11.5" cy="13.5" rx="4.5" ry="3.3" fill="none" stroke="#fff" stroke-width="1.6"/>' +
      '<circle cx="16.5" cy="8.5" r="1.6" fill="none" stroke="#FBBF24" stroke-width="1.4"/>'),
  },
  {
    id: 'wechat',
    label: '微信',
    svg: tile('#07C160',
      '<ellipse cx="10" cy="10.5" rx="4" ry="3.2" fill="none" stroke="#fff" stroke-width="1.5"/>' +
      '<ellipse cx="15" cy="14" rx="3.4" ry="2.8" fill="none" stroke="#fff" stroke-width="1.5"/>'),
  },
  {
    id: 'x',
    label: 'X',
    svg: tile('#000000',
      '<path d="M8 7l8 10M16 7L8 17" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    svg: tile('#E4405F',
      '<rect x="7" y="7" width="10" height="10" rx="3" fill="none" stroke="#fff" stroke-width="1.6"/>' +
      '<circle cx="12" cy="12" r="2.6" fill="none" stroke="#fff" stroke-width="1.6"/>' +
      '<circle cx="15.6" cy="8.4" r="0.9" fill="#fff"/>'),
  },
];

const BUILTIN_MAP: Record<string, BuiltinIcon> = Object.fromEntries(
  BUILTIN_ICONS.map((i) => [i.id, i]),
);

export function getBuiltinIcon(id: string): BuiltinIcon | undefined {
  return BUILTIN_MAP[id];
}

/** 把内置图标解析成 <svg> 元素（不用 innerHTML；SVG 为本插件自带常量，可信）。 */
export function builtinSvgEl(id: string): SVGElement | null {
  const icon = BUILTIN_MAP[id];
  if (!icon) return null;
  const doc = new DOMParser().parseFromString(icon.svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') return null;
  return root as unknown as SVGElement;
}
