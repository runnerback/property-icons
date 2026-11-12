// 内置品牌图标。
//
// 11 个平台图标全部使用用户放在 src/icons/platform-ic-sys/ 下的 SVG 源文件
// （构建时 esbuild 以 text loader 内联进 bundle，编辑那些 .svg 后重新 build 即生效）。
// X 是单色标志，源文件用 fill="currentColor" 跟随文字颜色，深色主题下才看得见。
//
// 商标声明见 README：平台名称与标识为其各自持有者所有。

import bilibiliSvg from './icons/platform-ic-sys/bilibili.svg';
import douyinSvg from './icons/platform-ic-sys/douyin.svg';
import instagramSvg from './icons/platform-ic-sys/instagram.svg';
import kuaishouSvg from './icons/platform-ic-sys/kuaishou.svg';
import redNoteSvg from './icons/platform-ic-sys/red-note.svg';
import redditSvg from './icons/platform-ic-sys/reddit.svg';
import weiboSvg from './icons/platform-ic-sys/weibo.svg';
import wechatSvg from './icons/platform-ic-sys/wechat.svg';
import xSvg from './icons/platform-ic-sys/X.svg';
import youtubeSvg from './icons/platform-ic-sys/youtube.svg';
import zhihuSvg from './icons/platform-ic-sys/zhihu.svg';

export interface BuiltinIcon {
  id: string;
  label: string;
  svg: string;
}

export const BUILTIN_ICONS: BuiltinIcon[] = [
  { id: 'bilibili', label: 'bilibili', svg: bilibiliSvg },
  { id: 'xiaohongshu', label: '小红书', svg: redNoteSvg },
  { id: 'youtube', label: 'YouTube', svg: youtubeSvg },
  { id: 'douyin', label: '抖音', svg: douyinSvg },
  { id: 'kuaishou', label: '快手', svg: kuaishouSvg },
  { id: 'weibo', label: '微博', svg: weiboSvg },
  { id: 'zhihu', label: '知乎', svg: zhihuSvg },
  { id: 'wechat', label: '微信', svg: wechatSvg },
  { id: 'x', label: 'X', svg: xSvg },
  { id: 'reddit', label: 'Reddit', svg: redditSvg },
  { id: 'instagram', label: 'Instagram', svg: instagramSvg },
];

const BUILTIN_MAP: Record<string, BuiltinIcon> = Object.fromEntries(
  BUILTIN_ICONS.map((i) => [i.id, i]),
);

export function getBuiltinIcon(id: string): BuiltinIcon | undefined {
  return BUILTIN_MAP[id];
}

/** 去掉 SVG 源文件里的 XML 声明与 DOCTYPE，便于 DOMParser 干净解析。 */
function stripSvgProlog(svg: string): string {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/i, '')
    .replace(/<!DOCTYPE[\s\S]*?>/i, '')
    .trim();
}

/** 把内置图标解析成 <svg> 元素（不用 innerHTML）。 */
export function builtinSvgEl(id: string): SVGElement | null {
  const icon = BUILTIN_MAP[id];
  if (!icon) return null;
  const doc = new DOMParser().parseFromString(stripSvgProlog(icon.svg), 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') return null;
  return root as unknown as SVGElement;
}
