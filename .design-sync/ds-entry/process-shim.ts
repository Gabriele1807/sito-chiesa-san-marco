// Must be the first import in index.ts.
//
// Some modules in the component graph read `process.env.*` at module top
// level (src/components/pwa/push-client.ts reads
// NEXT_PUBLIC_VAPID_PUBLIC_KEY). Next replaces those at build time; the design
// runtime is a plain browser, so the bare reference throws a ReferenceError
// during bundle init and window.ChiesaSanMarco never gets assigned.
//
// The VAPID value below is a freshly generated, throwaway PUBLIC key. It is
// not the site's key and grants nothing: it only has to be a well-formed
// 87-character base64url P-256 point so PushToggle renders its real enabled
// state in previews instead of returning null.
const g = globalThis as unknown as { process?: { env: Record<string, string | undefined> } };
g.process ??= { env: {} };
g.process.env ??= {};
g.process.env.NODE_ENV ??= "development";
g.process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??= "BA2Rj7LAJgW325GGXwstUyWenkSIZCLbXiGeum7IMIiL8TDO9GF61d89vt9WkVjD5WfG6MV_VmGveuiNIIrc37s";
g.process.env.NEXT_PUBLIC_SITE_URL ??= "https://www.sanmarcocopti.it";
export {};
