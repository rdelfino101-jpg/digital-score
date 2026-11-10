import React, { useState, useRef, useEffect } from 'react';
import {
  MasterLiveState,
  MusicTrackItem,
  MusicGameMode,
} from '../../../types/masterStudio';
import { extractYouTubeVideoId } from '../../../utils/gameEngineRules';
import { INITIAL_MUSIC_ITEMS } from '../../../utils/gameData';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Search,
  Mic2,
  Eye,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  Disc,
  Radio,
  FileAudio,
  Tv,
} from 'lucide-react';

interface MusicKaraokeControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
}

export const MusicKaraokeController: React.FC<MusicKaraokeControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onTriggerError,
}) => {
  const stage = state.gameStage.musicKaraoke;
  const currentTrack: MusicTrackItem | undefined = stage.items[stage.currentIndex];

  const [activeSubTab, setActiveSubTab] = useState<'live' | 'manager'>('live');

  // Local audio / video ref for monitoring and preview in console
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const localMediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);

  // Snippet countdown & timer tracking
  const [snippetSecondsLeft, setSnippetSecondsLeft] = useState<number | null>(null);
  const snippetTimerRef = useRef<number | null>(null);

  // Lyrics cut timer tracking
  const [elapsedLyricsSeconds, setElapsedLyricsSeconds] = useState<number>(0);
  const lyricsTimerRef = useRef<number | null>(null);

  // Form state for adding/editing songs
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formMode, setFormMode] = useState<MusicGameMode>('guess_song');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formStartTime, setFormStartTime] = useState<number>(30);
  const [formCutTime, setFormCutTime] = useState<number>(50);
  const [formLetraPrevia, setFormLetraPrevia] = useState('');
  const [formLetraSecreta, setFormLetraSecreta] = useState('');
  const [formPoints, setFormPoints] = useState<number>(100);

  // Jury custom rating slider
  const [customJuryScore, setCustomJuryScore] = useState<number>(90);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);
      if (lyricsTimerRef.current) clearInterval(lyricsTimerRef.current);
    };
  }, []);

  // PostMessage command to YouTube iframe
  const sendIframeCommand = (command: string, args: any = '') => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args }),
        '*'
      );
    }
  };

  const handleSeekAndPlay = (seconds: number) => {
    sendIframeCommand('seekTo', [seconds, true]);
    sendIframeCommand('playVideo');
    if (localMediaRef.current) {
      localMediaRef.current.currentTime = seconds;
      localMediaRef.current.play().catch(() => {});
    }
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          isPlaying: true,
          currentPlaybackSeconds: seconds,
        },
      },
    }));
  };

  const handlePause = () => {
    if (snippetTimerRef.current) {
      clearInterval(snippetTimerRef.current);
      snippetTimerRef.current = null;
    }
    if (lyricsTimerRef.current) {
      clearInterval(lyricsTimerRef.current);
      lyricsTimerRef.current = null;
    }
    setSnippetSecondsLeft(null);
    sendIframeCommand('pauseVideo');
    if (localMediaRef.current) {
      localMediaRef.current.pause();
    }
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          isPlaying: false,
        },
      },
    }));
  };

  // MODO A: Play snippet for X seconds
  const handlePlaySnippet = (seconds: number, suggestedPoints: number) => {
    if (!currentTrack) return;
    if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);

    handleSeekAndPlay(currentTrack.startTime);
    setSnippetSecondsLeft(seconds);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          activeSnippetSeconds: seconds,
        },
      },
    }));

    let remaining = seconds;
    snippetTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setSnippetSecondsLeft(remaining);
      if (remaining <= 0) {
        if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);
        snippetTimerRef.current = null;
        setSnippetSecondsLeft(null);
        handlePause();
      }
    }, 1000);
  };

  // MODO A: Reveal song and award points
  const handleRevealSong = (points?: number) => {
    if (!currentTrack) return;
    const finalPts = points || (stage.activeSnippetSeconds === 1 ? 200 : stage.activeSnippetSeconds === 3 ? 150 : stage.activeSnippetSeconds === 5 ? 100 : 50);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          revealedSong: true,
        },
      },
    }));

    // Award points to active team
    onAwardActiveTeam(finalPts, `Adivinó la canción: ${currentTrack.title}`);
  };

  // MODO B: Iniciar ronda de letra con corte programado
  const handleStartLyricsRound = () => {
    if (!currentTrack) return;
    if (lyricsTimerRef.current) clearInterval(lyricsTimerRef.current);

    const startSec = currentTrack.startTime || 0;
    const cutSec = currentTrack.cutTime || startSec + 15;

    handleSeekAndPlay(startSec);
    setElapsedLyricsSeconds(startSec);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          isMusicCut: false,
          revealedWordsCount: 0,
          lyricsSolved: false,
          isPlaying: true,
          currentPlaybackSeconds: startSec,
        },
      },
    }));

    let cur = startSec;
    lyricsTimerRef.current = window.setInterval(() => {
      cur += 1;
      setElapsedLyricsSeconds(cur);
      if (cur >= cutSec) {
        if (lyricsTimerRef.current) clearInterval(lyricsTimerRef.current);
        lyricsTimerRef.current = null;
        handleCutMusicNow();
      }
    }, 1000);
  };

  // MODO B: Cut music now (auto or manual)
  const handleCutMusicNow = () => {
    if (lyricsTimerRef.current) {
      clearInterval(lyricsTimerRef.current);
      lyricsTimerRef.current = null;
    }
    sendIframeCommand('pauseVideo');
    if (localMediaRef.current) {
      localMediaRef.current.pause();
    }

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          isMusicCut: true,
          isPlaying: false,
        },
      },
    }));
  };

  // MODO B: Reveal word by word
  const handleRevealWordByWord = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          revealedWordsCount: prev.gameStage.musicKaraoke.revealedWordsCount + 1,
        },
      },
    }));
  };

  // MODO B: Solved correctly!
  const handleLyricsCorrect = () => {
    if (!currentTrack) return;
    // Resume audio
    sendIframeCommand('playVideo');
    if (localMediaRef.current) {
      localMediaRef.current.play().catch(() => {});
    }

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          lyricsSolved: true,
          isPlaying: true,
        },
      },
    }));

    onAwardActiveTeam(currentTrack.points || 150, `Cantó la letra correcta: ${currentTrack.title}`);
  };

  // MODO B: Error in lyrics
  const handleLyricsWrong = () => {
    onTriggerError();
    onUpdateState((prev) => ({
      ...prev,
      turn: {
        ...prev.turn,
        stealMode: true,
      },
    }));
  };

  // MODO C: Jury rating
  const handleAwardKaraokeScore = (pts: number, label: string) => {
    if (!currentTrack) return;
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          karaokeScore: pts,
          lastAwardedPoints: pts,
          lastAwardedRatingLabel: label,
          showScoreCelebration: true,
        },
      },
    }));

    onAwardActiveTeam(pts, `Karaoke Show (${label}) - ${currentTrack.title}`);

    // Auto dismiss score celebration overlay after 6s
    setTimeout(() => {
      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          musicKaraoke: {
            ...prev.gameStage.musicKaraoke,
            showScoreCelebration: false,
          },
        },
      }));
    }, 6000);
  };

  // Switch mode for active song
  const handleChangeCurrentMode = (mode: MusicGameMode) => {
    handlePause();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          currentMode: mode,
          revealedSong: false,
          isMusicCut: false,
          lyricsSolved: false,
          revealedWordsCount: 0,
          showScoreCelebration: false,
        },
      },
    }));
  };

  // Navigate songs
  const handleSelectTrack = (index: number) => {
    handlePause();
    const track = stage.items[index];
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          currentIndex: index,
          currentMode: track?.mode || 'guess_song',
          revealedSong: false,
          activeSnippetSeconds: null,
          isMusicCut: false,
          revealedWordsCount: 0,
          lyricsSolved: false,
          showScoreCelebration: false,
        },
      },
    }));
  };

  // Form Save
  const handleSaveSongForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const videoId = extractYouTubeVideoId(formYoutubeUrl) || '';

    if (editingSongId) {
      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          musicKaraoke: {
            ...prev.gameStage.musicKaraoke,
            items: prev.gameStage.musicKaraoke.items.map((item) =>
              item.id === editingSongId
                ? {
                    ...item,
                    title: formTitle.trim(),
                    artist: formArtist.trim() || 'Artista',
                    category: formCategory.trim() || 'Música General',
                    mode: formMode,
                    youtubeUrl: formYoutubeUrl.trim(),
                    videoId,
                    startTime: Number(formStartTime) || 0,
                    cutTime: Number(formCutTime) || 30,
                    letraPrevia: formLetraPrevia.trim(),
                    letraSecreta: formLetraSecreta.trim(),
                    points: Number(formPoints) || 100,
                  }
                : item
            ),
          },
        },
      }));
      setEditingSongId(null);
    } else {
      const newSong: MusicTrackItem = {
        id: `song-${Date.now()}`,
        title: formTitle.trim(),
        artist: formArtist.trim() || 'Artista',
        category: formCategory.trim() || 'Música General',
        mode: formMode,
        youtubeUrl: formYoutubeUrl.trim(),
        videoId,
        startTime: Number(formStartTime) || 0,
        cutTime: Number(formCutTime) || 30,
        letraPrevia: formLetraPrevia.trim(),
        letraSecreta: formLetraSecreta.trim(),
        points: Number(formPoints) || 100,
      };

      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          musicKaraoke: {
            ...prev.gameStage.musicKaraoke,
            items: [...prev.gameStage.musicKaraoke.items, newSong],
          },
        },
      }));
    }

    // Reset form
    setFormTitle('');
    setFormArtist('');
    setFormCategory('');
    setFormYoutubeUrl('');
    setFormLetraPrevia('');
    setFormLetraSecreta('');
    setFormStartTime(30);
    setFormCutTime(50);
    setFormPoints(100);
  };

  const handleEditClick = (song: MusicTrackItem) => {
    setEditingSongId(song.id);
    setFormTitle(song.title);
    setFormArtist(song.artist);
    setFormCategory(song.category);
    setFormMode(song.mode);
    setFormYoutubeUrl(song.youtubeUrl || '');
    setFormStartTime(song.startTime || 0);
    setFormCutTime(song.cutTime || 30);
    setFormLetraPrevia(song.letraPrevia || '');
    setFormLetraSecreta(song.letraSecreta || '');
    setFormPoints(song.points || 100);
    setActiveSubTab('manager');
  };

  const handleDeleteSong = (id: string) => {
    if (stage.items.length <= 1) return;
    onUpdateState((prev) => {
      const newItems = prev.gameStage.musicKaraoke.items.filter((s) => s.id !== id);
      const newIndex = Math.min(prev.gameStage.musicKaraoke.currentIndex, newItems.length - 1);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          musicKaraoke: {
            ...prev.gameStage.musicKaraoke,
            items: newItems,
            currentIndex: Math.max(0, newIndex),
          },
        },
      };
    });
  };

  const handleRestoreDefaults = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          items: INITIAL_MUSIC_ITEMS,
          currentIndex: 0,
          currentMode: INITIAL_MUSIC_ITEMS[0].mode,
        },
      },
    }));
  };

  // Helper search URLs
  const openYoutubeSearch = (type: 'lyrics' | 'karaoke') => {
    const query = `${formTitle} ${formArtist} ${type === 'lyrics' ? 'lyrics' : 'karaoke'}`.trim();
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  // Local media upload
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTrack) return;
    const objectUrl = URL.createObjectURL(file);
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        musicKaraoke: {
          ...prev.gameStage.musicKaraoke,
          items: prev.gameStage.musicKaraoke.items.map((it, idx) =>
            idx === prev.gameStage.musicKaraoke.currentIndex
              ? { ...it, localMediaUrl: objectUrl }
              : it
          ),
        },
      },
    }));
  };

  return (
    <div className="flex flex-col gap-4 text-slate-100">
      {/* Top Bar: Subtabs (En Vivo vs Gestor) & Quick Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
            <Music className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              8. Music & Karaoke Show
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                3 en 1
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Adivina la Canción • No Olvides la Letra • Karaoke TV en Proyector
            </p>
          </div>
        </div>

        {/* Subtabs switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'live'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Control En Vivo</span>
          </button>
          <button
            onClick={() => setActiveSubTab('manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'manager'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Gestor de Canciones ({stage.items.length})</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* VIEW A: LIVE CONTROL WORKSPACE                                      */}
      {/* =================================================================== */}
      {activeSubTab === 'live' && currentTrack && (
        <div className="space-y-4 animate-fadeIn">
          {/* Track Header & Quick Nav */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSelectTrack(Math.max(0, stage.currentIndex - 1))}
                  disabled={stage.currentIndex === 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
                  title="Canción Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-300 px-2">
                  {stage.currentIndex + 1} / {stage.items.length}
                </span>
                <button
                  onClick={() => handleSelectTrack(Math.min(stage.items.length - 1, stage.currentIndex + 1))}
                  disabled={stage.currentIndex === stage.items.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
                  title="Siguiente Canción"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* YouTube thumbnail or icon */}
              {currentTrack.videoId ? (
                <img
                  src={`https://img.youtube.com/vi/${currentTrack.videoId}/mqdefault.jpg`}
                  alt="Cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-16 h-10 object-cover rounded-lg border border-slate-700 shadow"
                />
              ) : (
                <div className="w-16 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-pink-400">
                  <Music className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-white">{currentTrack.title}</h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">
                    +{currentTrack.points} PTS
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {currentTrack.artist} • <span className="text-amber-400">{currentTrack.category}</span>
                </p>
              </div>
            </div>

            {/* Audio target switch (Proyector vs Consola vs Ambos) */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px] font-bold">Salida de Audio:</span>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    gameStage: {
                      ...prev.gameStage,
                      musicKaraoke: { ...prev.gameStage.musicKaraoke, audioTarget: 'projector' },
                    },
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  stage.audioTarget === 'projector' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Proyector
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    gameStage: {
                      ...prev.gameStage,
                      musicKaraoke: { ...prev.gameStage.musicKaraoke, audioTarget: 'console' },
                    },
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  stage.audioTarget === 'console' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Consola
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    gameStage: {
                      ...prev.gameStage,
                      musicKaraoke: { ...prev.gameStage.musicKaraoke, audioTarget: 'both' },
                    },
                  }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  stage.audioTarget === 'both' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ambos
              </button>
            </div>
          </div>

          {/* 3 Game Modes Switcher for this track */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleChangeCurrentMode('guess_song')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                stage.currentMode === 'guess_song'
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
                  MODO A (OCULTO)
                </span>
                <span className="font-extrabold text-xs block">Adivina la Canción</span>
                <span className="text-[10px] text-slate-400">Fragmentos 1s, 3s, 5s, 10s</span>
              </div>
            </button>

            <button
              onClick={() => handleChangeCurrentMode('guess_lyrics')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                stage.currentMode === 'guess_lyrics'
                  ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Mic2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-cyan-400 block tracking-wider">
                  MODO B (CORTE)
                </span>
                <span className="font-extrabold text-xs block">No Olvides la Letra</span>
                <span className="text-[10px] text-slate-400">Corte automático a capela</span>
              </div>
            </button>

            <button
              onClick={() => handleChangeCurrentMode('karaoke_show')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                stage.currentMode === 'karaoke_show'
                  ? 'bg-pink-500/20 border-pink-500 text-white shadow-lg shadow-pink-500/20 ring-1 ring-pink-400'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-pink-400 block tracking-wider">
                  MODO C (VIDEO TV)
                </span>
                <span className="font-extrabold text-xs block">Karaoke Show TV</span>
                <span className="text-[10px] text-slate-400">Pista en Proyector + Jurado</span>
              </div>
            </button>
          </div>

          {/* Embedded YouTube Player Monitor in Console */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-64 h-36 bg-black rounded-xl overflow-hidden relative border border-slate-800 shrink-0">
              {currentTrack.videoId ? (
                <iframe
                  ref={iframeRef}
                  id="director-yt-player"
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${currentTrack.videoId}?enablejsapi=1&origin=${encodeURIComponent(
                    typeof window !== 'undefined' ? window.location.origin : ''
                  )}&start=${currentTrack.startTime || 0}&autoplay=0`}
                  title="Player Director"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : currentTrack.localMediaUrl ? (
                <video
                  ref={(el) => {
                    localMediaRef.current = el;
                  }}
                  src={currentTrack.localMediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-xs text-slate-400">
                  <FileAudio className="w-6 h-6 mb-1 text-slate-500" />
                  <span>Sin link de YouTube ni archivo local</span>
                </div>
              )}
            </div>

            {/* Live Playback Controls */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  Monitor de Audio en Consola {stage.isPlaying ? '(Reproduciendo)' : '(Pausado)'}
                </span>

                <label className="text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg">
                  <FileAudio className="w-3.5 h-3.5 text-pink-400" />
                  <span>Cargar MP3/MP4 Local</span>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleLocalFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSeekAndPlay(currentTrack.startTime || 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Reproducir desde {currentTrack.startTime || 0}s</span>
                </button>

                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </button>

                <button
                  onClick={() => {
                    handlePause();
                    handleSeekAndPlay(currentTrack.startTime || 0);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* MODO A: Adivina la Canción Controls                              */}
          {/* =============================================================== */}
          {stage.currentMode === 'guess_song' && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-sm text-amber-300 uppercase tracking-wide">
                    Modo A: Fragmentos Auditivos (Pista Oculta en Proyector)
                  </span>
                </div>
                {snippetSecondsLeft !== null && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse">
                    ⏱️ Sonando: {snippetSecondsLeft}s restantes
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-bold block">
                  1. Dispara un fragmento auditivo corto para que los equipos adivinen:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    onClick={() => handlePlaySnippet(1, 200)}
                    className="p-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>▶️ 1 Seg</span>
                    <span className="text-[10px] text-amber-300 font-black">+200 PTS</span>
                  </button>

                  <button
                    onClick={() => handlePlaySnippet(3, 150)}
                    className="p-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>▶️ 3 Seg</span>
                    <span className="text-[10px] text-amber-300 font-black">+150 PTS</span>
                  </button>

                  <button
                    onClick={() => handlePlaySnippet(5, 100)}
                    className="p-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>▶️ 5 Seg</span>
                    <span className="text-[10px] text-amber-300 font-black">+100 PTS</span>
                  </button>

                  <button
                    onClick={() => handlePlaySnippet(10, 50)}
                    className="p-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-bold transition-all flex flex-col items-center"
                  >
                    <span>▶️ 10 Seg</span>
                    <span className="text-[10px] text-amber-300 font-black">+50 PTS</span>
                  </button>

                  <button
                    onClick={handlePause}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex flex-col items-center col-span-2 sm:col-span-1"
                  >
                    <span>⏹️ Pausar</span>
                    <span className="text-[10px] text-slate-400">Silenciar</span>
                  </button>
                </div>
              </div>

              {/* Reveal & Award */}
              <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRevealSong()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-102"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>¡Revelar Canción y Calificar (+{stage.activeSnippetSeconds === 1 ? 200 : stage.activeSnippetSeconds === 3 ? 150 : 100} PTS)!</span>
                  </button>

                  {stage.revealedSong && (
                    <button
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          gameStage: {
                            ...prev.gameStage,
                            musicKaraoke: { ...prev.gameStage.musicKaraoke, revealedSong: false },
                          },
                        }))
                      }
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Ocultar de Nuevo
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  {stage.revealedSong ? (
                    <span className="text-emerald-400 font-bold">● Canción y Portada Visibles en Proyector</span>
                  ) : (
                    <span className="text-amber-400 font-bold">🔒 Portada y Título Ocultos en Proyector</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODO B: No Olvides la Letra Controls                             */}
          {/* =============================================================== */}
          {stage.currentMode === 'guess_lyrics' && (
            <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-extrabold text-sm text-cyan-300 uppercase tracking-wide">
                    Modo B: ¿Te Sabes la Letra? (Corte Automático a Capela)
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Inicio: <span className="text-white font-bold">{currentTrack.startTime || 0}s</span> | Corte: <span className="text-amber-400 font-bold">{currentTrack.cutTime || 30}s</span>
                </div>
              </div>

              {/* Lyrics Preview in Console */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-black text-cyan-400 block mb-1">
                    Letra Previa Visible (Lo que todos cantan con música):
                  </span>
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    "{currentTrack.letraPrevia || 'Sin letra previa configurada'}"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40">
                  <span className="text-[10px] uppercase font-black text-amber-400 block mb-1">
                    Letra Secreta a Completar (A Capela):
                  </span>
                  <p className="text-xs text-amber-200 font-bold leading-relaxed">
                    "{currentTrack.letraSecreta || 'Sin letra secreta configurada'}"
                  </p>
                </div>
              </div>

              {/* Flow Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-cyan-500/20">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleStartLyricsRound}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-md shadow-cyan-600/30 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>▶️ Iniciar Ronda de Letra (desde {currentTrack.startTime}s)</span>
                  </button>

                  <button
                    onClick={handleCutMusicNow}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md shadow-red-600/30 transition-all animate-pulse"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>🔇 ¡CORTAR MÚSICA AHORA!</span>
                  </button>
                </div>

                {stage.isMusicCut && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRevealWordByWord}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/40"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>👁️ Revelar Palabra ({stage.revealedWordsCount})</span>
                      </button>

                      <button
                        onClick={handleLyricsCorrect}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✅ ¡La Cantó Correcta! (+{currentTrack.points} PTS)</span>
                      </button>

                      <button
                        onClick={handleLyricsWrong}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>❌ Se Equivocó (Buzzer + Robo)</span>
                      </button>
                    </div>

                    <span className="text-xs text-amber-300 font-bold">
                      Estado: ¡MÚSICA SILENCIADA - CANTANDO A CAPELA!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODO C: Karaoke Show TV & Panel de Jurado                       */}
          {/* =============================================================== */}
          {stage.currentMode === 'karaoke_show' && (
            <div className="bg-pink-950/20 border border-pink-500/30 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-pink-400" />
                  <span className="font-extrabold text-sm text-pink-300 uppercase tracking-wide">
                    Modo C: Karaoke Show TV (Video en Proyector + Calificación de Jurado)
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  El video de YouTube se proyecta en grande con la letra para el cantante
                </span>
              </div>

              {/* Jury Scoring Panel */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">
                  Panel de Jurado / Calificación de la Interpretación:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleAwardKaraokeScore(50, 'Regular')}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold transition-all flex flex-col items-center hover:scale-102"
                  >
                    <span className="text-base">😐</span>
                    <span className="text-slate-300 font-bold mt-1">Regular</span>
                    <span className="text-pink-400 font-black">+50 PTS</span>
                  </button>

                  <button
                    onClick={() => handleAwardKaraokeScore(100, '¡Buen Show!')}
                    className="p-3 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-white border border-blue-500/40 text-xs font-bold transition-all flex flex-col items-center hover:scale-102"
                  >
                    <span className="text-base">👏</span>
                    <span className="text-blue-200 font-bold mt-1">¡Buen Show!</span>
                    <span className="text-blue-300 font-black">+100 PTS</span>
                  </button>

                  <button
                    onClick={() => handleAwardKaraokeScore(150, '¡Estrella!')}
                    className="p-3 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-white border border-purple-500/40 text-xs font-bold transition-all flex flex-col items-center hover:scale-102"
                  >
                    <span className="text-base">🌟</span>
                    <span className="text-purple-200 font-bold mt-1">¡Estrella!</span>
                    <span className="text-purple-300 font-black">+150 PTS</span>
                  </button>

                  <button
                    onClick={() => handleAwardKaraokeScore(200, '¡Ovación de Pie!')}
                    className="p-3 rounded-xl bg-pink-600/30 hover:bg-pink-600 text-white border border-pink-500/40 text-xs font-bold transition-all flex flex-col items-center hover:scale-102"
                  >
                    <span className="text-base">🔥</span>
                    <span className="text-pink-200 font-bold mt-1">¡Ovación de Pie!</span>
                    <span className="text-pink-300 font-black">+200 PTS</span>
                  </button>
                </div>

                {/* Slider for custom score 0-100 */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Puntaje Personalizado de Jurado:</span>
                      <span className="text-amber-400 font-black">{customJuryScore} / 100</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={customJuryScore}
                      onChange={(e) => setCustomJuryScore(Number(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => handleAwardKaraokeScore(customJuryScore, `Nota: ${customJuryScore}`)}
                    className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shrink-0"
                  >
                    Calificar (+{customJuryScore} PTS)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW B: SONG CONTENT MANAGER                                        */}
      {/* =================================================================== */}
      {activeSubTab === 'manager' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSaveSongForm}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-pink-400" />
                {editingSongId ? 'Editar Canción' : 'Agregar Nueva Canción / Pista'}
              </h4>
              {editingSongId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSongId(null);
                    setFormTitle('');
                    setFormArtist('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Título de la Canción *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. De Música Ligera"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Artista / Grupo
                </label>
                <input
                  type="text"
                  placeholder="ej. Soda Stereo"
                  value={formArtist}
                  onChange={(e) => setFormArtist(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Categoría / Género
                </label>
                <input
                  type="text"
                  placeholder="ej. Rock Latino 90s"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Mode selection & Helper Search buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Modalidad de Juego
                </label>
                <select
                  value={formMode}
                  onChange={(e) => setFormMode(e.target.value as MusicGameMode)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="guess_song">Adivina la Canción (Escucha y Gana)</option>
                  <option value="guess_lyrics">No Olvides la Letra (Corte de Audio)</option>
                  <option value="karaoke_show">Karaoke Show en Vivo (Pista TV)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Enlace de YouTube o YouTube Music
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formYoutubeUrl}
                    onChange={(e) => setFormYoutubeUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono text-[11px]"
                  />
                  {formYoutubeUrl && extractYouTubeVideoId(formYoutubeUrl) && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center">
                      ID: {extractYouTubeVideoId(formYoutubeUrl)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Fast YouTube search buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-bold">Ayuda Rápida:</span>
              <button
                type="button"
                onClick={() => openYoutubeSearch('lyrics')}
                disabled={!formTitle.trim()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold border border-slate-700"
              >
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>[ 🔎 Buscar Canción en YT ]</span>
              </button>

              <button
                type="button"
                onClick={() => openYoutubeSearch('karaoke')}
                disabled={!formTitle.trim()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold border border-slate-700"
              >
                <Mic2 className="w-3.5 h-3.5 text-pink-400" />
                <span>[ 🎤 Buscar Pista Karaoke en YT ]</span>
              </button>
            </div>

            {/* Times & Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Inicio (segundos)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {formMode === 'guess_lyrics' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Corte (segundos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formCutTime}
                    onChange={(e) => setFormCutTime(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Puntos Base
                </label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={formPoints}
                  onChange={(e) => setFormPoints(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Mode B extra fields */}
            {formMode === 'guess_lyrics' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-cyan-400 block mb-1">
                    Letra Previa Visible (lo que cantan mientras suena la música)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Rayando el sol, desesperación..."
                    value={formLetraPrevia}
                    onChange={(e) => setFormLetraPrevia(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-400 block mb-1">
                    Letra Secreta a Completar (las palabras a capela)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="me muero por ti, viviendo sin ti"
                    value={formLetraSecreta}
                    onChange={(e) => setFormLetraSecreta(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs shadow-md shadow-pink-600/30 transition-all hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                <span>{editingSongId ? 'Guardar Cambios' : '+ Agregar Canción a la Lista'}</span>
              </button>
            </div>
          </form>

          {/* List of current songs */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300">
                Lista de Canciones Disponibles ({stage.items.length})
              </span>
              <button
                onClick={handleRestoreDefaults}
                className="text-[11px] text-slate-400 hover:text-pink-400 font-bold transition-colors"
              >
                Restaurar 6 Canciones por Defecto
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {stage.items.map((song, idx) => {
                const isSelected = idx === stage.currentIndex;
                return (
                  <div
                    key={song.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isSelected
                        ? 'bg-pink-950/30 border-pink-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-black text-slate-500 w-5">{idx + 1}.</span>
                      {song.videoId ? (
                        <img
                          src={`https://img.youtube.com/vi/${song.videoId}/default.jpg`}
                          alt="thumb"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-12 h-9 object-cover rounded border border-slate-800"
                        />
                      ) : (
                        <div className="w-12 h-9 rounded bg-slate-800 flex items-center justify-center text-slate-500">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-white truncate max-w-xs">
                            {song.title}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                              song.mode === 'guess_song'
                                ? 'bg-amber-500/20 text-amber-300'
                                : song.mode === 'guess_lyrics'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-pink-500/20 text-pink-300'
                            }`}
                          >
                            {song.mode === 'guess_song'
                              ? 'Adivina'
                              : song.mode === 'guess_lyrics'
                              ? 'Letra'
                              : 'Karaoke'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {song.artist} • {song.category} • Inicio: {song.startTime}s • +{song.points} pts
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          handleSelectTrack(idx);
                          setActiveSubTab('live');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-pink-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected ? '● Al Aire' : 'Elegir'}
                      </button>

                      <button
                        onClick={() => handleEditClick(song)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSong(song.id)}
                        disabled={stage.items.length <= 1}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 disabled:opacity-30"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
