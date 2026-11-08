import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const instituteSlug = url.searchParams.get('institute') || 'apex-academy';
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const jsScript = `
(function() {
  if (window.__admitflow_loaded) return;
  window.__admitflow_loaded = true;

  const btn = document.createElement('div');
  btn.id = 'admitflow-bubble';
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg> <span>Chat with Admissions</span>';
  btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;background:linear-gradient(135deg,#4f46e5,#3b82f6);color:#fff;padding:12px 20px;border-radius:999px;font-family:sans-serif;font-weight:600;font-size:14px;box-shadow:0 10px 25px rgba(59,130,246,0.4);cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s ease;';

  const frame = document.createElement('iframe');
  frame.src = '${baseUrl}/widget?slug=${instituteSlug}';
  frame.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:999999;width:380px;height:580px;border:none;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.25);display:none;';

  btn.onclick = function() {
    frame.style.display = frame.style.display === 'none' ? 'block' : 'none';
  };

  document.body.appendChild(btn);
  document.body.appendChild(frame);
})();
`;

  return new NextResponse(jsScript, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
