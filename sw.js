/* build 0826-0cecce */
/* AI 董事會 PWA — Service Worker
 * 只做「離線也打得開殼」這一件事。
 * ⚠️ 絕不快取任何 API 回應——那裡面有會議內容，而且快取住的錯誤答案比沒答案更糟。
 */
const CACHE = "aib-shell-0826-0cecce";
const SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  // 只管自己網域的 GET；各家 AI 的 API 一律直接放行、永不快取。
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.endsWith("version-pwa.json")) return;   // 更新檢查一定要拿到新的
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
