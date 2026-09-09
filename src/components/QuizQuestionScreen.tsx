import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Users, Star, Sparkles, FastForward } from 'lucide-react';
import { QuizQuestion, Player } from '../types';
import { playSound } from '../utils/audio';

interface QuizQuestionScreenProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  timeLimitSec: number;
  isHost: boolean;
  myPlayerId: string;
  players: Record<string, Player>;
  onSubmitAnswer: (option: string) => void;
  onHostSkipRound?: () => void;
}

const OPTION_COLORS = [
  {
    bg: 'bg-sky-500 hover:bg-sky-600 active:bg-sky-700',
    border: 'border-sky-700',
    text: 'text-white',
    badge: 'bg-sky-700 text-sky-100',
    letter: '1',
  },
  {
    bg: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700',
    border: 'border-emerald-700',
    text: 'text-white',
    badge: 'bg-emerald-700 text-emerald-100',
    letter: '2',
  },
  {
    bg: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
    border: 'border-amber-700',
    text: 'text-white',
    badge: 'bg-amber-700 text-amber-100',
    letter: '3',
  },
  {
    bg: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700',
    border: 'border-rose-700',
    text: 'text-white',
    badge: 'bg-rose-700 text-rose-100',
    letter: '4',
  },
];

export const QuizQuestionScreen: React.FC<QuizQuestionScreenProps> = ({
  question,
  currentIndex,
  totalQuestions,
  timeRemaining,
  timeLimitSec,
  isHost,
  myPlayerId,
  players,
  onSubmitAnswer,
  onHostSkipRound,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Play audio tick when time is running out (<= 5 seconds)
  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0) {
      playSound('tick');
    }
  }, [timeRemaining]);

  const myPlayer = players[myPlayerId];
  const hasAnswered = myPlayer?.hasAnsweredCurrent || selectedOption !== null;

  // Calculate participation
  const studentList = (Object.values(players) as Player[]).filter((p) => !p.isHost && p.connected);
  const answeredCount = studentList.filter((p) => p.hasAnsweredCurrent).length;
  const participationPercent = studentList.length > 0 ? Math.round((answeredCount / studentList.length) * 100) : 0;

  const handleChoose = (opt: string) => {
    if (hasAnswered || isHost) return;
    playSound('click');
    setSelectedOption(opt);
    onSubmitAnswer(opt);
  };

  const timerRatio = Math.max(0, Math.min(1, timeRemaining / timeLimitSec));
  const timerColor =
    timeRemaining <= 3
      ? 'bg-rose-500'
      : timeRemaining <= 6
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 py-6 px-4 flex flex-col items-center justify-center break-keep">
      <div className="max-w-3xl w-full space-y-4 sm:space-y-6">
        {/* Top Info Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 text-sm sm:text-base font-extrabold px-3 py-1 rounded-xl border border-sky-300 flex items-center gap-1.5">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              문제 {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="bg-amber-100 text-amber-900 text-xs sm:text-sm font-bold px-2.5 py-1 rounded-xl border border-amber-300">
              {question.item.subject}
            </span>
          </div>

          {/* Time Countdown Badge */}
          <div className="flex items-center gap-2">
            <Clock
              size={22}
              className={`${timeRemaining <= 5 ? 'text-rose-500 animate-spin' : 'text-slate-500'}`}
            />
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                timeRemaining <= 5 ? 'text-rose-600 scale-110 animate-pulse' : 'text-slate-800'
              }`}
            >
              {timeRemaining}초
            </span>
          </div>
        </div>

        {/* Linear Timer Bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 sm:h-4 overflow-hidden border border-slate-300 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerColor}`}
            style={{ width: `${timerRatio * 100}%` }}
          />
        </div>

        {/* Main Question Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-4 border-sky-300 text-center relative overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-700 leading-snug">
            {question.questionTitle}
          </h2>

          <div className="my-5 py-4 px-6 bg-yellow-50 rounded-2xl border-2 border-yellow-300 inline-block shadow-inner max-w-full">
            <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-sky-700 tracking-tight block">
              {question.questionHighlight}
            </span>
          </div>

          {/* Realtime Submission Status */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 bg-slate-50 py-2 px-4 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1.5 font-bold">
              <Users size={16} className="text-sky-600" />
              반 친구들 제출 현황:
              <strong className="text-sky-700 ml-1">
                {answeredCount}명 / {studentList.length}명 ({participationPercent}%)
              </strong>
            </span>
            {isHost && onHostSkipRound && (
              <button
                onClick={onHostSkipRound}
                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FastForward size={14} /> 바로 정답 공개
              </button>
            )}
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {question.options.map((option, idx) => {
            const color = OPTION_COLORS[idx % OPTION_COLORS.length];
            const isChosenByMe = selectedOption === option;

            let extraClasses = '';
            if (isHost) {
              // Host screen is view-only, shows nice big tiles
              extraClasses = `${color.bg} ${color.border} ${color.text} border-b-4 opacity-95`;
            } else if (hasAnswered) {
              if (isChosenByMe) {
                extraClasses = 'bg-amber-400 border-amber-600 text-amber-950 border-b-4 ring-4 ring-amber-300 scale-102';
              } else {
                extraClasses = 'bg-slate-100 border-slate-300 text-slate-400 border-b-2 opacity-50';
              }
            } else {
              extraClasses = `${color.bg} ${color.border} ${color.text} border-b-4 active:border-b-0 active:translate-y-1 cursor-pointer shadow-md hover:scale-101`;
            }

            return (
              <button
                key={idx}
                onClick={() => handleChoose(option)}
                disabled={hasAnswered || isHost}
                className={`min-h-[85px] sm:min-h-[105px] p-4 sm:p-6 rounded-2xl font-extrabold text-lg sm:text-2xl transition-all flex items-center justify-between text-left ${extraClasses}`}
              >
                <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm sm:text-base shrink-0 mr-3">
                  {color.letter}
                </span>
                <span className="flex-1 text-center leading-snug">{option}</span>
                {isChosenByMe && (
                  <CheckCircle2 size={24} className="text-amber-900 shrink-0 ml-2 animate-bounce" />
                )}
              </button>
            );
          })}
        </div>

        {/* Student submission confirmation */}
        {!isHost && hasAnswered && (
          <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-4 text-center text-amber-950 font-bold text-base animate-fade-in shadow-xs flex items-center justify-center gap-2">
            <CheckCircle2 size={20} className="text-amber-700" />
            답안을 제출했습니다! 시간 종료 후 정답과 순위가 공개됩니다 ⏰
          </div>
        )}
      </div>
    </div>
  );
};
