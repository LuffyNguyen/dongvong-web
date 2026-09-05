// Cache-first co lam moi ngam. Muc dich: choi duoc khi wifi cha chap chon,
// va khi may chu phong tren Mac tam thoi ngat.
//
// MOT NGOAI LE: trang index.html thi LAY MANG TRUOC. Ly do rat cu the - ten
// file js co ma bam trong do, nen chi can index.html cu la ca ban build moi
// khong bao gio duoc goi toi, du no da nam san tren may chu. Cache-first o
// dung mot file ay bien moi lan cap nhat thanh "phai tai lai hai lan moi thay",
// va lan thu nhat thi nguoi choi tuong la ban cap nhat chua len.
const CACHE = 'dongvong-v2'
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil((async () => {
  // don cache doi truoc - trong do con index.html cu
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
  await self.clients.claim()
})()))

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  const isFont = FONT_HOSTS.includes(url.hostname)
  if (!sameOrigin && !isFont) return

  e.respondWith((async () => {
    const cache = await caches.open(CACHE)

    // vo trang: mang truoc, mat mang thi moi lay ban cu ra
    if (req.mode === 'navigate') {
      try {
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      } catch (err) {
        const hit = await cache.match(req) || await cache.match(self.registration.scope)
        if (hit) return hit
        throw err
      }
    }

    // con lai deu co ma bam trong ten file, nen lay cache truoc cho nhanh
    const hit = await cache.match(req)
    if (hit) {
      fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()) }).catch(() => {})
      return hit
    }
    try {
      const res = await fetch(req)
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
      return res
    } catch (err) {
      const shell = await cache.match(self.registration.scope)
      if (shell && req.mode === 'navigate') return shell
      throw err
    }
  })())
})
