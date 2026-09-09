import React from 'react';
import { Trophy, Flame, ArrowRight, Medal, Crown, Star } from 'lucide-react';
import { Player } from '../types';
import { playSound } from '../utils/audio';

interface LeaderboardScreenProps {
  players: Record<string, Player>;
  isHost: boolean;
  myPlayerId: string;
  currentIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  players,
  isHost,
  myPlayerId,
  currentIndex,
  totalQuestions,
  onNextQuestion,
}) => {
  const isLast = currentIndex + 1 >= totalQuestions;

  // Filter out host from ranking, sort by score descending
  const rankedPlayers = (Object.values(players) as Player[])
    .filter((p) => !p.isHost)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 py-8 px-4 flex flex-col items-center justify-center break-keep">
      <div className="max-w-2xl w-full space-y-6">
        {/* Leaderboard Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-400 text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-400 border-3 border-amber-500 flex items-center justify-center text-amber-950 mb-3 shadow-md">
            <Trophy size={36} />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
            실시간 우리반 순위표
          </h2>
          <p className="text-amber-700 font-bold text-base mt-1">
            {currentIndex + 1}번째 문제 종료 후 현재 점수 현황 🏆
          </p>

          {/* Ranking Table */}
          <div className="mt-6 space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {rankedPlayers.length === 0 ? (
              <div className="py-8 text-slate-400 font-bold">참가자가 없습니다.</div>
            ) : (
              rankedPlayers.map((player, idx) => {
                const rank = idx + 1;
                const isMe = player.id === myPlayerId;

                let rankBadge = (
                  <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-sm font-extrabold flex items-center justify-center">
                    {rank}
                  </span>
                );

                let cardBg = 'bg-white border-slate-200';
                if (rank === 1) {
                  rankBadge = (
                    <span className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-base shadow-xs">
                      🥇
                    </span>
                  );
                  cardBg = 'bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-300';
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="w-9 h-9 rounded-full bg-slate-300 text-slate-800 font-black flex items-center justify-center text-base">
                      🥈
                    </span>
                  );
                  cardBg = 'bg-slate-50 border-slate-300';
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="w-9 h-9 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-base">
                      🥉
                    </span>
                  );
                  cardBg = 'bg-orange-50 border-orange-200';
                }

                if (isMe) {
                  cardBg += ' ring-4 ring-sky-400 border-sky-400';
                }

                return (
                  <div
                    key={player.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between transition-transform ${cardBg} ${
                      isMe ? 'scale-101 shadow-sm' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate mr-2">
                      {rankBadge}
                      <span className="text-2xl sm:text-3xl">{player.avatar}</span>
                      <div className="truncate text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-base sm:text-lg truncate">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                              나
                            </span>
                          )}
                        </div>
                        {player.streak > 1 && (
                          <span className="text-xs text-amber-600 font-bold flex items-center gap-0.5">
                            <Flame size={14} fill="currentColor" /> {player.streak}연속 정답
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-black text-sky-800 font-mono">
                        {player.score.toLocaleString()}
                        <span className="text-xs sm:text-sm font-bold ml-1 text-slate-500">점</span>
                      </div>
                      {player.lastPointsEarned > 0 && (
                        <span className="text-xs text-emerald-600 font-extrabold block">
                          +{player.lastPointsEarned}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Controls */}
        {isHost ? (
          <button
            onClick={() => {
              playSound('click');
              onNextQuestion();
            }}
            className="w-full py-4.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
          >
            <span>{isLast ? '최종 시상대 & 결과 보기 🏆' : '다음 문제 출발하기! 🚀'}</span>
            <ArrowRight size={26} />
          </button>
        ) : (
          <div className="text-center py-2 text-slate-500 font-bold text-base">
            선생님이 다음 문제로 이동하기를 기다리고 있어요... ⏰
          </div>
        )}
      </div>
    </div>
  );
};
