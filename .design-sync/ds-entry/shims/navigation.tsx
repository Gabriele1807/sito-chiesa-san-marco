// Design-runtime stand-in for `next/navigation`.
// The app-router hooks read a context that does not exist in the design
// runtime; these return inert, statically-sensible values instead of throwing.
export function usePathname() {
  return "/";
}
export function useRouter() {
  const noop = () => {};
  return { push: noop, replace: noop, back: noop, forward: noop, refresh: noop, prefetch: noop };
}
export function useSearchParams() {
  return new URLSearchParams();
}
export function useParams() {
  return {} as Record<string, string>;
}
export function redirect() {}
export function notFound() {}
