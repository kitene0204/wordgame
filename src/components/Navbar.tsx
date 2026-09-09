import React, { useState } from 'react';
import { Volume2, VolumeX, Home, Copy, Check, Users, Sparkles } from 'lucide-react';
import { playSound, toggleMute, getMuteState } from '../utils/audio';

interface NavbarProps {
  roomCode?: string;
  isHost?: boolean;
  onGoHome?: () => void;
  playerCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  isHost,
  onGoHome,
  playerCount,
}) => {
  const [muted, setMuted] = useState(getMuteState());
  const [copied, setCopied] = useState(false);

  const handleToggleSound = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) playSound('click');
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    playSound('click');
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur border-b-4 border-sky-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Logo / Title */}
        <button
          onClick={() => {
            playSound('click');
            if (onGoHome) onGoHome();
          }}
          className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-xl shadow-sm">
            📖
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-sky-700 tracking-tight">
                초등 어휘 대장!
              </span>
              <span className="hidden sm:inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-300 font-bold">
                실시간 퀴즈
              </span>
            </div>
            <p className="text-xs text-sky-500 hidden md:block">
              우리반 다함께 즐기는 실시간 어휘 배틀
            </p>
          </div>
        </button>

        {/* Room Info Badge (if in room) */}
        {roomCode && (
          <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-2xl border-2 border-sky-300">
            <span className="text-xs sm:text-sm text-sky-700 font-bold">
              방 코드: <span className="text-sky-900 font-extrabold text-sm sm:text-base tracking-widest">{roomCode}</span>
            </span>
            <button
              onClick={handleCopyCode}
              title="방 코드 복사"
              className="p-1 rounded-lg bg-sky-200 hover:bg-sky-300 text-sky-800 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
            {playerCount !== undefined && (
              <div className="flex items-center gap-1 text-xs text-sky-600 pl-1 border-l border-sky-200">
                <Users size={14} />
                <span>{playerCount}명</span>
              </div>
            )}
            {isHost && (
              <span className="bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                진행자
              </span>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={muted ? '소리 켜기' : '소리 끄기'}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            {muted ? <VolumeX size={20} className="text-rose-500" /> : <Volume2 size={20} className="text-sky-600" />}
          </button>

          {/* Home Button (when inside a game or room) */}
          {onGoHome && (
            <button
              onClick={() => {
                playSound('click');
                if (window.confirm('홈 화면으로 나가시겠습니까? 진행 중인 게임이 종료될 수 있습니다.')) {
                  onGoHome();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 text-sm font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Home size={18} />
              <span className="hidden sm:inline">나가기</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
