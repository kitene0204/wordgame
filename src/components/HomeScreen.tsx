import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Play, Sparkles, BookOpen, Clock, Settings, HelpCircle, Trophy, Flame } from 'lucide-react';
import { SubjectType } from '../types';
import { playSound } from '../utils/audio';

interface HomeScreenProps {
  onJoinRoom: (roomCode: string, playerName: string, avatar: string) => void;
  onCreateRoom: (hostName: string, avatar: string, subject: SubjectType, numQuestions: number, timeLimitSec: number) => void;
  onStartSolo: (subject: SubjectType, numQuestions: number) => void;
  initialRoomCode?: string;
}

const AVATARS = ['🦁', '🐯', '🐰', '🦊', '🐼', '🐨', '🦄', '🐸', '🐶', '🐱', '🐣', '🚀'];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onJoinRoom,
  onCreateRoom,
  onStartSolo,
  initialRoomCode = '',
}) => {
  const [mainTab, setMainTab] = useState<'CLASS' | 'SOLO'>('CLASS');
  const [classSubTab, setClassSubTab] = useState<'JOIN' | 'CREATE'>(initialRoomCode ? 'JOIN' : 'JOIN');

  // Student Join State
  const [joinCode, setJoinCode] = useState(initialRoomCode);
  const [studentName, setStudentName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');

  // Teacher Create State
  const [teacherName, setTeacherName] = useState('선생님');
  const [teacherAvatar, setTeacherAvatar] = useState('🎓');
  const [roomSubject, setRoomSubject] = useState<SubjectType>('전체');
  const [roomNumQuestions, setRoomNumQuestions] = useState<number>(10);
  const [roomTimeLimit, setRoomTimeLimit] = useState<number>(15);

  // Solo State
  const [soloSujbect, setSoloSubject] = useState<SubjectType>('전체');
  const [soloNumQuestions, setSoloNumQuestions] = useState<number>(10);

  useEffect(() => {
    if (initialRoomCode) {
      setJoinCode(initialRoomCode);
      setMainTab('CLASS');
      setClassSubTab('JOIN');
    }
  }, [initialRoomCode]);

  const handleStudentJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      alert('방 코드를 입력해주세요!');
      return;
    }
    if (!studentName.trim()) {
      alert('이름이나 닉네임을 입력해주세요!');
      return;
    }
    playSound('click');
    onJoinRoom(joinCode.trim(), studentName.trim(), selectedAvatar);
  };

  const handleTeacherCreate = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    onCreateRoom(
      teacherName.trim() || '선생님',
      teacherAvatar,
      roomSubject,
      roomNumQuestions,
      roomTimeLimit
    );
  };

  const handleStartSoloGame = () => {
    playSound('click');
    onStartSolo(soloSujbect, soloNumQuestions);
  };

  return (
    <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 py-8 px-4 flex flex-col items-center justify-center break-keep">
      {/* Title Hero */}
      <div className="text-center mb-6 max-w-xl">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 border-2 border-amber-300 px-4 py-1.5 rounded-full text-sm font-bold mb-3 shadow-xs animate-bounce">
          <Sparkles size={16} className="text-amber-600" />
          우리반 함께 푸는 실시간 초등 어휘 배틀
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-sky-800 tracking-tight mb-2 drop-shadow-xs">
          초등 어휘 대장!
        </h1>
        <p className="text-sky-600 text-lg font-medium">
          6학년 필수 교과 어휘를 친구들과 실시간으로 겨루며 마스터해요 🚀
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full border-4 border-sky-300 overflow-hidden relative">
        {/* Main Tab Switcher */}
        <div className="grid grid-cols-2 bg-sky-100 p-2 gap-2 border-b-4 border-sky-200">
          <button
            onClick={() => {
              playSound('click');
              setMainTab('CLASS');
            }}
            className={`py-3.5 rounded-2xl font-bold text-lg sm:text-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainTab === 'CLASS'
                ? 'bg-amber-400 text-amber-950 border-b-4 border-amber-600 shadow-sm'
                : 'bg-white/70 text-sky-800 hover:bg-white border-b-2 border-sky-200'
            }`}
          >
            <Users size={22} />
            우리반 퀴즈 배틀
          </button>
          <button
            onClick={() => {
              playSound('click');
              setMainTab('SOLO');
            }}
            className={`py-3.5 rounded-2xl font-bold text-lg sm:text-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainTab === 'SOLO'
                ? 'bg-emerald-400 text-emerald-950 border-b-4 border-emerald-600 shadow-sm'
                : 'bg-white/70 text-sky-800 hover:bg-white border-b-2 border-sky-200'
            }`}
          >
            <BookOpen size={22} />
            혼자 연습하기
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {mainTab === 'CLASS' ? (
            <div>
              {/* Class Sub-tabs: Join vs Create */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setClassSubTab('JOIN');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-base transition-all cursor-pointer ${
                    classSubTab === 'JOIN'
                      ? 'bg-white text-sky-700 shadow-xs border-2 border-sky-300'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🙋‍♂️ 학생으로 참가하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setClassSubTab('CREATE');
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-base transition-all cursor-pointer ${
                    classSubTab === 'CREATE'
                      ? 'bg-white text-amber-700 shadow-xs border-2 border-amber-300'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🎓 선생님 방 만들기
                </button>
              </div>

              {classSubTab === 'JOIN' ? (
                /* Student Join Form */
                <form onSubmit={handleStudentJoin} className="space-y-5">
                  {/* Room Code Input */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      방 코드 (숫자 6자리)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="예: 482910"
                      className="w-full text-center text-3xl font-extrabold tracking-widest py-3 px-4 rounded-2xl border-3 border-sky-300 bg-sky-50 focus:bg-white focus:outline-none focus:border-sky-500 text-sky-800 transition-colors"
                      required
                    />
                  </div>

                  {/* Student Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      내 이름 또는 번호
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="예: 3번 김민우 / 지혜"
                      className="w-full text-lg font-bold py-3 px-4 rounded-2xl border-3 border-slate-300 focus:outline-none focus:border-sky-500 text-slate-800 bg-slate-50 focus:bg-white transition-colors"
                      required
                    />
                  </div>

                  {/* Avatar Picker */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      내 캐릭터 고르기
                    </label>
                    <div className="grid grid-cols-6 gap-2 bg-slate-50 p-3 rounded-2xl border-2 border-slate-200">
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setSelectedAvatar(av);
                          }}
                          className={`text-2xl p-2 rounded-xl transition-transform cursor-pointer ${
                            selectedAvatar === av
                              ? 'bg-amber-300 border-2 border-amber-500 scale-110 shadow-xs'
                              : 'hover:bg-slate-200'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-2xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Play size={24} fill="currentColor" />
                    퀴즈 방 입장하기!
                  </button>
                </form>
              ) : (
                /* Teacher Create Form */
                <form onSubmit={handleTeacherCreate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      선생님 닉네임
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="예: 6학년 2반 담임선생님"
                      className="w-full text-lg font-bold py-2.5 px-4 rounded-2xl border-3 border-slate-300 focus:outline-none focus:border-amber-500 text-slate-800 bg-slate-50"
                    />
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      출제 과목 선택
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['전체', '국어', '수학', '사회'] as SubjectType[]).map((subj) => (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setRoomSubject(subj);
                          }}
                          className={`py-2.5 rounded-xl font-bold text-base transition-all border-b-3 cursor-pointer ${
                            roomSubject === subj
                              ? 'bg-amber-400 text-amber-950 border-amber-600 translate-y-0.5 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {subj}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      문제 수 선택
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setRoomNumQuestions(num);
                          }}
                          className={`py-2.5 rounded-xl font-bold text-base transition-all border-b-3 cursor-pointer ${
                            roomNumQuestions === num
                              ? 'bg-sky-400 text-white border-sky-600 translate-y-0.5 shadow-xs'
                              : 'bg-white text-sky-700 border-slate-200 hover:bg-sky-50'
                          }`}
                        >
                          {num}문제
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time limit per question */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      문제당 제한 시간
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 15, 20].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            playSound('click');
                            setRoomTimeLimit(sec);
                          }}
                          className={`py-2 rounded-xl font-bold text-sm transition-all border-b-3 cursor-pointer ${
                            roomTimeLimit === sec
                              ? 'bg-rose-400 text-white border-rose-600 translate-y-0.5'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          {sec}초 (추천)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Create Room Button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-2xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <UserPlus size={24} />
                    우리반 퀴즈 방 생성하기!
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Solo Mode Settings */
            <div className="space-y-6">
              <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-lg mb-1">
                  <BookOpen size={20} className="text-emerald-600" />
                  스스로 공부하는 개인 연습 모드
                </div>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  시간제한 없이 꼼꼼하게 풀고, 틀린 문제는 바로 해설과 한자를 확인하며 복습할 수 있어요!
                </p>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  공부할 과목 선택
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['전체', '국어', '수학', '사회'] as SubjectType[]).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSoloSubject(subj);
                      }}
                      className={`py-3 rounded-2xl font-bold text-lg transition-all border-b-3 cursor-pointer ${
                        soloSujbect === subj
                          ? 'bg-emerald-400 text-emerald-950 border-emerald-600 translate-y-0.5 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of questions */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  문제 개수 선택
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSoloNumQuestions(num);
                      }}
                      className={`py-3 rounded-2xl font-bold text-lg transition-all border-b-3 cursor-pointer ${
                        soloNumQuestions === num
                          ? 'bg-sky-400 text-white border-sky-600 translate-y-0.5 shadow-xs'
                          : 'bg-white text-sky-700 border-slate-200 hover:bg-sky-50'
                      }`}
                    >
                      {num}개
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartSoloGame}
                className="w-full py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-500 text-emerald-950 font-extrabold text-2xl border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Play size={24} fill="currentColor" />
                혼자 연습 출발하기!
              </button>
            </div>
          )}
        </div>

        {/* Helpful Info Note for Teacher */}
        <div className="bg-sky-50/80 px-6 py-4 border-t-2 border-sky-100 flex items-start gap-2.5 text-xs text-sky-800">
          <HelpCircle size={18} className="text-sky-600 shrink-0 mt-0.5" />
          <p className="leading-normal">
            <strong>슈파베이스(Supabase) 설치가 필요한가요?</strong><br />
            아닙니다! 본 앱은 <strong>내장된 실시간 웹소켓 서버</strong>로 동작하므로 별도의 외부 데이터베이스나 유료 가입 없이도, 링크나 6자리 코드만으로 반 아이들 30명 이상이 동시에 즉시 접속해 실시간 퀴즈와 순위표를 즐길 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
