import React, { useState } from 'react';
import { Home, Star, CheckCircle2, XCircle, RotateCcw, ArrowRight, Trophy, BookOpen, Smile } from 'lucide-react';
import { QuizQuestion, SubjectType, SemesterType } from '../types';
import { generateQuizQuestions } from '../utils/quizGenerator';
import { playSound } from '../utils/audio';

interface SoloQuizScreenProps {
  subject: SubjectType;
  semester?: SemesterType;
  numQuestions: number;
  onGoHome: () => void;
}

interface UserAnswerRecord {
  question: QuizQuestion;
  selected: string;
  isCorrect: boolean;
}

export const SoloQuizScreen: React.FC<SoloQuizScreenProps> = ({
  subject,
  semester = '전체' as SemesterType,
  numQuestions,
  onGoHome,
}) => {
  const currentSemester: SemesterType = semester;
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    generateQuizQuestions(subject, numQuestions, undefined, currentSemester)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isRevealed || !currentQ) return;

    const isCorrect = option === currentQ.correctOption;
    playSound(isCorrect ? 'correct' : 'wrong');

    setSelectedOption(option);
    setIsRevealed(true);

    if (isCorrect) setScore((prev) => prev + 1);

    setUserAnswers((prev) => [
      ...prev,
      {
        question: currentQ,
        selected: option,
        isCorrect,
      },
    ]);
  };

  const handleNext = () => {
    playSound('click');
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsRevealed(false);
    } else {
      setIsFinished(true);
      playSound('victory');
    }
  };

  const handleRestart = () => {
    playSound('click');
    const newQuestions = generateQuizQuestions(subject, numQuestions, undefined, currentSemester);
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsRevealed(false);
    setUserAnswers([]);
    setIsFinished(false);
  };

  // Result View
  if (isFinished) {
    const wrongAnswers = userAnswers.filter((ans) => !ans.isCorrect);
    const scorePercentage = Math.round((score / questions.length) * 100);

    let resultMessage = '조금 더 연습해볼까요? 할 수 있어요!';
    if (scorePercentage === 100) {
      resultMessage = '우와! 백점 만점이에요! 어휘 대장 등극! 🌟';
    } else if (scorePercentage >= 80) {
      resultMessage = '참 잘했어요! 어휘 실력이 쑥쑥 늘고 있어요! 👏';
    } else if (scorePercentage >= 60) {
      resultMessage = '좋아요! 조금만 더 하면 완벽할 거예요! 👍';
    }

    return (
      <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-pink-100 via-sky-50 to-amber-50 py-10 px-4 flex flex-col items-center justify-center break-keep">
        <div className="max-w-2xl w-full space-y-6">
          {/* Result Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center border-4 border-pink-400 relative overflow-hidden">
            <h2 className="text-pink-600 text-2xl font-bold mb-2">
              ✨ {subject === '전체' ? '종합' : subject} ({semester === '전체' ? '1·2학기 통합' : semester}) 어휘 연습 결과 ✨
            </h2>

            <div className="text-6xl sm:text-7xl font-black text-pink-600 my-4 drop-shadow-xs font-mono">
              {score} <span className="text-3xl sm:text-4xl text-pink-300">/ {questions.length}</span>
            </div>

            <p className="text-2xl sm:text-3xl text-slate-800 font-bold mb-6">{resultMessage}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRestart}
                className="py-3.5 px-6 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-lg border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                다시 풀어보기
              </button>
              <button
                onClick={onGoHome}
                className="py-3.5 px-6 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-lg border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <Home size={20} />
                홈으로 가기
              </button>
            </div>
          </div>

          {/* Wrong Questions Review */}
          {wrongAnswers.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-4 border-yellow-400 space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="text-rose-500" size={26} />
                틀린 문제 다시 확인하기 ({wrongAnswers.length}문제)
              </h3>

              <div className="space-y-3">
                {wrongAnswers.map((ans, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-yellow-50 border-2 border-yellow-200 flex flex-col sm:flex-row gap-4 justify-between sm:items-center shadow-xs"
                  >
                    <div>
                      <div className="text-xl font-black text-sky-700 mb-1 flex items-center gap-2">
                        {ans.question.item.word}
                        <span className="text-base text-sky-400 font-serif">
                          [{ans.question.item.hanja}]
                        </span>
                        <span className="text-xs bg-white px-2 py-0.5 rounded-md text-slate-500 border border-slate-200 ml-2">
                          {ans.question.item.subject}
                        </span>
                      </div>
                      <div className="text-slate-700 text-base font-medium">
                        뜻: {ans.question.item.meaning}
                      </div>
                      {ans.question.item.example && (
                        <div className="text-xs text-amber-800 italic mt-1">
                          "{ans.question.item.example}"
                        </div>
                      )}
                    </div>
                    <div className="bg-rose-100 text-rose-700 text-sm px-3 py-1.5 rounded-xl border border-rose-300 shrink-0 self-start sm:self-center font-bold">
                      내가 고른 답: <span className="line-through">{ans.selected}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Question View
  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-emerald-100 via-sky-50 to-amber-50 py-6 px-4 flex flex-col items-center justify-center break-keep">
      <div className="max-w-2xl w-full space-y-5">
        {/* Progress Bar & Header */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
            <Star className="text-yellow-400" fill="currentColor" size={18} />
            문제 {currentIndex + 1} / {questions.length}
            <span className="ml-2 text-xs bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 text-emerald-800">
              {currentQ.item.subject}{currentQ.item.semester ? ` · ${currentQ.item.semester}` : ''}
            </span>
          </span>
          <span className="text-emerald-700 font-bold text-sm">
            현재 점수: {score}점
          </span>
        </div>

        {/* Linear Progress */}
        <div className="w-full bg-emerald-100 rounded-full h-3 border border-emerald-300 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Main Question Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border-4 border-emerald-300 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-700 leading-relaxed mb-4">
            {currentQ.questionTitle}
          </h2>

          <div className="py-4 px-6 bg-yellow-50 rounded-2xl border-2 border-yellow-200 inline-block shadow-inner">
            <span className="text-3xl sm:text-4xl font-extrabold text-sky-700">
              {currentQ.questionHighlight}
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {currentQ.options.map((option, idx) => {
            let btnClass =
              'border-b-4 border-slate-300 text-slate-800 bg-white hover:bg-emerald-50 hover:border-emerald-300 active:border-b-0 active:translate-y-1 border-2';

            if (isRevealed) {
              if (option === currentQ.correctOption) {
                btnClass =
                  'border-b-4 border-2 border-emerald-600 bg-emerald-100 text-emerald-800 z-10 shadow-md scale-102';
              } else if (option === selectedOption) {
                btnClass = 'border-2 border-rose-400 bg-rose-50 text-rose-600 opacity-80';
              } else {
                btnClass = 'border-2 border-slate-200 bg-slate-50 text-slate-400 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={isRevealed}
                className={`p-5 min-h-[90px] rounded-2xl text-left sm:text-center text-lg sm:text-xl font-bold transition-all duration-200 cursor-pointer ${btnClass} flex items-center justify-between sm:justify-center`}
              >
                <span className="flex-1 text-center break-keep leading-snug">{option}</span>
                {isRevealed && option === currentQ.correctOption && (
                  <CheckCircle2 className="text-emerald-600 shrink-0 ml-2" size={24} />
                )}
                {isRevealed && option === selectedOption && option !== currentQ.correctOption && (
                  <XCircle className="text-rose-500 shrink-0 ml-2" size={24} />
                )}
              </button>
            );
          })}
        </div>

        {/* Next Question Button (Revealed) */}
        {isRevealed && (
          <div className="flex justify-end animate-fade-in pt-2">
            <button
              onClick={handleNext}
              className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl text-xl font-extrabold flex items-center gap-2 transition-transform active:scale-95 border-b-4 border-sky-700 active:border-b-0 shadow-md cursor-pointer"
            >
              <span>{currentIndex + 1 === questions.length ? '결과 확인하기! 🏆' : '다음 문제로 🚀'}</span>
              <ArrowRight size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
