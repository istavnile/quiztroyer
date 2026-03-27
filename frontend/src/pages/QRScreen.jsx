import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRScreen() {
  const params = new URLSearchParams(window.location.search);
  const url    = params.get('url') || '';
  const title  = params.get('title') || '';

  // Hide cursor after 3s of no movement (presentation mode)
  useEffect(() => {
    let timer;
    const hide = () => {
      clearTimeout(timer);
      document.body.style.cursor = 'default';
      timer = setTimeout(() => { document.body.style.cursor = 'none'; }, 3000);
    };
    window.addEventListener('mousemove', hide);
    return () => { window.removeEventListener('mousemove', hide); clearTimeout(timer); };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-8 select-none">
      <h1 className="text-white text-3xl sm:text-4xl font-black tracking-tight text-center">
        <span className="text-gradient">QUIZ</span>TROYER
      </h1>

      <div className="bg-white rounded-3xl p-4 shadow-2xl">
        <QRCodeSVG value={url} size={320} level="H" includeMargin={false} />
      </div>

      <div className="text-center space-y-2">
        <p className="text-white text-2xl sm:text-3xl font-bold">{title}</p>
        <p className="text-slate-400 text-base sm:text-lg font-mono break-all">{url}</p>
      </div>

      <p className="text-slate-600 text-sm absolute bottom-6">Escanea el código QR para participar</p>
    </div>
  );
}
