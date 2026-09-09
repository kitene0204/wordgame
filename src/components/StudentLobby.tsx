import React from 'react';
import { Users, Sparkles, CheckCircle2, Clock, Lightbulb } from 'lucide-react';
import { Player, SubjectType, SemesterType } from '../types';

interface StudentLobbyProps {
  roomCode: string;
  myPlayerId: string;
  players: Record<string, Player>;
  subject: SubjectType;
  semester?: SemesterType;
  numQuestions: number;
}

export const StudentLobby: React.FC<StudentLobbyProps> = ({
  roomCode,
  myPlayerId,
  players,
  subject,
  semester = '전체',
  numQuestions,
}) => {
  const myPlayer = players[myPlayerId];
  const playerList = Object.values(players) as Player[];
  const otherStudents = playerList.filter((p) => !p.isHost && p.connected && p.id !== myPlayerId);

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 py-8 px-4 flex flex-col items-center justify-center break-keep">
      <div className="max-w-md w-full space-y-6">
        {/* My Player Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-sky-400 text-center relative overflow-hidden">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-100 border-4 border-amber-300 flex items-center justify-center text-5xl mb-4 shadow-sm animate-bounce">
            {myPlayer?.avatar || '🦁'}
          </div>

          <span className="inline-block bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1 rounded-full border border-sky-300 mb-2">
            방 코드: {roomCode}
          </span>

          <h2 className="text-3xl font-extrabold text-slate-800 mb-1">
            {myPlayer?.name || '참가자'}
          </h2>

          <div className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mt-2">
            <CheckCircle2 size={18} />
            입장 완료! 준비 되었습니다
          </div>

          <div className="mt-6 pt-6 border-t-2 border-slate-100">
            <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-lg animate-pulse">
              <Clock size={20} />
              선생님이 퀴즈를 시작하길 기다리고 있어요...
            </div>
            <p className="text-xs text-slate-400 mt-2">
              과목: <strong className="text-slate-600">{subject}</strong> • 학기: <strong className="text-slate-600">{semester === '전체' ? '1·2학기 통합' : semester}</strong> • 총 <strong className="text-slate-600">{numQuestions}문제</strong>
            </p>
          </div>
        </div>

        {/* Other Classmates Waiting */}
        <div className="bg-white rounded-3xl p-6 shadow-md border-3 border-amber-200">
          <div className="flex items-center justify-between mb-3 text-slate-700">
            <span className="font-bold text-sm flex items-center gap-1.5">
              <Users size={16} className="text-amber-500" />
              함께 접속한 반 친구들 ({otherStudents.length + 1}명)
            </span>
            <span className="text-xs text-slate-400">실시간 동기화 중</span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-sm font-bold shadow-xs">
              {myPlayer?.avatar} {myPlayer?.name} (나)
            </span>
            {otherStudents.map((student) => (
              <span
                key={student.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-sm font-medium"
              >
                {student.avatar} {student.name}
              </span>
            ))}
          </div>
        </div>

        {/* Tip Box */}
        <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-200 flex items-start gap-3 text-amber-900 text-sm">
          <Lightbulb size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>점수 꿀팁:</strong> 정답을 빨리 맞힐수록 더 높은 <strong className="text-amber-700">속도 보너스 점수</strong>를 받아요! 연속으로 맞히면 <strong className="text-amber-700">연속 정답(Streak) 보너스</strong>도 추가됩니다!
          </p>
        </div>
      </div>
    </div>
  );
};
