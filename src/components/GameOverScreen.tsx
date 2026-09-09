import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Crown, Medal, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Player, QuestionHistoryItem } from '../types';
import { playSound } from '../utils/audio';

interface GameOverScreenProps {
  players: Record<string, Player>;
  history: QuestionHistoryItem[];
  isHost: boolean;
  myPlayerId: string;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  players,
  history,
  isHost,
  myPlayerId,
  onRestart,
  onGoHome,
}) => {
  const rankedPlayers = (Object.values(players) as Player[])
    .filter((p) => !p.isHost)
    .sort((a, b) => b.score - a.score);

  const firstPlace = rankedPlayers[0];
  const secondPlace = rankedPlayers[1];
  const thirdPlace = rankedPlayers[2];

  // Trigger celebration sounds and confetti on mount
  useEffect(() => {
    playSound('victory');

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Compute most difficult questions (lowest correct accuracy)
  const sortedByDifficulty = [...history]
    .filter((h) => h.totalAnswered > 0)
    .map((h) => ({
      ...h,
      accuracy: Math.round((h.correctCount / h.totalAnswered) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-amber-100 via-sky-50 to-pink-100 py-10 px-4 flex flex-col items-center justify-center break-keep">
      <div className="max-w-3xl w-full space-y-8">
        {/* Podium Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-amber-400 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-4 py-1.5 rounded-full text-base font-extrabold mb-4 border border-amber-300">
            <Sparkles size={18} className="text-amber-600" />
            초등 어휘 대장 퀴즈 배틀 종료!
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight mb-8">
            우리반 명예의 전당 🏆
          </h2>

          {/* 3D-styled Podium */}
          {rankedPlayers.length > 0 ? (
            <div className="flex items-end justify-center gap-2 sm:gap-4 my-6 px-2">
              {/* 2nd Place */}
              {secondPlace && (
                <div className="flex-1 max-w-[150px] flex flex-col items-center">
                  <div className="text-4xl mb-1">{secondPlace.avatar}</div>
                  <span className="font-extrabold text-slate-800 text-sm sm:text-base truncate max-w-full block">
                    {secondPlace.name}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-sky-700 mb-2">
                    {secondPlace.score.toLocaleString()}점
                  </span>
                  <div className="w-full h-28 sm:h-36 bg-gradient-to-b from-slate-200 to-slate-300 rounded-t-2xl border-2 border-slate-400 flex flex-col items-center justify-center shadow-md">
                    <span className="text-3xl font-black text-slate-600">🥈</span>
                    <span className="text-xs font-bold text-slate-600 mt-1">2위</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Center, Tallest) */}
              {firstPlace && (
                <div className="flex-1 max-w-[170px] flex flex-col items-center -mt-6">
                  <div className="relative">
                    <Crown size={32} className="text-amber-500 absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce" />
                    <div className="text-5xl mb-1">{firstPlace.avatar}</div>
                  </div>
                  <span className="font-black text-slate-900 text-base sm:text-lg truncate max-w-full block">
                    {firstPlace.name}
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-800 mb-2">
                    {firstPlace.score.toLocaleString()}점
                  </span>
                  <div className="w-full h-36 sm:h-48 bg-gradient-to-b from-amber-300 to-yellow-400 rounded-t-2xl border-3 border-amber-500 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-4xl font-black text-amber-950">🥇</span>
                    <span className="text-sm font-black text-amber-950 mt-1">어휘 대장 1위</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {thirdPlace && (
                <div className="flex-1 max-w-[150px] flex flex-col items-center">
                  <div className="text-4xl mb-1">{thirdPlace.avatar}</div>
                  <span className="font-extrabold text-slate-800 text-sm sm:text-base truncate max-w-full block">
                    {thirdPlace.name}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-900 mb-2">
                    {thirdPlace.score.toLocaleString()}점
                  </span>
                  <div className="w-full h-20 sm:h-28 bg-gradient-to-b from-amber-600/30 to-amber-700/40 rounded-t-2xl border-2 border-amber-600/50 flex flex-col items-center justify-center shadow-md">
                    <span className="text-3xl font-black text-amber-900">🥉</span>
                    <span className="text-xs font-bold text-amber-900 mt-1">3위</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-slate-400 font-bold">기록된 점수가 없습니다.</div>
          )}
        </div>

        {/* Most Difficult Vocabulary Review Section (Pedagogical goldmine) */}
        {sortedByDifficulty.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-rose-300">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
              <AlertCircle className="text-rose-500" size={24} />
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                  우리반 집중 복습 어휘 (오답률 높은 단어)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  아이들이 헷갈려했던 핵심 낱말을 다 함께 다시 짚어봐요!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {sortedByDifficulty.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-extrabold text-sky-700">
                        {item.question.item.word}
                      </span>
                      <span className="text-base text-sky-500 font-serif">
                        [{item.question.item.hanja}]
                      </span>
                      <span className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded-md border">
                        {item.question.item.subject}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">
                      {item.question.item.meaning}
                    </p>
                    {item.question.item.example && (
                      <p className="text-xs text-amber-800 mt-1 italic">
                        "{item.question.item.example}"
                      </p>
                    )}
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-600 shrink-0 self-start sm:self-center">
                    우리반 정답률: {item.accuracy}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-sky-300">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy size={22} className="text-amber-500" />
            전체 참가자 순위
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {rankedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  player.id === myPlayerId
                    ? 'bg-sky-50 border-sky-300 font-bold'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-sm text-slate-500">
                    {idx + 1}
                  </span>
                  <span className="text-2xl">{player.avatar}</span>
                  <span className="text-slate-800 font-bold text-sm sm:text-base">
                    {player.name} {player.id === myPlayerId && '(나)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-sky-800 text-lg">
                    {player.score.toLocaleString()}점
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {player.totalCorrect}문제 정답
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {isHost ? (
            <button
              onClick={() => {
                playSound('click');
                onRestart();
              }}
              className="flex-1 py-4.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw size={22} />
              우리반 다시 한 판 하기 (대기실 복귀)
            </button>
          ) : (
            <div className="flex-1 text-center py-3 text-slate-600 font-bold">
              선생님이 새 게임을 시작하면 함께 대기실로 이동합니다!
            </div>
          )}

          <button
            onClick={() => {
              playSound('click');
              onGoHome();
            }}
            className="py-4.5 px-6 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xl border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <Home size={22} />
            처음으로
          </button>
        </div>
      </div>
    </div>
  );
};
