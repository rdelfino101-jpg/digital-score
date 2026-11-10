import React, { useEffect, useState, useMemo } from 'react';
import { RaffleParticipant, RaffleSpinEvent } from '../../../types/masterStudio';
import { User, Flame, Gift, Trophy, Sparkles } from 'lucide-react';

interface ChallengeCombinerArenaProps {
  participants: RaffleParticipant[];
  challenges: string[];
  prizes: string[];
  activeSpin: RaffleSpinEvent | null;
  durationMs: number;
}

export const ChallengeCombinerArena: React.FC<ChallengeCombinerArenaProps> = ({
  participants,
  challenges,
  prizes,
  activeSpin,
  durationMs,
}) => {
  const isSpinning = Boolean(activeSpin?.isSpinning);

  // Reel states
  const [reel1Stopped, setReel1Stopped] = useState(true);
  const [reel2Stopped, setReel2Stopped] = useState(true);
  const [reel3Stopped, setReel3Stopped] = useState(true);

  const [currentPersonIdx, setCurrentPersonIdx] = useState(0);
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [currentPrizeIdx, setCurrentPrizeIdx] = useState(0);

  const [showFinalPhrase, setShowFinalPhrase] = useState(false);

  const activeParticipants = useMemo(
    () => participants.filter((p) => !p.eliminated),
    [participants]
  );

  const safeChallenges = challenges.length > 0 ? challenges : ['hace un reto sorpresa'];
  const safePrizes = prizes.length > 0 ? prizes : ['un premio sorpresa'];

  useEffect(() => {
    if (!activeSpin || !isSpinning) {
      setReel1Stopped(true);
      setReel2Stopped(true);
      setReel3Stopped(true);
      return;
    }

    setReel1Stopped(false);
    setReel2Stopped(false);
    setReel3Stopped(false);
    setShowFinalPhrase(false);

    // Fast cycling animation for spinning reels
    const interval1 = setInterval(() => {
      setCurrentPersonIdx((prev) => (prev + 1) % Math.max(1, activeParticipants.length));
    }, 70);

    const interval2 = setInterval(() => {
      setCurrentChallengeIdx((prev) => (prev + 1) % safeChallenges.length);
    }, 70);

    const interval3 = setInterval(() => {
      setCurrentPrizeIdx((prev) => (prev + 1) % safePrizes.length);
    }, 70);

    // Reel 1 stops at durationMs - 2000
    const timeReel1 = Math.max(1000, durationMs - 2000);
    // Reel 2 stops 1s later at durationMs - 1000
    const timeReel2 = Math.max(2000, durationMs - 1000);
    // Reel 3 stops at durationMs
    const timeReel3 = durationMs;

    const t1 = setTimeout(() => {
      clearInterval(interval1);
      setReel1Stopped(true);
      if (activeSpin.winnerIndex !== undefined) {
        const foundIdx = activeParticipants.findIndex((p) => p.id === activeSpin.winnerItem.id);
        setCurrentPersonIdx(foundIdx >= 0 ? foundIdx : 0);
      }
    }, timeReel1);

    const t2 = setTimeout(() => {
      clearInterval(interval2);
      setReel2Stopped(true);
      if (activeSpin.challengeIndex !== undefined) {
        setCurrentChallengeIdx(activeSpin.challengeIndex % safeChallenges.length);
      }
    }, timeReel2);

    const t3 = setTimeout(() => {
      clearInterval(interval3);
      setReel3Stopped(true);
      if (activeSpin.prizeIndex !== undefined) {
        setCurrentPrizeIdx(activeSpin.prizeIndex % safePrizes.length);
      }
      setShowFinalPhrase(true);
    }, timeReel3);

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
      clearInterval(interval3);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeSpin, isSpinning, durationMs, activeParticipants.length, safeChallenges.length, safePrizes.length]);

  const displayedPerson = activeParticipants[currentPersonIdx]?.name || 'Participante';
  const displayedChallenge = safeChallenges[currentChallengeIdx] || 'hace un reto';
  const displayedPrize = safePrizes[currentPrizeIdx] || 'un gran premio';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-6xl gap-6 select-none">
      {/* 3 Slot Reels Grid */}
      <div className="grid grid-cols-3 gap-6 w-full">
        {/* REEL 1: PERSONA */}
        <div className="flex flex-col items-center rounded-3xl bg-[#15173A] border-4 border-[#2A2D5C] overflow-hidden shadow-2xl p-6">
          <div className="flex items-center gap-2.5 text-[#4F7BFF] mb-4">
            <User className="w-8 h-8" />
            <span className="text-[24px] font-black uppercase tracking-widest">1. PERSONA</span>
          </div>

          <div className="w-full h-[180px] rounded-2xl bg-[#0A0B1E] border-2 border-[#4F7BFF]/50 flex items-center justify-center p-4 text-center shadow-inner relative overflow-hidden">
            <span
              className={`text-[36px] font-black text-white leading-tight uppercase transition-all ${
                !reel1Stopped ? 'blur-[1px] opacity-80' : 'animate-in zoom-in-95'
              }`}
            >
              {displayedPerson}
            </span>
            {reel1Stopped && (
              <div className="absolute top-2 right-2 px-3 py-0.5 rounded-full bg-[#4F7BFF] text-white text-[12px] font-black uppercase">
                Fijado
              </div>
            )}
          </div>
        </div>

        {/* REEL 2: RETO */}
        <div className="flex flex-col items-center rounded-3xl bg-[#15173A] border-4 border-[#2A2D5C] overflow-hidden shadow-2xl p-6">
          <div className="flex items-center gap-2.5 text-[#FF8A1F] mb-4">
            <Flame className="w-8 h-8" />
            <span className="text-[24px] font-black uppercase tracking-widest">2. RETO</span>
          </div>

          <div className="w-full h-[180px] rounded-2xl bg-[#0A0B1E] border-2 border-[#FF8A1F]/50 flex items-center justify-center p-4 text-center shadow-inner relative overflow-hidden">
            <span
              className={`text-[30px] font-black text-[#FF8A1F] leading-tight transition-all ${
                !reel2Stopped ? 'blur-[1px] opacity-80' : 'animate-in zoom-in-95'
              }`}
            >
              {displayedChallenge}
            </span>
            {reel2Stopped && (
              <div className="absolute top-2 right-2 px-3 py-0.5 rounded-full bg-[#FF8A1F] text-slate-950 text-[12px] font-black uppercase">
                Fijado
              </div>
            )}
          </div>
        </div>

        {/* REEL 3: PREMIO */}
        <div className="flex flex-col items-center rounded-3xl bg-[#15173A] border-4 border-[#2A2D5C] overflow-hidden shadow-2xl p-6">
          <div className="flex items-center gap-2.5 text-[#FFC53D] mb-4">
            <Gift className="w-8 h-8" />
            <span className="text-[24px] font-black uppercase tracking-widest">3. PREMIO</span>
          </div>

          <div className="w-full h-[180px] rounded-2xl bg-[#0A0B1E] border-2 border-[#FFC53D]/50 flex items-center justify-center p-4 text-center shadow-inner relative overflow-hidden">
            <span
              className={`text-[32px] font-black text-[#FFC53D] leading-tight transition-all ${
                !reel3Stopped ? 'blur-[1px] opacity-80' : 'animate-in zoom-in-95'
              }`}
            >
              {displayedPrize}
            </span>
            {reel3Stopped && (
              <div className="absolute top-2 right-2 px-3 py-0.5 rounded-full bg-[#FFC53D] text-slate-950 text-[12px] font-black uppercase">
                Fijado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Final Phrase Result Card: "[Persona] [reto] y gana [premio]" */}
      {showFinalPhrase && (
        <div className="w-full p-8 rounded-3xl bg-gradient-to-r from-[#1C1F47] via-[#15173A] to-[#1C1F47] border-4 border-[#FFC53D] shadow-2xl text-center animate-in zoom-in-95 duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3A2A05] border border-[#FFC53D] text-[#FFC53D] text-[18px] font-black uppercase tracking-widest mb-3">
            <Sparkles className="w-5 h-5" /> ¡COMBINACIÓN DE RETO RESULTANTE!
          </div>

          <p className="text-[44px] font-black text-white leading-tight tracking-tight">
            <span className="text-[#4ADE80] underline decoration-[#4ADE80]/50 decoration-4">
              {displayedPerson}
            </span>{' '}
            <span className="text-[#FF8A1F]">{displayedChallenge}</span>{' '}
            <span className="text-white">y gana</span>{' '}
            <span className="text-[#FFC53D] underline decoration-[#FFC53D]/50 decoration-4">
              {displayedPrize}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
