var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PropertyIconsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  rules: [],
  customIcons: [],
  iconSize: 16
};

// src/decorator.ts
var import_obsidian = require("obsidian");

// src/ruleEngine.ts
function conditionMatches(fm, cond) {
  if (!fm || !cond.property)
    return false;
  const raw = fm[cond.property];
  if (raw === void 0 || raw === null)
    return false;
  const target = cond.value;
  if (Array.isArray(raw)) {
    return raw.some((item) => String(item) === target);
  }
  return String(raw) === target;
}
function ruleMatches(fm, rule) {
  if (!rule.enabled)
    return false;
  const conds = rule.conditions.filter((c) => c.property);
  if (conds.length === 0)
    return false;
  return rule.op === "AND" ? conds.every((c) => conditionMatches(fm, c)) : conds.some((c) => conditionMatches(fm, c));
}
function matchingRules(fm, rules) {
  return rules.filter((rule) => ruleMatches(fm, rule));
}

// src/icons.ts
var tile = (color, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><rect x="2" y="2" width="20" height="20" rx="5" fill="${color}"/>${inner}</svg>`;
var BUILTIN_ICONS = [
  {
    id: "bilibili",
    label: "bilibili",
    svg: tile(
      "#00AEEC",
      '<path d="M8 5l2 2M16 5l-2 2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><rect x="6" y="8.5" width="12" height="8" rx="2.5" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="9.5" cy="12.5" r="1" fill="#fff"/><circle cx="14.5" cy="12.5" r="1" fill="#fff"/>'
    )
  },
  {
    id: "xiaohongshu",
    label: "\u5C0F\u7EA2\u4E66",
    svg: tile(
      "#FF2442",
      '<rect x="6.5" y="6" width="11" height="12" rx="1.6" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M12 6v12" stroke="#fff" stroke-width="1.4"/>'
    )
  },
  {
    id: "youtube",
    label: "YouTube",
    svg: tile(
      "#FF0000",
      '<path d="M10 9.2l5 2.8-5 2.8z" fill="#fff"/>'
    )
  },
  {
    id: "douyin",
    label: "\u6296\u97F3",
    svg: tile(
      "#161823",
      '<path d="M13.5 6v7.6a2.6 2.6 0 1 1-2-2.53" fill="none" stroke="#25F4EE" stroke-width="1.6" stroke-linecap="round"/><path d="M13.5 6c.4 1.7 1.7 2.9 3.3 3.1" fill="none" stroke="#FE2C55" stroke-width="1.6" stroke-linecap="round"/>'
    )
  },
  {
    id: "weibo",
    label: "\u5FAE\u535A",
    svg: tile(
      "#E6162D",
      '<ellipse cx="11.5" cy="13.5" rx="4.5" ry="3.3" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="16.5" cy="8.5" r="1.6" fill="none" stroke="#FBBF24" stroke-width="1.4"/>'
    )
  },
  {
    id: "wechat",
    label: "\u5FAE\u4FE1",
    svg: tile(
      "#07C160",
      '<ellipse cx="10" cy="10.5" rx="4" ry="3.2" fill="none" stroke="#fff" stroke-width="1.5"/><ellipse cx="15" cy="14" rx="3.4" ry="2.8" fill="none" stroke="#fff" stroke-width="1.5"/>'
    )
  },
  {
    id: "x",
    label: "X",
    svg: tile(
      "#000000",
      '<path d="M8 7l8 10M16 7L8 17" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'
    )
  },
  {
    id: "instagram",
    label: "Instagram",
    svg: tile(
      "#E4405F",
      '<rect x="7" y="7" width="10" height="10" rx="3" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="15.6" cy="8.4" r="0.9" fill="#fff"/>'
    )
  }
];
var BUILTIN_MAP = Object.fromEntries(
  BUILTIN_ICONS.map((i) => [i.id, i])
);
function getBuiltinIcon(id) {
  return BUILTIN_MAP[id];
}
function builtinSvgEl(id) {
  const icon = BUILTIN_MAP[id];
  if (!icon)
    return null;
  const doc = new DOMParser().parseFromString(icon.svg, "image/svg+xml");
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg")
    return null;
  return root;
}

// src/decorator.ts
var BADGE_CONTAINER_CLASS = "property-icons-badges";
var BADGE_CLASS = "property-icons-badge";
var ExplorerDecorator = class {
  constructor(app, getSettings) {
    this.app = app;
    this.getSettings = getSettings;
    this.observers = [];
    this.debounceTimer = null;
  }
  getExplorerContainers() {
    return this.app.workspace.getLeavesOfType("file-explorer").map((leaf) => {
      var _a;
      return (_a = leaf.view) == null ? void 0 : _a.containerEl;
    }).filter((el) => !!el);
  }
  /** 生成一个图标元素（内置=SVG，自定义=img[data URI]）；无效 icon 返回 null。 */
  createIconEl(iconRef) {
    const settings = this.getSettings();
    const badge = createSpan({ cls: BADGE_CLASS });
    if (iconRef.startsWith("builtin:")) {
      const id = iconRef.slice("builtin:".length);
      const icon = getBuiltinIcon(id);
      const svgEl = builtinSvgEl(id);
      if (!icon || !svgEl)
        return null;
      badge.appendChild(document.importNode(svgEl, true));
      badge.setAttribute("aria-label", icon.label);
      return badge;
    }
    if (iconRef.startsWith("custom:")) {
      const custom = settings.customIcons.find((c) => c.id === iconRef.slice("custom:".length));
      if (!custom)
        return null;
      const img = badge.createEl("img", { attr: { src: custom.dataUri, alt: "" } });
      img.draggable = false;
      badge.setAttribute("aria-label", custom.name);
      return badge;
    }
    return null;
  }
  /** 装饰单个 .nav-file-title 元素。 */
  decorateTitleEl(titleEl) {
    var _a;
    const path = titleEl.getAttribute("data-path");
    if (!path)
      return;
    titleEl.querySelectorAll("." + BADGE_CONTAINER_CLASS).forEach((n) => n.remove());
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian.TFile))
      return;
    const fm = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    const rules = matchingRules(fm, this.getSettings().rules);
    if (rules.length === 0)
      return;
    const container = createSpan({ cls: BADGE_CONTAINER_CLASS });
    const size = this.getSettings().iconSize || 16;
    container.style.setProperty("--property-icons-size", size + "px");
    let added = 0;
    for (const rule of rules) {
      const el = this.createIconEl(rule.icon);
      if (el) {
        el.setAttribute("data-rule", rule.name || rule.id);
        container.appendChild(el);
        added += 1;
      }
    }
    if (added === 0)
      return;
    titleEl.prepend(container);
  }
  getAllTitleEls() {
    const out = [];
    for (const container of this.getExplorerContainers()) {
      container.querySelectorAll(".nav-file-title[data-path]").forEach((el) => out.push(el));
    }
    return out;
  }
  /** 全量重扫（防抖）。属性/规则/图标变更后调用。 */
  scheduleDecorateAll() {
    if (this.debounceTimer !== null)
      window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.decorateAll();
    }, 60);
  }
  decorateAll() {
    for (const el of this.getAllTitleEls())
      this.decorateTitleEl(el);
  }
  /** 只重刷某个文件（frontmatter 变更时用）。 */
  decoratePath(path) {
    for (const container of this.getExplorerContainers()) {
      const el = container.querySelector(
        `.nav-file-title[data-path="${CSS.escape(path)}"]`
      );
      if (el)
        this.decorateTitleEl(el);
    }
  }
  /** 监听文件树 DOM 变化（滚动虚拟化、展开折叠会重建节点）。 */
  startObserving() {
    this.stopObserving();
    for (const container of this.getExplorerContainers()) {
      const target = container.querySelector(".nav-files-container") || container;
      const observer = new MutationObserver(() => this.scheduleDecorateAll());
      observer.observe(target, { childList: true, subtree: true });
      this.observers.push(observer);
    }
  }
  stopObserving() {
    this.observers.forEach((o) => o.disconnect());
    this.observers = [];
  }
  /** 清理所有注入的徽标（卸载时）。 */
  clearAll() {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    document.querySelectorAll("." + BADGE_CONTAINER_CLASS).forEach((n) => n.remove());
  }
};

// src/settings.ts
var import_obsidian2 = require("obsidian");
var CUSTOM_ICON_MAX_BYTES = 256 * 1024;
var ACCEPTED_EXT = ["jpg", "jpeg", "png", "svg"];
function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
var PropertyIconsSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  async persist() {
    await this.plugin.saveSettings();
    this.plugin.refreshDecorations();
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("\u89C4\u5219\u7EC4 \u2192 \u6587\u4EF6\u6811\u56FE\u6807").setDesc("\u4E3A\u6BCF\u7EC4\u89C4\u5219\u914D\u7F6E\u82E5\u5E72\u300C\u5C5E\u6027 = \u503C\u300D\u6761\u4EF6\uFF08\u7EC4\u5185\u7EDF\u4E00\u7528 \u4E14/\u6216\uFF09\uFF0C\u547D\u4E2D\u7684\u7B14\u8BB0\u4F1A\u5728\u6587\u4EF6\u540D\u524D\u663E\u793A\u8BE5\u7EC4\u56FE\u6807\u3002\u547D\u4E2D\u591A\u7EC4\u5219\u4F9D\u6B21\u663E\u793A\u591A\u4E2A\u56FE\u6807\u3002").setHeading();
    new import_obsidian2.Setting(containerEl).setName("\u56FE\u6807\u5927\u5C0F").setDesc("\u6587\u4EF6\u540D\u524D\u5FBD\u6807\u7684\u50CF\u7D20\u5927\u5C0F\u3002").addSlider((slider) => {
      slider.setLimits(12, 24, 1).setValue(this.plugin.settings.iconSize || 16).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.iconSize = value;
        await this.persist();
      });
    });
    const rulesWrap = containerEl.createDiv({ cls: "property-icons-rules" });
    this.plugin.settings.rules.forEach((rule) => this.renderRuleCard(rulesWrap, rule));
    new import_obsidian2.Setting(containerEl).addButton((btn) => {
      btn.setButtonText("+ \u65B0\u589E\u89C4\u5219\u7EC4").setCta().onClick(async () => {
        const rule = {
          id: genId("rule"),
          name: `\u89C4\u5219 ${this.plugin.settings.rules.length + 1}`,
          op: "AND",
          conditions: [{ property: "", value: "" }],
          icon: `builtin:${BUILTIN_ICONS[0].id}`,
          enabled: true
        };
        this.plugin.settings.rules.push(rule);
        await this.persist();
        this.display();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("\u81EA\u5B9A\u4E49\u56FE\u6807").setDesc("\u4E0A\u4F20\u81EA\u5DF1\u7684\u56FE\u7247\u4F5C\u4E3A\u56FE\u6807\uFF0C\u652F\u6301 jpg / jpeg / png / svg\uFF08\u5355\u5F20 \u2264 256KB\uFF09\u3002").setHeading();
    this.renderCustomIcons(containerEl);
  }
  renderRuleCard(parent, rule) {
    const card = parent.createDiv({ cls: "property-icons-rule-card" });
    const head = new import_obsidian2.Setting(card).addText((t) => {
      t.setPlaceholder("\u89C4\u5219\u540D\u79F0").setValue(rule.name).onChange(async (v) => {
        rule.name = v;
        await this.persist();
      });
    }).addToggle((tg) => {
      tg.setTooltip("\u542F\u7528\u8BE5\u89C4\u5219").setValue(rule.enabled).onChange(async (v) => {
        rule.enabled = v;
        await this.persist();
      });
    }).addExtraButton((b) => {
      b.setIcon("trash").setTooltip("\u5220\u9664\u89C4\u5219\u7EC4").onClick(async () => {
        this.plugin.settings.rules = this.plugin.settings.rules.filter((r) => r.id !== rule.id);
        await this.persist();
        this.display();
      });
    });
    head.setName("");
    head.settingEl.addClass("property-icons-rule-head");
    new import_obsidian2.Setting(card).setName("\u6761\u4EF6\u7EC4\u5408").addDropdown((dd) => {
      dd.addOption("AND", "\u4E14\uFF08\u5168\u90E8\u6EE1\u8DB3\uFF09");
      dd.addOption("OR", "\u6216\uFF08\u4EFB\u4E00\u6EE1\u8DB3\uFF09");
      dd.setValue(rule.op);
      dd.onChange(async (v) => {
        rule.op = v;
        await this.persist();
      });
    });
    const condsWrap = card.createDiv({ cls: "property-icons-conditions" });
    rule.conditions.forEach((cond, idx) => this.renderConditionRow(condsWrap, rule, cond, idx));
    new import_obsidian2.Setting(card).addButton((btn) => {
      btn.setButtonText("+ \u6DFB\u52A0\u6761\u4EF6").onClick(async () => {
        rule.conditions.push({ property: "", value: "" });
        await this.persist();
        this.display();
      });
    });
    const iconLabel = card.createDiv({ cls: "property-icons-icon-label", text: "\u56FE\u6807" });
    iconLabel.setAttr("aria-hidden", "true");
    this.renderIconPicker(card, rule);
  }
  renderConditionRow(parent, rule, cond, idx) {
    const setting = new import_obsidian2.Setting(parent);
    setting.settingEl.addClass("property-icons-cond-row");
    setting.infoEl.remove();
    setting.addText((t) => {
      t.setPlaceholder("\u5C5E\u6027\u540D\uFF0C\u5982 publish_status").setValue(cond.property).onChange(async (v) => {
        cond.property = v.trim();
        await this.persist();
      });
    });
    setting.controlEl.createSpan({ cls: "property-icons-eq", text: "=" });
    setting.addText((t) => {
      t.setPlaceholder("\u503C\uFF0C\u5982 done").setValue(cond.value).onChange(async (v) => {
        cond.value = v;
        await this.persist();
      });
    });
    setting.addExtraButton((b) => {
      b.setIcon("x").setTooltip("\u5220\u9664\u8BE5\u6761\u4EF6").onClick(async () => {
        rule.conditions.splice(idx, 1);
        if (rule.conditions.length === 0)
          rule.conditions.push({ property: "", value: "" });
        await this.persist();
        this.display();
      });
    });
  }
  renderIconPicker(parent, rule) {
    const grid = parent.createDiv({ cls: "property-icons-icon-grid" });
    const addOption = (ref, label, node) => {
      const opt = grid.createDiv({ cls: "property-icons-icon-option" });
      opt.setAttribute("aria-label", label);
      if (rule.icon === ref)
        opt.addClass("is-selected");
      opt.appendChild(node);
      opt.onClickEvent(async () => {
        rule.icon = ref;
        await this.persist();
        this.display();
      });
    };
    for (const icon of BUILTIN_ICONS) {
      const svg = builtinSvgEl(icon.id);
      if (svg)
        addOption(`builtin:${icon.id}`, icon.label, svg);
    }
    for (const custom of this.plugin.settings.customIcons) {
      const img = createEl("img", { attr: { src: custom.dataUri, alt: "" } });
      addOption(`custom:${custom.id}`, custom.name, img);
    }
  }
  renderCustomIcons(containerEl) {
    const uploadSetting = new import_obsidian2.Setting(containerEl).setName("\u4E0A\u4F20\u56FE\u6807");
    const fileInput = uploadSetting.controlEl.createEl("input", {
      attr: { type: "file", accept: ".jpg,.jpeg,.png,.svg,image/*" },
      cls: "property-icons-file-input"
    });
    fileInput.addEventListener("change", () => {
      var _a;
      const file = (_a = fileInput.files) == null ? void 0 : _a[0];
      if (file)
        void this.handleUpload(file);
      fileInput.value = "";
    });
    const list = containerEl.createDiv({ cls: "property-icons-custom-list" });
    if (this.plugin.settings.customIcons.length === 0) {
      list.createDiv({ cls: "property-icons-empty", text: "\u6682\u65E0\u81EA\u5B9A\u4E49\u56FE\u6807" });
      return;
    }
    for (const custom of this.plugin.settings.customIcons) {
      const row = new import_obsidian2.Setting(list).setName(custom.name);
      const preview = row.nameEl.createSpan({ cls: "property-icons-custom-preview" });
      preview.createEl("img", { attr: { src: custom.dataUri, alt: "" } });
      row.addExtraButton((b) => {
        b.setIcon("trash").setTooltip("\u5220\u9664\u8BE5\u56FE\u6807").onClick(async () => {
          this.plugin.settings.customIcons = this.plugin.settings.customIcons.filter((c) => c.id !== custom.id);
          for (const rule of this.plugin.settings.rules) {
            if (rule.icon === `custom:${custom.id}`)
              rule.icon = `builtin:${BUILTIN_ICONS[0].id}`;
          }
          await this.persist();
          this.display();
        });
      });
    }
  }
  async handleUpload(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      new import_obsidian2.Notice(`\u4E0D\u652F\u6301\u7684\u683C\u5F0F\uFF1A.${ext}\uFF08\u4EC5\u652F\u6301 ${ACCEPTED_EXT.join(" / ")}\uFF09`);
      return;
    }
    if (file.size > CUSTOM_ICON_MAX_BYTES) {
      new import_obsidian2.Notice(`\u56FE\u7247\u8FC7\u5927\uFF08${(file.size / 1024).toFixed(0)}KB\uFF09\uFF0C\u4E0A\u9650 256KB`);
      return;
    }
    const dataUri = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }).catch(() => "");
    if (!dataUri) {
      new import_obsidian2.Notice("\u8BFB\u53D6\u56FE\u7247\u5931\u8D25");
      return;
    }
    this.plugin.settings.customIcons.push({
      id: genId("icon"),
      name: file.name.replace(/\.[^.]+$/, ""),
      dataUri
    });
    await this.persist();
    this.display();
  }
};

// src/main.ts
var PropertyIconsPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.decorator = new ExplorerDecorator(this.app, () => this.settings);
    this.addSettingTab(new PropertyIconsSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => this.refreshDecorations());
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.refreshDecorations())
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        this.decorator.decoratePath(file.path);
      })
    );
    this.registerEvent(
      this.app.metadataCache.on("resolved", () => this.decorator.scheduleDecorateAll())
    );
  }
  onunload() {
    var _a, _b;
    (_a = this.decorator) == null ? void 0 : _a.stopObserving();
    (_b = this.decorator) == null ? void 0 : _b.clearAll();
  }
  /** 重新观察文件树并全量重扫（设置变更/布局变化后调用）。 */
  refreshDecorations() {
    if (!this.decorator)
      return;
    this.decorator.startObserving();
    this.decorator.decorateAll();
  }
  async loadSettings() {
    var _a, _b;
    const loaded = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded || {},
      rules: (_a = loaded == null ? void 0 : loaded.rules) != null ? _a : [],
      customIcons: (_b = loaded == null ? void 0 : loaded.customIcons) != null ? _b : []
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
