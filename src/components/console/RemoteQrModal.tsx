import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  Sparkles,
  Zap,
  Lock,
  KeyRound,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface RemoteQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  remoteUrl: string;
  connectedClients?: number;
  roomCode: string;
  operatorPin: string;
  onRotatePin: () => void;
}

export const RemoteQrModal: React.FC<RemoteQrModalProps> = ({
  isOpen,
  onClose,
  remoteUrl,
  connectedClients = 0,
  roomCode,
  operatorPin,
  onRotatePin,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [pinRotatedNotice, setPinRotatedNotice] = useState(false);

  useEffect(() => {
    if (!isOpen || !remoteUrl) return;

    QRCode.toDataURL(remoteUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [isOpen, remoteUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotatePinClick = () => {
    onRotatePin();
    setPinRotatedNotice(true);
    setTimeout(() => setPinRotatedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-[#0a0f1d] border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-slate-100 flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20">
          <Smartphone className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-black text-white font-sans">
          Control Remoto Móvil Seguro
        </h2>

        {/* Requirement 1: Room code prominently displayed */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs uppercase font-extrabold text-slate-400">Código de Sala:</span>
          <span className="px-3 py-1 rounded-xl bg-blue-600/30 border border-blue-400 text-blue-300 font-mono font-black text-base tracking-widest">
            {roomCode}
          </span>
        </div>

        {/* QR Code Container (Requirement 2: Includes room, NEVER the PIN) */}
        <div className="my-4 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-800">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Control Remoto Móvil"
              className="w-52 h-52 rounded-lg"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-slate-500 text-xs">
              Generando código QR...
            </div>
          )}
        </div>

        {/* Requirement 2: Operator PIN info & Rotation */}
        <div className="w-full mb-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">PIN de Operador:</span>
            </div>
            <span className="px-3 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 font-mono font-black text-base text-amber-300 tracking-[0.25em]">
              {operatorPin}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            🔒 <strong>El QR NO contiene el PIN</strong>. Díctaselo únicamente a quien vaya a sumar puntos desde su teléfono. Quien no tenga el PIN solo podrá mirar (modo lectura).
          </p>

          <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleRotatePinClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 active:scale-98"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Cambiar PIN y desconectar remotos</span>
            </button>
          </div>

          {pinRotatedNotice && (
            <p className="text-[11px] text-emerald-400 font-bold mt-2 text-center animate-fadeIn">
              ✅ ¡Nuevo PIN generado! Los controles remotos activos han sido invalidados y deberán reingresarlo.
            </p>
          )}
        </div>

        {/* Link and Copy Button */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-between gap-2 text-xs">
          <span className="font-mono text-slate-400 truncate text-[11px] text-left px-1">
            {remoteUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shrink-0 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* Open in new tab tester */}
        <div className="w-full mt-3 grid grid-cols-2 gap-2 text-xs">
          <a
            href={remoteUrl}
            target="_blank"
            rel="noreferrer"
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Probar en pestaña</span>
          </a>
          <button
            onClick={onClose}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
