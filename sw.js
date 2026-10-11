// Offline shell + receiver for the phone "Share to Scratchpad" sheet.
const SHELL = 'scratchpad-shell-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png']).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method === 'POST' && url.searchParams.has('share-target')) {
    e.respondWith((async () => {
      const fd = await req.formData(), inbox = await caches.open('share-inbox');
      const files = fd.getAll('media').filter(f => f && f.size);
      await Promise.all(files.map((f, k) => inbox.put('file-' + k, new Response(f, { headers: { 'content-type': f.type } }))));
      await inbox.put('meta', new Response(JSON.stringify({ title: fd.get('title') || '', text: fd.get('text') || '', url: fd.get('url') || '', files: files.length }), { headers: { 'content-type': 'application/json' } }));
      return Response.redirect(new URL('./#/share', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.openWindow('./')); });
