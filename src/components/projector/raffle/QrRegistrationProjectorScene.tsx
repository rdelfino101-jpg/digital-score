import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { RaffleParticipant } from '../../../types/masterStudio';
import { Smartphone, Users, CheckCircle2 } from 'lucide-react';

interface QrRegistrationProjectorSceneProps {
  roomCode: string;
  participants: RaffleParticipant[];
  prizeTitle?: string;
}

export const QrRegistrationProjectorScene: React.FC<QrRegistrationProjectorSceneProps> = ({
  roomCode,
  participants,
  prizeTitle,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const joinUrl = `${origin}/?view=join&room=${roomCode}`;

    QRCode.toDataURL(joinUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#111318',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating join QR:', err));
  }, [roomCode]);

  const sortedParticipants = [...participants].sort((a, b) => {
    return (b.joinedAt || 0) - (a.joinedAt || 0);
  });

  const latestParticipantId = sortedParticipants[0]?.id;

  return (
    <div className="flex h-full w-full items-stretch justify-between gap-10 select-none p-4 animate-in fade-in duration-300">
      {/* Left Column: Escanea para participar */}
      <div className="w-[520px] flex flex-col items-center justify-between p-8 rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-line)] shadow-md shrink-0">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--p-panel-2)] border border-[var(--p-line)] text-[var(--p-accent-ink)] text-[16px] font-black uppercase tracking-widest mb-2">
            <Smartphone className="w-5 h-5" /> Desde tu celular
          </div>
          <h2 className="font-projector-title text-[36px] leading-tight text-[var(--p-text)]">
            Escanea para participar
          </h2>
          <p className="text-[20px] text-[var(--p-text-2)] mt-1 font-medium">
            Apunta la cámara de tu teléfono al código QR
          </p>
        </div>

        {/* Big QR Code (>= 400px) on white plate for reliable camera scanning */}
        <div className="p-4 rounded-3xl bg-white shadow-md border-4 border-[var(--p-accent)] my-4 flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR para inscribirse"
              className="w-[420px] h-[420px] object-contain rounded-xl"
            />
          ) : (
            <div className="w-[420px] h-[420px] bg-[var(--p-panel-2)] flex items-center justify-center text-[var(--p-text-3)] font-bold">
              Generando código QR...
            </div>
          )}
        </div>

        {/* Room Code Callout */}
        <div className="w-full py-3 px-6 rounded-2xl bg-[var(--p-brand)] text-[var(--p-on-brand)] text-center">
          <span className="text-[14px] font-bold text-[var(--p-brand-2)] uppercase tracking-widest block">
            Código manual de sala
          </span>
          <span className="text-[48px] font-black tracking-widest text-[var(--p-on-brand)] leading-none">
            {roomCode}
          </span>
        </div>
      </div>

      {/* Right Column: Contador Grande + Muro de Nombres en Vivo */}
      <div className="flex-1 flex flex-col justify-between p-8 rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-line)] shadow-md overflow-hidden">
        {/* Header: Big Counter */}
        <div className="flex items-center justify-between pb-6 border-b border-[var(--p-line)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--p-ok-bg)] border-2 border-[var(--p-ok)] text-[var(--p-ok)] flex items-center justify-center">
              <Users className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[16px] font-black uppercase tracking-widest text-[var(--p-ok)] block">
                Inscripción en tiempo real
              </span>
              <h3 className="text-[46px] font-black text-[var(--p-text)] leading-none tabular-numbers">
                {participants.length} PARTICIPANTES
              </h3>
            </div>
          </div>

          <div className="px-5 py-2.5 rounded-xl bg-[var(--p-accent-soft)] border border-[var(--p-accent-ink)] text-[var(--p-accent-ink)] font-black text-[20px]">
            {prizeTitle || 'Gran Sorteo Oficial'}
          </div>
        </div>

        {/* Live Grid of Participant Chips */}
        <div className="flex-1 overflow-y-auto py-5 pr-2">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Smartphone className="w-16 h-16 text-[var(--p-text-3)] mb-3 animate-pulse" />
              <p className="text-[26px] text-[var(--p-text-2)] font-semibold">
                Esperando a los primeros participantes...
              </p>
              <p className="text-[18px] text-[var(--p-text-3)] mt-1">
                Escanea el código QR de la izquierda para aparecer en esta pantalla.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 content-start">
              {sortedParticipants.map((p) => {
                const isLatest = p.id === latestParticipantId;
                return (
                  <div
                    key={p.id}
                    className={`px-4 py-2.5 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                      isLatest
                        ? 'bg-[var(--p-ok-bg)] border-[var(--p-ok)] text-[var(--p-text)] shadow-sm scale-105'
                        : 'bg-[var(--p-panel-2)] border-[var(--p-line)] text-[var(--p-text)]'
                    }`}
                  >
                    <span className="px-2 py-0.5 rounded bg-[var(--p-panel)] text-[var(--p-accent-ink)] text-[13px] font-black">
                      #{p.ticketNumber || '---'}
                    </span>
                    <span className="text-[22px] font-black truncate max-w-[220px]">
                      {p.name}
                    </span>
                    {p.groupOrCell && (
                      <span className="text-[14px] text-[var(--p-text-2)] truncate max-w-[130px]">
                        ({p.groupOrCell})
                      </span>
                    )}
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--p-ok)] text-[var(--p-ok-bg)] text-[10px] font-black uppercase">
                        NUEVO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[var(--p-line)] flex items-center justify-between text-[var(--p-text-2)] text-[18px]">
          <span>Los boletos se asignan automáticamente al momento de escanear.</span>
          <span className="font-bold text-[var(--p-ok)] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Inscripciones abiertas
          </span>
        </div>
      </div>
    </div>
  );
};
