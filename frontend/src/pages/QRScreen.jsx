import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';
import PageBackground from '../components/PageBackground';

export default function QRScreen() {
  const params = new URLSearchParams(window.location.search);
  const url    = params.get('url') || '';
  const title  = params.get('title') || '';
  const pin    = params.get('pin') || '';

  const [settings, setSettings] = useState({
    homeBgColor: '#0f172a', homeButtonColor: '#6366f1',
    bgEffect: 'blobs', logoUrl: '',
    blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899',
  });

  useEffect(() => {
    api.get('/settings').then((r) => setSettings((s) => ({ ...s, ...r.data }))).catch(() => {});
  }, []);

  // Hide cursor after 3s of no movement (presentation mode)
  useEffect(() => {
    let timer;
    const show = () => {
      clearTimeout(timer);
      document.body.style.cursor = 'default';
      timer = setTimeout(() => { document.body.style.cursor = 'none'; }, 3000);
    };
    window.addEventListener('mousemove', show);
    return () => { window.removeEventListener('mousemove', show); clearTimeout(timer); };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 select-none relative overflow-hidden"
      style={{ background: settings.homeBgColor }}
    >
      <PageBackground siteSettings={settings} color={settings.homeButtonColor} />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="logo" className="h-16 object-contain" />
        ) : (
          <h1 className="text-white text-3xl sm:text-4xl font-black tracking-tight text-center">
            <span className="text-gradient">QUIZ</span>TROYER
          </h1>
        )}

        <div className="bg-white rounded-3xl p-4 shadow-2xl">
          <QRCodeSVG value={url} size={320} level="H" includeMargin={false} />
        </div>

        <div className="text-center space-y-3">
          <p className="text-white text-2xl sm:text-3xl font-bold">{title}</p>
          <p className="text-slate-400 text-base sm:text-lg font-mono break-all">{url}</p>
          {pin && (
            <div className="mt-2">
              <p className="text-slate-500 text-sm uppercase tracking-widest mb-1">PIN</p>
              <p className="text-white font-black tracking-widest"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', textShadow: `0 0 30px ${settings.homeButtonColor}88` }}>
                {pin}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-slate-600 text-sm absolute bottom-6 z-10">Escanea el código QR para participar</p>
    </div>
  );
}
