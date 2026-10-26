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
      function jsxs(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx2;
      module.exports.jsxs = jsxs;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs : jsx2)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // .design-sync/previews/LegalDocument.tsx
  var LegalDocument_exports = {};
  __export(LegalDocument_exports, {
    Privacy: () => Privacy,
    Short: () => Short
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

  // .design-sync/previews/LegalDocument.tsx
  var import_jsx_runtime = __toESM(require_react_shim());
  var privacy = {
    eyebrow: "Informativa",
    title: "Privacy policy",
    updatedLabel: "Ultimo aggiornamento",
    intro: "Questa informativa spiega quali dati raccogliamo quando usi il sito della Chiesa Copta Ortodossa di San Marco, perché li raccogliamo e per quanto tempo li conserviamo.",
    tocTitle: "In questa pagina",
    languageNotice: "In caso di discordanza fra la versione italiana e quella araba, prevale il testo italiano.",
    sections: [
      {
        id: "titolare",
        title: "Titolare del trattamento",
        paragraphs: [
          "Il titolare del trattamento è la Chiesa Copta Ortodossa di San Marco, con sede in Milano.",
          "Per qualsiasi richiesta relativa ai tuoi dati puoi scrivere all'indirizzo indicato nella pagina Contatti."
        ]
      },
      {
        id: "dati",
        title: "Dati che raccogliamo",
        paragraphs: ["Raccogliamo soltanto i dati necessari ai servizi che richiedi:"],
        items: [
          "Nome, cognome e indirizzo email, quando crei un account.",
          "I dati dell'iscrizione, quando ti iscrivi a un evento.",
          "Il token di notifica del browser, se attivi gli avvisi push."
        ]
      },
      {
        id: "conservazione",
        title: "Per quanto tempo li conserviamo",
        paragraphs: [
          "I dati dell'account restano finché non chiedi la cancellazione. Le iscrizioni agli eventi sono conservate per dodici mesi dalla data dell'evento."
        ]
      },
      {
        id: "diritti",
        title: "I tuoi diritti",
        paragraphs: [
          "Puoi chiedere in ogni momento di accedere ai tuoi dati, correggerli o cancellarli, e di revocare il consenso alle notifiche."
        ]
      }
    ],
    related: { href: "/termini", label: "Leggi i Termini di servizio" }
  };
  function Privacy() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ds_exports.LegalDocument, { copy: privacy, updatedAt: "2026-09-14", locale: "it" });
  }
  function Short() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ds_exports.LegalDocument,
      {
        copy: {
          ...privacy,
          title: "Termini di servizio",
          eyebrow: "Condizioni",
          intro: "Usando il sito accetti le condizioni descritte qui sotto.",
          languageNotice: void 0,
          sections: privacy.sections.slice(0, 2),
          related: { href: "/privacy", label: "Leggi la Privacy policy" }
        },
        updatedAt: "2026-09-14",
        locale: "it"
      }
    );
  }
  return __toCommonJS(LegalDocument_exports);
})();
