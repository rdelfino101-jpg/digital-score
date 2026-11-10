import React from 'react';
import { MusicKaraokeGameState } from '../../../types/masterStudio';
import { Music, Mic2, Disc, Sparkles, Volume2, HelpCircle } from 'lucide-react';

interface MusicKaraokeArenaProps {
  stage: MusicKaraokeGameState;
}

export const MusicKaraokeArena: React.FC<MusicKaraokeArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Disc className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">MÚSICA & KARAOKE</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
      </div>
    );
  }

  const isSongRevealed = stage?.revealedSong || stage?.lyricsSolved || false;
  const isPlaying = stage?.isPlaying || false;
  const currentMode = stage?.currentMode || 'guess_song';

  const modeLabels: Record<string, string> = {
    guess_song: 'Adivina la Canción',
    guess_lyrics: 'No Olvides la Letra',
    karaoke_show: 'Karaoke Show TV',
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      {/* Top Header: Mode & Points */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] uppercase tracking-wide">
            <Music className="w-6 h-6 text-[#FFC53D]" />
            {modeLabels[currentMode] || 'Music Show'}
          </span>
          <span className="px-5 py-2 rounded-full bg-[#15173A] border border-[#2A2D5C] text-white font-bold text-[22px]">
            {item.category || 'Música'} · {item.points} PTS
          </span>
        </div>

        {isPlaying && (
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#0F5132] border-2 border-[#4ADE80] text-[#4ADE80] text-[22px] font-black uppercase tracking-wider animate-pulse">
            <Volume2 className="w-6 h-6" />
            Audio en Vivo
          </div>
        )}
      </div>

      {/* Center Arena: Animated Equalizer + Mystery / Revealed Title */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-4 gap-8">
        {/* Animated Equalizer with large bars */}
        <div className="flex items-end justify-center gap-3 h-36 w-full max-w-4xl px-8 py-4 rounded-3xl bg-[#15173A]/80 border-2 border-[#2A2D5C]">
          {[60, 90, 45, 100, 75, 120, 50, 85, 110, 65, 95, 40, 105, 80, 55, 115, 70].map((h, i) => {
            const barHeight = isPlaying ? `${Math.min(100, Math.max(20, h * 0.8))}%` : '20%';
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-300"
                style={{
                  height: barHeight,
                  backgroundColor: i % 2 === 0 ? '#4F7BFF' : '#FFC53D',
                  opacity: isPlaying ? 1 : 0.4,
                }}
              />
            );
          })}
        </div>

        {/* Secret or Revealed Title */}
        <div className="text-center max-w-5xl">
          {isSongRevealed ? (
            <div className="flex flex-col items-center gap-2 animate-in zoom-in-95 duration-300">
              <span className="text-[20px] font-black uppercase tracking-widest text-[#4ADE80]">
                TÍTULO REVELADO
              </span>
              <h2 className="text-[72px] font-black leading-tight text-white tracking-tight">
                {item.title}
              </h2>
              <p className="text-[36px] font-bold text-[#FFC53D] mt-1">
                {item.artist}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-[84px] font-black tracking-widest text-white/90 drop-shadow-lg">
                ? ? ? ? ?
              </h2>
              <span className="text-[26px] font-black tracking-widest text-[#B8BCE6] uppercase">
                Pista musical en reproducción · ¿Reconoces la canción?
              </span>
            </div>
          )}
        </div>

        {/* If Mode is Guess Lyrics, show the lyrics challenge */}
        {currentMode === 'guess_lyrics' && item.letraPrevia && (
          <div className="w-full max-w-4xl p-6 rounded-2xl bg-[#1C1F47] border-2 border-[#4B5299] text-center">
            <p className="text-[24px] text-[#B8BCE6] font-medium mb-3 italic">
              "{item.letraPrevia}..."
            </p>
            <div className="text-[38px] font-black text-[#FFC53D]">
              {stage?.lyricsSolved ? item.letraSecreta : '¿Cuál es la siguiente frase?'}
            </div>
          </div>
        )}
      </div>

      {/* Large Call-To-Action Banner at Bottom */}
      <div className="w-full py-4 px-8 rounded-2xl bg-[#15173A] border-4 border-[#FFC53D] text-center shadow-xl shadow-[#FFC53D]/10">
        <p className="text-[34px] font-black text-[#FFC53D] uppercase tracking-wide">
          ¡PULSA TU BOTÓN PARA RESPONDER!
        </p>
      </div>
    </div>
  );
};
