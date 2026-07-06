// 让 TS 认识 `import x from './foo.svg'`（esbuild 用 text loader 把 .svg 内联为字符串）。
declare module '*.svg' {
  const content: string;
  export default content;
}
