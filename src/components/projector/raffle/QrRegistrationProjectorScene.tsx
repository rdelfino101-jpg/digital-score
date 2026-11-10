import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { RaffleParticipant } from '../../../types/masterStudio';
import { Smartphone, Users, Sparkles, CheckCircle2 } from 'lucide-react';

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
        dark: '#0A0B1E',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating join QR:', err));
  }, [roomCode]);

  // Sort participants by joinedAt descending (most recent first)
  const sortedParticipants = [...participants].sort((a, b) => {
    return (b.joinedAt || 0) - (a.joinedAt || 0);
  });

  const latestParticipantId = sortedParticipants[0]?.id;

  return (
    <div className="flex h-full w-full items-stretch justify-between gap-10 select-none p-4 animate-in fade-in duration-300">
      {/* Left Column: Escanea para participar (QR 440px + Room Code) */}
      <div className="w-[520px] flex flex-col items-center justify-between p-8 rounded-3xl bg-[#15173A] border-4 border-[#2A2D5C] shadow-2xl shrink-0">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] text-[16px] font-black uppercase tracking-widest mb-2">
            <Smartphone className="w-5 h-5" /> DESDE TU CELULAR
          </div>
          <h2 className="text-[36px] font-black leading-tight text-white">
            Escanea para Participar
          </h2>
          <p className="text-[20px] text-[#B8BCE6] mt-1 font-medium">
            Apunta la cámara de tu teléfono al código QR
          </p>
        </div>

        {/* Big QR Code (>= 400px) */}
        <div className="p-4 rounded-3xl bg-white shadow-2xl border-4 border-[#FFC53D] my-4 flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR para inscribirse"
              className="w-[420px] h-[420px] object-contain rounded-xl"
            />
          ) : (
            <div className="w-[420px] h-[420px] bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              Generando código QR...
            </div>
          )}
        </div>

        {/* Room Code Callout */}
        <div className="w-full py-3 px-6 rounded-2xl bg-[#0A0B1E] border-2 border-[#FFC53D] text-center">
          <span className="text-[14px] font-bold text-[#B8BCE6] uppercase tracking-widest block">
            CÓDIGO MANUAL DE SALA
          </span>
          <span className="text-[48px] font-black tracking-widest text-[#FFC53D] leading-none">
            {roomCode}
          </span>
        </div>
      </div>

      {/* Right Column: Contador Grande + Muro de Nombres en Vivo */}
      <div className="flex-1 flex flex-col justify-between p-8 rounded-3xl bg-[#15173A] border-4 border-[#2A2D5C] shadow-2xl overflow-hidden">
        {/* Header: Big Counter */}
        <div className="flex items-center justify-between pb-6 border-b border-[#2A2D5C]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0F5132] border-2 border-[#4ADE80] text-[#4ADE80] flex items-center justify-center shadow-lg shadow-[#0F5132]/40">
              <Users className="w-9 h-9" />
            </div>
            <div>
              <span className="text-[16px] font-black uppercase tracking-widest text-[#4ADE80] block">
                INSCRIPCIÓN EN TIEMPO REAL
              </span>
              <h3 className="text-[46px] font-black text-white leading-none tabular-numbers">
                {participants.length} PARTICIPANTES
              </h3>
            </div>
          </div>

          <div className="px-5 py-2.5 rounded-xl bg-[#3A2A05] border border-[#FFC53D] text-[#FFC53D] font-black text-[20px]">
            {prizeTitle || 'Gran Sorteo Oficial'}
          </div>
        </div>

        {/* Live Grid of Participant Chips */}
        <div className="flex-1 overflow-y-auto py-5 pr-2">
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Smartphone className="w-16 h-16 text-slate-600 mb-3 animate-pulse" />
              <p className="text-[26px] text-[#B8BCE6] font-semibold">
                Esperando a los primeros participantes...
              </p>
              <p className="text-[18px] text-slate-500 mt-1">
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
                        ? 'bg-[#0F5132] border-[#4ADE80] text-white shadow-xl shadow-[#4ADE80]/30 scale-105 animate-pulse'
                        : 'bg-[#0A0B1E] border-[#2A2D5C] text-white hover:border-[#4B5299]'
                    }`}
                  >
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[#FFC53D] text-[13px] font-black">
                      #{p.ticketNumber || '---'}
                    </span>
                    <span className="text-[22px] font-black truncate max-w-[220px]">
                      {p.name}
                    </span>
                    {p.groupOrCell && (
                      <span className="text-[14px] text-[#B8BCE6] opacity-80 truncate max-w-[130px]">
                        ({p.groupOrCell})
                      </span>
                    )}
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full bg-[#4ADE80] text-slate-950 text-[10px] font-black uppercase">
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
        <div className="pt-4 border-t border-[#2A2D5C] flex items-center justify-between text-[#B8BCE6] text-[18px]">
          <span>Los boletos se asignan automáticamente al momento de escanear.</span>
          <span className="font-bold text-[#4ADE80] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Inscripciones abiertas
          </span>
        </div>
      </div>
    </div>
  );
};
