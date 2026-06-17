// Site-wide password gate for the pre-launch period.
//
// Runs at the edge before the cache, so it covers the SPA pages, static assets,
// and the /api functions in one place.
//
//   Lock   the site -> set    SITE_PASSWORD in the project's env vars.
//   Unlock the site -> remove SITE_PASSWORD (or delete this file) at launch.
//
// Any username works; visitors just need the password.

export const config = {
  runtime: 'edge',
};

export default function middleware(request: Request): Response | undefined {
  const expected = process.env.SITE_PASSWORD?.trim();

  // Not configured -> the site is public. This is how we open it up at launch.
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
