import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Ticket, Sparkles, CheckCircle2, Trophy, Users, AlertCircle, Radio } from 'lucide-react';
import { createMasterSyncChannel } from '../../utils/masterStorageSync';

export const MobileJoinRegistrationView: React.FC = () => {
  const roomCode = useMemo(() => {
    if (typeof window === 'undefined') return 'K7P2';
    const param = new URL(window.location.href).searchParams.get('room');
    return param ? param.toUpperCase().trim().slice(0, 4) : 'K7P2';
  }, []);

  // Client token to guarantee 1 registration per phone
  const clientToken = useMemo(() => {
    if (typeof window === 'undefined') return 'tok-initial';
    const storageKey = `raffle_client_token_${roomCode}`;
    let token = localStorage.getItem(storageKey);
    if (!token) {
      token = `phone-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(storageKey, token);
    }
    return token;
  }, [roomCode]);

  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registered state
  const [registrationData, setRegistrationData] = useState<{
    name: string;
    ticketNumber: number;
    group?: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(`raffle_registered_user_${roomCode}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  // Winner celebration state
  const [isWinner, setIsWinner] = useState(false);
  const [winnerPrizeTitle, setWinnerPrizeTitle] = useState<string>('Gran Premio');
  const hasVibratedRef = useRef(false);

  // Check registration and winner status periodically & via sync
  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/raffle/participant-status?room=${roomCode}&token=${clientToken}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.registered && data.participant) {
        const reg = {
          name: data.participant.name,
          ticketNumber: data.participant.ticketNumber,
          group: data.participant.groupOrCell,
        };
        setRegistrationData(reg);
        localStorage.setItem(`raffle_registered_user_${roomCode}`, JSON.stringify(reg));
      }

      if (data.isWinner) {
        setIsWinner(true);
        if (data.winnerInfo?.title) setWinnerPrizeTitle(data.winnerInfo.title);
        // Vibrate once on win
        if (!hasVibratedRef.current && typeof navigator !== 'undefined' && navigator.vibrate) {
          hasVibratedRef.current = true;
          try {
            navigator.vibrate([200, 100, 200, 100, 400]);
          } catch {}
        }
      }
    } catch {}
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    // Also connect to WebSocket for instant winner notification
    const sync = createMasterSyncChannel({
      roomCode,
      role: 'remote',
      onMessage: (msg) => {
        if (msg.type === 'SYNC_MASTER_STATE' && msg.payload?.raffle) {
          const raffle = msg.payload.raffle;
          // Check if I won
          if (registrationData) {
            const isCurrentWin =
              raffle.activeWinnerScreenData?.winnerName === registrationData.name ||
              raffle.activeWinnerScreenData?.ticketNumber === registrationData.ticketNumber;
            const inNightWinners = (raffle.nightWinners || []).some(
              (w: any) => w.ticketNumber === registrationData.ticketNumber || w.name === registrationData.name
            );

            if (isCurrentWin || inNightWinners) {
              setIsWinner(true);
              if (raffle.activeWinnerScreenData?.title) {
                setWinnerPrizeTitle(raffle.activeWinnerScreenData.title);
              }
              if (!hasVibratedRef.current && typeof navigator !== 'undefined' && navigator.vibrate) {
                hasVibratedRef.current = true;
                try {
                  navigator.vibrate([200, 100, 200, 100, 400]);
                } catch {}
              }
            }
          }
        }
      },
    });

    return () => {
      clearInterval(interval);
      sync.close();
    };
  }, [roomCode, clientToken, registrationData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor escribe tu nombre y apellido.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/raffle/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomCode,
          name: name.trim(),
          group: group.trim() || undefined,
          clientToken,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setErrorMessage(resData.error || 'No se pudo completar la inscripción.');
        setIsSubmitting(false);
        return;
      }

      const reg = {
        name: resData.participant?.name || name.trim(),
        ticketNumber: resData.ticketNumber,
        group: resData.participant?.groupOrCell || group.trim(),
      };

      setRegistrationData(reg);
      localStorage.setItem(`raffle_registered_user_${roomCode}`, JSON.stringify(reg));
    } catch {
      setErrorMessage('Error de conexión con el servidor. Reintenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0B1E] text-white flex flex-col justify-between p-5 select-none font-sans">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between border-b border-[#2A2D5C] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-[#FFC53D] text-slate-950 font-black">
            <Sparkles className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <h1 className="text-[20px] font-black leading-tight tracking-tight text-white">
              Sorteo en Vivo
            </h1>
            <p className="text-[13px] text-[#B8BCE6] font-medium">Inscripción Oficial</p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-[#15173A] border border-[#2A2D5C] text-right">
          <span className="text-[11px] font-bold text-[#B8BCE6] uppercase block">SALA</span>
          <span className="text-[18px] font-black tracking-widest text-[#FFC53D] leading-none">
            {roomCode}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 w-full max-w-md mx-auto">
        {/* State 1: WINNER CELEBRATION OVERLAY */}
        {isWinner && registrationData && (
          <div className="w-full p-6 rounded-3xl bg-gradient-to-b from-[#3A2A05] to-[#15173A] border-4 border-[#FFC53D] text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FFC53D] text-slate-950 flex items-center justify-center mb-4 shadow-xl shadow-[#FFC53D]/30 animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <span className="inline-block px-4 py-1 rounded-full bg-[#FFC53D]/20 text-[#FFC53D] text-[13px] font-black uppercase tracking-widest mb-2 border border-[#FFC53D]">
              ¡FELICIDADES!
            </span>

            <h2 className="text-[34px] font-black leading-tight text-white mb-2">
              ¡ERES EL GANADOR DEL SORTEO!
            </h2>

            <p className="text-[18px] text-[#FFC53D] font-bold mb-4">
              {winnerPrizeTitle}
            </p>

            <div className="p-4 rounded-2xl bg-white text-slate-950 font-black text-center mb-4 shadow-lg">
              <span className="text-[13px] text-slate-500 uppercase tracking-widest block">
                GANADOR OFICIAL
              </span>
              <span className="text-[26px] leading-tight block">{registrationData.name}</span>
              <span className="text-[16px] text-amber-600 block mt-1">
                BOLETO #{registrationData.ticketNumber}
              </span>
            </div>

            <p className="text-[14px] text-[#B8BCE6]">
              ¡Pasa al escenario o acércate con el director para recibir tu premio!
            </p>
          </div>
        )}

        {/* State 2: ALREADY REGISTERED (Showing Ticket Number) */}
        {!isWinner && registrationData && (
          <div className="w-full p-6 rounded-3xl bg-[#15173A] border-2 border-[#4ADE80] text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F5132] border-2 border-[#4ADE80] text-[#4ADE80] flex items-center justify-center mb-4 shadow-lg shadow-[#0F5132]/50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-[28px] font-black text-white leading-tight mb-1">
              ¡Ya estás participando!
            </h2>
            <p className="text-[15px] text-[#B8BCE6] mb-5">
              Conserva este boleto en tu pantalla durante el sorteo.
            </p>

            {/* Ticket Card */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-r from-amber-500 via-[#FFC53D] to-amber-400 text-slate-950 font-black shadow-xl mb-6">
              <span className="text-[13px] font-extrabold uppercase tracking-widest block text-slate-900/80">
                TU NÚMERO OFICIAL DE BOLETO
              </span>
              <span className="text-[54px] font-black leading-none block my-2 tabular-numbers">
                #{registrationData.ticketNumber}
              </span>
              <div className="border-t border-slate-900/20 pt-2 flex items-center justify-between text-[14px]">
                <span className="truncate">{registrationData.name}</span>
                {registrationData.group && (
                  <span className="opacity-80 truncate ml-2">({registrationData.group})</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[#4ADE80] text-[15px] font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
              <span>Conectado a la ruleta en vivo</span>
            </div>

            <p className="text-[12px] text-slate-400 mt-4">
              Si tu boleto sale premiado, tu teléfono vibrará y sonará automáticamente.
            </p>
          </div>
        )}

        {/* State 3: REGISTRATION FORM */}
        {!isWinner && !registrationData && (
          <div className="w-full p-6 rounded-3xl bg-[#15173A] border border-[#2A2D5C] shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] text-[12px] font-black uppercase tracking-wider mb-2">
                <Ticket className="w-4 h-4" /> Registro Rápido
              </div>
              <h2 className="text-[26px] font-black text-white leading-tight">
                Participa en el Sorteo
              </h2>
              <p className="text-[14px] text-[#B8BCE6] mt-1">
                Ingresa tus datos para recibir tu número de boleto digital.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#3F1216] border border-[#EF4444] text-[#EF4444] text-[14px] flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-black text-[#B8BCE6] uppercase tracking-wider mb-1.5">
                  Tu nombre y apellido <span className="text-[#FFC53D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#0A0B1E] border border-[#2A2D5C] text-white text-[17px] font-semibold placeholder:text-slate-600 focus:outline-none focus:border-[#FFC53D]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-black text-[#B8BCE6] uppercase tracking-wider mb-1.5">
                  Tu grupo o célula <span className="text-slate-500 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Jóvenes / Red Familiar / Célula 4"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#0A0B1E] border border-[#2A2D5C] text-white text-[16px] font-semibold placeholder:text-slate-600 focus:outline-none focus:border-[#FFC53D]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-[#FFC53D] to-amber-400 text-slate-950 font-black text-[18px] tracking-wide uppercase shadow-xl hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Generando boleto...' : '¡Participar en el Sorteo!'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <span className="text-[12px] text-slate-500">
                1 boleto por dispositivo • Sala {roomCode}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-2 text-[12px] text-slate-500 border-t border-[#2A2D5C]">
        Live Event & Game Show Master Studio • Centro de Sorteos
      </footer>
    </div>
  );
};
