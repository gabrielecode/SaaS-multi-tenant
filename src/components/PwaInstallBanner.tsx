import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';

export default function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event (Android / Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner on mobile if not dismissed
    const dismissed = localStorage.getItem('ns_pwa_dismissed');
    if (!dismissed && (isIosDevice || window.innerWidth < 768)) {
      setShowBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="bg-indigo-900 text-white px-4 py-3 shadow-lg border-b border-indigo-800 flex items-center justify-between text-xs animate-fade-in z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-700">
          <Smartphone className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <p className="font-bold">Installa NoShow Reducer sul tuo Smartphone 📱</p>
          <p className="text-[11px] text-indigo-200">
            {isIOS 
              ? "Tocca il tasto Condividi (⎋) in Safari e seleziona 'Aggiungi alla schermata Home'."
              : "Accedi rapidamente come un'app nativa con notifiche push attive."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Installa App
          </button>
        )}
        <button
          onClick={() => {
            setShowBanner(false);
            localStorage.setItem('ns_pwa_dismissed', 'true');
          }}
          className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-300 hover:text-white transition"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
