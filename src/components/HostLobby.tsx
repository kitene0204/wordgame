import React, { useState } from 'react';
import { Users, Copy, Check, Play, Settings, Sparkles, BookOpen, Clock, ShieldCheck, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Player, SubjectType, SemesterType, SheetSyncStatus } from '../types';
import { playSound } from '../utils/audio';

interface HostLobbyProps {
  roomCode: string;
  players: Record<string, Player>;
  subject: SubjectType;
  semester: SemesterType;
  numQuestions: number;
  timeLimitSec: number;
  onUpdateSettings: (subject: SubjectType, numQuestions: number, timeLimitSec: number, semester: SemesterType) => void;
  onStartGame: () => void;
  onOpenSheetModal?: () => void;
  sheetStatus?: SheetSyncStatus | null;
}

export const HostLobby: React.FC<HostLobbyProps> = ({
  roomCode,
  players,
  subject,
  semester,
  numQuestions,
  timeLimitSec,
  onUpdateSettings,
  onStartGame,
  onOpenSheetModal,
  sheetStatus,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const playerList = Object.values(players) as Player[];
  const studentList = playerList.filter((p) => !p.isHost && p.connected);

  const handleCopyLink = () => {
    playSound('click');
    const fullUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    playSound('click');
    navigator.clipboard.writeText(roomCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleStart = () => {
    playSound('start');
    onStartGame();
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 py-8 px-4 flex flex-col items-center justify-center break-keep">
      <div className="max-w-3xl w-full space-y-6">
        {/* Top Room Banner for Classroom TV / Projector */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-sky-400 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 px-4 py-1 rounded-full text-sm font-bold mb-3 border border-sky-300">
            <Sparkles size={16} className="text-amber-500" />
            선생님 진행 화면 (교실 TV / 빔프로젝터에 띄우기 좋아요)
          </div>

          <p className="text-slate-600 text-lg font-bold">
            스마트폰이나 태블릿, 크롬북에서 아래 코드로 접속하세요!
          </p>

          {/* Big Room PIN Display */}
          <div className="my-5 inline-flex flex-col sm:flex-row items-center gap-4 bg-amber-50 border-3 border-amber-300 rounded-3xl px-8 py-5 shadow-inner">
            <div>
              <span className="text-xs text-amber-700 font-bold block uppercase tracking-wider">
                참가 핀 번호
              </span>
              <span className="text-5xl sm:text-6xl font-black text-amber-900 tracking-widest font-mono">
                {roomCode}
              </span>
            </div>
            <div className="flex flex-row sm:flex-col gap-2">
              <button
                onClick={handleCopyPin}
                className="px-4 py-2 rounded-xl bg-amber-300 hover:bg-amber-400 text-amber-950 font-bold text-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {copiedPin ? <Check size={16} className="text-emerald-700" /> : <Copy size={16} />}
                {copiedPin ? '번호 복사됨!' : '번호 복사'}
              </button>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {copiedLink ? <Check size={16} className="text-white" /> : <Copy size={16} />}
                {copiedLink ? '링크 복사됨!' : '참가 링크 복사'}
              </button>
            </div>
          </div>

          {/* Quick Settings Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-700 font-bold mb-3">
            <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-xl border border-sky-200">
              과목: {subject}
            </span>
            <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-xl border border-amber-200">
              학기: {semester === '전체' ? '1·2학기 통합' : semester}
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200">
              {numQuestions}문제
            </span>
            <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-xl border border-rose-200">
              문제당 {timeLimitSec}초
            </span>
            <button
              onClick={() => {
                playSound('click');
                setShowSettings(!showSettings);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Settings size={14} />
              {showSettings ? '설정 닫기' : '설정 변경'}
            </button>
          </div>

          {/* Collapsible Settings Drawer */}
          {showSettings && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-left space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">과목 선택</span>
                  {onOpenSheetModal && (
                    <button
                      onClick={onOpenSheetModal}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet size={13} />
                      {sheetStatus?.isCustomSheet ? '시트 연동 중 (수정/새로고침)' : '구글 시트 연동하기'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['전체', '국어', '수학', '사회', '영어'] as SubjectType[]).map((subj) => (
                    <button
                      key={subj}
                      onClick={() => onUpdateSettings(subj, numQuestions, timeLimitSec, semester)}
                      className={`py-1.5 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
                        subject === subj ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-white border'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-600 block mb-1">학기 선택</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: '전체' as SemesterType, label: '전체 (1·2학기 통합)' },
                    { id: '1학기' as SemesterType, label: '1학기' },
                    { id: '2학기' as SemesterType, label: '2학기' },
                  ].map((sem) => (
                    <button
                      key={sem.id}
                      onClick={() => onUpdateSettings(subject, numQuestions, timeLimitSec, sem.id)}
                      className={`py-1.5 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
                        semester === sem.id ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-white border'
                      }`}
                    >
                      {sem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1">문항 수</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => onUpdateSettings(subject, num, timeLimitSec, semester)}
                        className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          numQuestions === num ? 'bg-sky-400 text-white' : 'bg-white border'
                        }`}
                      >
                        {num}개
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1">제한 시간</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[10, 15, 20].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => onUpdateSettings(subject, numQuestions, sec, semester)}
                        className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          timeLimitSec === sec ? 'bg-rose-400 text-white' : 'bg-white border'
                        }`}
                      >
                        {sec}초
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Joined Students Grid */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-300">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                입장한 우리반 친구들
              </h2>
            </div>
            <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-base font-extrabold border border-amber-300">
              총 {studentList.length}명 대기 중
            </span>
          </div>

          {studentList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="text-4xl animate-pulse">⏰</div>
              <p className="text-lg font-bold text-slate-500">
                학생들이 방 코드를 입력하고 들어오길 기다리고 있어요...
              </p>
              <p className="text-sm text-slate-400">
                학생 화면에서 방 코드 <strong className="text-amber-700">{roomCode}</strong>를 입력하면 여기에 바로 나타납니다!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
              {studentList.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50 border-2 border-sky-200 shadow-xs animate-scale-in"
                >
                  <span className="text-2xl">{player.avatar}</span>
                  <div className="truncate">
                    <span className="font-bold text-slate-800 text-sm truncate block">
                      {player.name}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">준비 완료 ✓</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Start Game Action Button */}
          <div className="mt-8 pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleStart}
              className="w-full sm:flex-1 py-4.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-2xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-3"
            >
              <Play size={28} fill="currentColor" />
              어휘 퀴즈 배틀 시작하기! ({studentList.length}명)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
