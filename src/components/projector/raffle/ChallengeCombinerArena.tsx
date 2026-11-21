import React, { useEffect, useState, useMemo } from 'react';
import { RaffleParticipant, RaffleSpinEvent } from '../../../types/masterStudio';
import { User, Flame, Gift, Sparkles } from 'lucide-react';

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

    const interval1 = setInterval(() => {
      setCurrentPersonIdx((prev) => (prev + 1) % Math.max(1, activeParticipants.length));
    }, 70);

    const interval2 = setInterval(() => {
      setCurrentChallengeIdx((prev) => (prev + 1) % safeChallenges.length);
    }, 70);

    const interval3 = setInterval(() => {
      setCurrentPrizeIdx((prev) => (prev + 1) % safePrizes.length);
    }, 70);

    const timeReel1 = Math.max(1000, durationMs - 2000);
    const timeReel2 = Math.max(2000, durationMs - 1000);
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

  const prevPerson = activeParticipants[(currentPersonIdx - 1 + activeParticipants.length) % Math.max(1, activeParticipants.length)]?.name || '';
  const nextPerson = activeParticipants[(currentPersonIdx + 1) % Math.max(1, activeParticipants.length)]?.name || '';

  const prevChallenge = safeChallenges[(currentChallengeIdx - 1 + safeChallenges.length) % safeChallenges.length] || '';
  const nextChallenge = safeChallenges[(currentChallengeIdx + 1) % safeChallenges.length] || '';

  const prevPrize = safePrizes[(currentPrizeIdx - 1 + safePrizes.length) % safePrizes.length] || '';
  const nextPrize = safePrizes[(currentPrizeIdx + 1) % safePrizes.length] || '';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-5 select-none max-w-full">
      {/* 3 Slot Reels Grid */}
      <div className="flex items-stretch justify-between gap-[36px] w-full">
        {/* REEL 1: PERSONA */}
        <div className="flex-1 flex flex-col items-center rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-line)] overflow-hidden shadow-md p-5">
          <div className="flex items-center gap-2.5 text-[var(--p-text)] mb-3">
            <User className="w-8 h-8 text-[var(--p-accent-ink)]" />
            <span className="text-[24px] font-black uppercase tracking-widest">1. Persona</span>
          </div>

          <div className="w-full h-[480px] rounded-2xl bg-[var(--p-panel-2)] border-2 border-[var(--p-line)] flex flex-col items-center justify-between p-4 relative overflow-hidden">
            <div className="h-[90px] flex items-center justify-center text-center opacity-35 text-[var(--p-text-2)] text-[36px] font-bold truncate w-full px-2">
              {prevPerson}
            </div>

            <div className="w-full min-h-[160px] flex-1 flex flex-col items-center justify-center rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-brand)] shadow-sm px-3 py-2 text-center relative z-10">
              <span
                className={`text-[54px] font-black text-[var(--p-text)] leading-tight transition-all ${
                  !reel1Stopped ? 'blur-[1px] opacity-80' : 'animate-in zoom-in-95'
                }`}
                style={{ textWrap: 'balance' }}
              >
                {displayedPerson}
              </span>
              {reel1Stopped && (
                <div className="mt-2 px-4 py-0.5 rounded-full bg-[var(--p-brand)] text-[var(--p-on-brand)] text-[13px] font-black uppercase tracking-wider">
                  Fijado
                </div>
              )}
            </div>

            <div className="h-[90px] flex items-center justify-center text-center opacity-35 text-[var(--p-text-2)] text-[36px] font-bold truncate w-full px-2">
              {nextPerson}
            </div>
          </div>
        </div>

        {/* REEL 2: RETO */}
        <div className="flex-1 flex flex-col items-center rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-line)] overflow-hidden shadow-md p-5">
          <div className="flex items-center gap-2.5 text-[var(--p-text)] mb-3">
            <Flame className="w-8 h-8 text-[var(--p-accent-ink)]" />
            <span className="text-[24px] font-black uppercase tracking-widest">2. Reto</span>
          </div>

          <div className="w-full h-[480px] rounded-2xl bg-[var(--p-panel-2)] border-2 border-[var(--p-line)] flex flex-col items-center justify-between p-4 relative overflow-hidden">
            <div className="h-[90px] flex items-center justify-center text-center opacity-35 text-[var(--p-text-2)] text-[36px] font-bold truncate w-full px-2">
              {prevChallenge}
            </div>

            <div className="w-full min-h-[160px] flex-1 flex flex-col items-center justify-center rounded-2xl bg-[var(--p-accent-soft)] border-2 border-[var(--p-accent-ink)] shadow-sm px-3 py-2 text-center relative z-10">
              <span
                className={`text-[54px] font-black text-[var(--p-text)] leading-tight transition-all ${
                  !reel2Stopped ? 'blur-[1px] opacity-80' : 'animate-in zoom-in-95'
                }`}
                style={{ textWrap: 'balance' }}
              >
                {displayedChallenge}
              </span>
              {reel2Stopped && (
                <div className="mt-2 px-4 py-0.5 rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] text-[13px] font-black uppercase tracking-wider">
                  Fijado
                </div>
              )}
            </div>

            <div className="h-[90px] flex items-center justify-center text-center opacity-35 text-[var(--p-text-2)] text-[36px] font-bold truncate w-full px-2">
              {nextChallenge}
            </div>
          </div>
        </div>

        {/* REEL 3: PREMIO */}
        <div className="flex-1 flex flex-col items-center rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-line)] overflow-hidden shadow-md p-5">
          <div className="flex items-center gap-2.5 text-[var(--p-text)] mb-3">
            <Gift className="w-8 h-8 text-[var(--p-accent-ink)]" />
            <span className="text-[24px] font-black uppercase tracking-widest">3. Premio</span>
          </div>

          <div className="w-full h-[480px] rounded-2xl bg-[var(--p-panel-2)] border-2 border-[var(--p-line)] flex flex-col items-center justify-between p-4 relative overflow-hidden">
            <div className="h-[90px] flex items-center justify-center text-center opacity-35 text-[var(--p-text-2)] text-[36px] font-bold truncate w-full px-2">
              {prevPrize}
            </div>

            <div className="w-full min-h-[160px] flex-1 flex flex-col items-center justify-center rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-accent-ink)] shadow-sm px-3 py-2 text-center relative z-10">
              <span
                className={`text-[54px] font-black text-[var(--p-accent-ink)] leading-tight transition-all ${
                  !reel3Stopped ? 'blur-[1px] opacity-80' : 'animate-in zoom-in-95'
                }`}
                style={{ textWrap: 'balance' }}
              >
                {displayedPrize}
              </span>
              {reel3Stopped && (
                <div className="mt-2 px-4 py-0.5 rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] text-[13px] font-black uppercase tracking-wider">
                  Fijado
                </div>
              )}
            </div>

            <div className="h-[90px] flex items-center justify-center text-center opacity-35 text-[var(--p-text-2)] text-[36px] font-bold truncate w-full px-2">
              {nextPrize}
            </div>
          </div>
        </div>
      </div>

      {/* Final Phrase Result Card */}
      {showFinalPhrase && (
        <div className="w-full p-6 rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-accent-ink)] shadow-lg text-center animate-in zoom-in-95 duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] text-[18px] font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-5 h-5" /> ¡Combinación de reto resultante!
          </div>

          <p className="text-[42px] font-black text-[var(--p-text)] leading-tight tracking-tight">
            <span className="text-[var(--p-ok)] underline decoration-4">
              {displayedPerson}
            </span>{' '}
            <span className="text-[var(--p-text)]">{displayedChallenge}</span>{' '}
            <span className="text-[var(--p-text-2)]">y gana</span>{' '}
            <span className="text-[var(--p-accent-ink)] underline decoration-4">
              {displayedPrize}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
