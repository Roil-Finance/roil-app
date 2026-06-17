// Host-aware gate for the pre-launch period. Both domains point at this same
// project, so we split them here at the edge:
//
//   waitlist.roil.app  -> PUBLIC, and ONLY the landing page. Any other path is
//                         redirected to /home, so the subdomain == roil.app/home.
//   roil.app (+ rest)  -> PRIVATE. Locked behind a password while we build.
//
// Lock/unlock the private side with the SITE_PASSWORD env var:
//   set it    -> roil.app asks for a password
//   remove it -> roil.app is public too (do this at launch)
//
// Any username works; visitors just need the password.

export const config = {
  runtime: 'edge',
};

const PUBLIC_HOST = 'waitlist.roil.app';

export default function middleware(request: Request): Response | undefined {
  const host = (request.headers.get('host') || '').toLowerCase();

  // Public waitlist subdomain: open to everyone, but it only ever serves the
  // landing page (plus the assets and the /api/waitlist endpoint it needs).
  if (host === PUBLIC_HOST) {
    const url = new URL(request.url);
    const { pathname } = url;
    const allowed =
      pathname === '/home' ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/assets/') ||
      pathname.includes('.'); // static files: /logo.jpg, /favicon.ico, ...
    if (!allowed) {
      url.pathname = '/home';
      return Response.redirect(url.toString(), 307);
    }
    return undefined;
  }

  // Main domain and everything else: require the password (if configured).
  const expected = process.env.SITE_PASSWORD?.trim();
  if (!expected) return undefined;

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try {
      decoded = atob(encoded);
    } catch {
      decoded = '';
    }
    const password = decoded.slice(decoded.indexOf(':') + 1);
    if (password && password === expected) {
      return undefined; // authorized -> continue to the app
    }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Roil private preview", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
