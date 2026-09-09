import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Trophy, ArrowRight, Flame, BarChart3, BookOpen, Star } from 'lucide-react';
import { QuizQuestion, Player, PlayerAnswerRecord } from '../types';
import { playSound } from '../utils/audio';

interface RoundResultScreenProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  isHost: boolean;
  myPlayerId: string;
  players: Record<string, Player>;
  answers: Record<string, PlayerAnswerRecord>;
  roundOptionCounts: Record<string, number>;
  onShowLeaderboard: () => void;
  onNextQuestion: () => void;
}

export const RoundResultScreen: React.FC<RoundResultScreenProps> = ({
  question,
  currentIndex,
  totalQuestions,
  isHost,
  myPlayerId,
  players,
  answers,
  roundOptionCounts,
  onShowLeaderboard,
  onNextQuestion,
}) => {
  const myPlayer = players[myPlayerId];
  const myAnswer = answers[myPlayerId];
  const isCorrect = myAnswer?.isCorrect ?? false;
  const isLastQuestion = currentIndex + 1 >= totalQuestions;

  // Sound effect upon mounting
  useEffect(() => {
    if (!isHost) {
      playSound(isCorrect ? 'correct' : 'wrong');
    }
  }, [isHost, isCorrect]);

  const totalAnswered = (Object.values(roundOptionCounts) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 py-6 px-4 flex flex-col items-center justify-center break-keep">
      <div className="max-w-2xl w-full space-y-5">
        {/* Student Feedback Banner (if not host) */}
        {!isHost && (
          <div
            className={`p-6 rounded-3xl shadow-lg border-4 text-center animate-scale-in ${
              isCorrect
                ? 'bg-emerald-500 border-emerald-600 text-white'
                : 'bg-rose-500 border-rose-600 text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 size={36} className="text-emerald-100" />
                  <span className="text-3xl font-black">정답입니다! 딩동댕! 🎉</span>
                </>
              ) : (
                <>
                  <XCircle size={36} className="text-rose-100" />
                  <span className="text-3xl font-black">아쉬워요! 다음 기회에! 💪</span>
                </>
              )}
            </div>

            {isCorrect && myAnswer && (
              <div className="flex items-center justify-center gap-4 text-emerald-100 font-bold text-lg mt-3">
                <span className="bg-emerald-600/60 px-3 py-1 rounded-xl">
                  +{myAnswer.points}점 획득! 🌟
                </span>
                {myPlayer?.streak > 1 && (
                  <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-xl flex items-center gap-1">
                    <Flame size={18} fill="currentColor" />
                    {myPlayer.streak}문제 연속 정답!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Detailed Vocab Answer Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-300">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100">
            <span className="text-sm font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-xl">
              정답 및 상세 풀이
            </span>
            <span className="text-xs text-slate-500">
              문제 {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          <div className="text-center py-2">
            <span className="text-xs text-slate-400 font-bold block mb-1">정답 낱말</span>
            <div className="text-4xl sm:text-5xl font-extrabold text-sky-700 mb-2">
              {question.item.word}
              {question.item.hanja && question.item.hanja !== '-' && (
                <span className="text-2xl sm:text-3xl text-sky-500 ml-2 font-serif">
                  {question.item.hanja.startsWith('[')
                    ? question.item.hanja
                    : `[${question.item.hanja}]`}
                </span>
              )}
            </div>
            <div className="inline-block bg-sky-50 text-sky-900 text-lg sm:text-xl font-bold px-5 py-2 rounded-2xl border-2 border-sky-200 mt-2 mb-4">
              뜻: {question.item.meaning}
            </div>

            {question.item.example && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left text-sm sm:text-base text-amber-950 flex items-start gap-2.5">
                <BookOpen size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-800 block text-xs mb-0.5">교과서 예문</span>
                  "{question.item.example}"
                </div>
              </div>
            )}
          </div>

          {/* Class Answer Distribution Chart */}
          <div className="mt-6 pt-5 border-t-2 border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
              <BarChart3 size={18} className="text-sky-600" />
              우리반 학생 응답 현황 ({totalAnswered}명 응답)
            </div>

            <div className="space-y-2">
              {question.options.map((opt, idx) => {
                const count = Number(roundOptionCounts[opt] || 0);
                const percent = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
                const isThisCorrect = opt === question.correctOption;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      isThisCorrect
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-extrabold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 truncate mr-2">
                      <span
                        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                          isThisCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{opt}</span>
                      {isThisCorrect && (
                        <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                          정답 ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      <span className="w-16 text-right font-mono font-bold">
                        {count}명 ({percent}%)
                      </span>
                      <div className="w-20 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isThisCorrect ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls for Host */}
        {isHost ? (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                playSound('click');
                onShowLeaderboard();
              }}
              className="flex-1 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Trophy size={22} />
              실시간 순위 확인하기
            </button>
            <button
              onClick={() => {
                playSound('click');
                onNextQuestion();
              }}
              className="flex-1 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xl border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>{isLastQuestion ? '최종 결과 보기' : '다음 문제로'}</span>
              <ArrowRight size={22} />
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-bold text-sm">
            선생님이 다음 단계로 진행하기를 기다리고 있어요... ⏰
          </div>
        )}
      </div>
    </div>
  );
};
