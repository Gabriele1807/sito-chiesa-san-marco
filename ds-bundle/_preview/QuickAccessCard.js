"use strict";
var __dsPreview = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
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
  var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:import.meta.env>
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
    }
  });

  // ds-raw:__ds_raw__
  var require_ds_raw = __commonJS({
    "ds-raw:__ds_raw__"(exports, module) {
      init_define_import_meta_env();
      module.exports = window.ChiesaSanMarco;
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      init_define_import_meta_env();
      var R = window.React;
      function np(p, k) {
        var o = {};
        for (var x in p) if (x !== "children") o[x] = p[x];
        if (k !== void 0) o.key = k;
        return o;
      }
      function jsx2(t, p, k) {
        var c = p && p.children;
        return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
      }
      function jsxs2(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx2;
      module.exports.jsxs = jsxs2;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs2 : jsx2)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // .design-sync/previews/QuickAccessCard.tsx
  var QuickAccessCard_exports = {};
  __export(QuickAccessCard_exports, {
    AGrid: () => AGrid,
    ComingSoon: () => ComingSoon,
    Default: () => Default,
    Highlighted: () => Highlighted,
    WithBadge: () => WithBadge
  });
  init_define_import_meta_env();

  // ds-shim:ds
  var ds_exports = {};
  __export(ds_exports, {
    default: () => ds_default
  });
  init_define_import_meta_env();
  __reExport(ds_exports, __toESM(require_ds_raw()));
  var g = window.ChiesaSanMarco;
  var ds_default = "default" in g ? g.default : g;

  // node_modules/lucide-react/dist/esm/lucide-react.js
  init_define_import_meta_env();

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  init_define_import_meta_env();
  var import_react2 = __toESM(require_react_shim());

  // node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.js
  init_define_import_meta_env();
  var mergeClasses = (...classes) => classes.filter((className, index, array) => {
    return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
  }).join(" ").trim();

  // node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.js
  init_define_import_meta_env();
  var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  // node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.js
  init_define_import_meta_env();

  // node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.js
  init_define_import_meta_env();
  var toCamelCase = (string) => string.replace(
    /^([A-Z])|[\s-_]+(\w)/g,
    (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
  );

  // node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.js
  var toPascalCase = (string) => {
    const camelCase = toCamelCase(string);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  };

  // node_modules/lucide-react/dist/esm/Icon.js
  init_define_import_meta_env();
  var import_react = __toESM(require_react_shim());

  // node_modules/lucide-react/dist/esm/defaultAttributes.js
  init_define_import_meta_env();
  var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  // node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.js
  init_define_import_meta_env();
  var hasA11yProp = (props) => {
    for (const prop in props) {
      if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
        return true;
      }
    }
    return false;
  };

  // node_modules/lucide-react/dist/esm/Icon.js
  var Icon = (0, import_react.forwardRef)(
    ({
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className = "",
      children,
      iconNode,
      ...rest
    }, ref) => (0, import_react.createElement)(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className),
        ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    )
  );

  // node_modules/lucide-react/dist/esm/createLucideIcon.js
  var createLucideIcon = (iconName, iconNode) => {
    const Component = (0, import_react2.forwardRef)(
      ({ className, ...props }, ref) => (0, import_react2.createElement)(Icon, {
        ref,
        iconNode,
        className: mergeClasses(
          `lucide-${toKebabCase(toPascalCase(iconName))}`,
          `lucide-${iconName}`,
          className
        ),
        ...props
      })
    );
    Component.displayName = toPascalCase(iconName);
    return Component;
  };

  // node_modules/lucide-react/dist/esm/icons/book-open.js
  init_define_import_meta_env();
  var __iconNode = [
    ["path", { d: "M12 7v14", key: "1akyts" }],
    [
      "path",
      {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
        key: "ruj8y"
      }
    ]
  ];
  var BookOpen = createLucideIcon("book-open", __iconNode);

  // node_modules/lucide-react/dist/esm/icons/calendar-days.js
  init_define_import_meta_env();
  var __iconNode2 = [
    ["path", { d: "M8 2v4", key: "1cmpym" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
    ["path", { d: "M3 10h18", key: "8toen8" }],
    ["path", { d: "M8 14h.01", key: "6423bh" }],
    ["path", { d: "M12 14h.01", key: "1etili" }],
    ["path", { d: "M16 14h.01", key: "1gbofw" }],
    ["path", { d: "M8 18h.01", key: "lrp35t" }],
    ["path", { d: "M12 18h.01", key: "mhygvu" }],
    ["path", { d: "M16 18h.01", key: "kzsmim" }]
  ];
  var CalendarDays = createLucideIcon("calendar-days", __iconNode2);

  // node_modules/lucide-react/dist/esm/icons/hand-heart.js
  init_define_import_meta_env();
  var __iconNode3 = [
    ["path", { d: "M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16", key: "1v1a37" }],
    [
      "path",
      {
        d: "m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95",
        key: "fhfbnt"
      }
    ],
    ["path", { d: "m2 15 6 6", key: "10dquu" }],
    [
      "path",
      {
        d: "m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91",
        key: "1x6kdw"
      }
    ]
  ];
  var HandHeart = createLucideIcon("hand-heart", __iconNode3);

  // node_modules/lucide-react/dist/esm/icons/images.js
  init_define_import_meta_env();
  var __iconNode4 = [
    ["path", { d: "m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16", key: "9kzy35" }],
    ["path", { d: "M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2", key: "1t0f0t" }],
    ["circle", { cx: "13", cy: "7", r: "1", fill: "currentColor", key: "1obus6" }],
    ["rect", { x: "8", y: "2", width: "14", height: "14", rx: "2", key: "1gvhby" }]
  ];
  var Images = createLucideIcon("images", __iconNode4);

  // .design-sync/previews/QuickAccessCard.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  function Default() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { maxWidth: 320 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.QuickAccessCard,
      {
        href: "/preghiere",
        icon: HandHeart,
        title: "Preghiere",
        description: "Le preghiere quotidiane della tradizione copta, in italiano e in arabo."
      }
    ) });
  }
  function Highlighted() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { maxWidth: 320 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.QuickAccessCard,
      {
        href: "/eventi",
        icon: CalendarDays,
        title: "Eventi",
        description: "Iscriviti alle celebrazioni e agli incontri della comunità.",
        highlight: true
      }
    ) });
  }
  function WithBadge() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { maxWidth: 320 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.QuickAccessCard,
      {
        href: "/liturgia",
        icon: BookOpen,
        title: "Liturgia",
        description: "Testi e letture per seguire la Divina Liturgia.",
        badge: "Nuovo"
      }
    ) });
  }
  function ComingSoon() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { maxWidth: 320 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.QuickAccessCard,
      {
        href: "/galleria",
        icon: Images,
        title: "Galleria",
        description: "Le icone e le fotografie della chiesa.",
        comingSoon: true
      }
    ) });
  }
  function AGrid() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.QuickAccessCard, { href: "/preghiere", icon: HandHeart, title: "Preghiere", description: "Le preghiere quotidiane della tradizione copta." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.QuickAccessCard, { href: "/eventi", icon: CalendarDays, title: "Eventi", description: "Iscriviti alle celebrazioni della comunità.", highlight: true }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.QuickAccessCard, { href: "/liturgia", icon: BookOpen, title: "Liturgia", description: "Testi e letture della Divina Liturgia.", badge: "Nuovo" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.QuickAccessCard, { href: "/galleria", icon: Images, title: "Galleria", description: "Le icone e le fotografie della chiesa.", comingSoon: true })
    ] });
  }
  return __toCommonJS(QuickAccessCard_exports);
})();
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils/mergeClasses.js:
lucide-react/dist/esm/shared/src/utils/toKebabCase.js:
lucide-react/dist/esm/shared/src/utils/toCamelCase.js:
lucide-react/dist/esm/shared/src/utils/toPascalCase.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/shared/src/utils/hasA11yProp.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/book-open.js:
lucide-react/dist/esm/icons/calendar-days.js:
lucide-react/dist/esm/icons/hand-heart.js:
lucide-react/dist/esm/icons/images.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.575.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
