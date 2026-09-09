/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { HostLobby } from './components/HostLobby';
import { StudentLobby } from './components/StudentLobby';
import { QuizQuestionScreen } from './components/QuizQuestionScreen';
import { RoundResultScreen } from './components/RoundResultScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { SoloQuizScreen } from './components/SoloQuizScreen';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { RoomState, SubjectType, SemesterType, SheetSyncStatus } from './types';
import {
  getSocket,
  createRoom,
  joinRoom,
  updateRoomSettings,
  startGame,
  submitAnswer,
  showLeaderboard,
  nextQuestion,
  restartGame,
} from './services/socketService';
import {
  fetchSheetStatus,
  syncMultipleGoogleSheets,
  syncSingleSubjectSheet,
  resetGoogleSheet,
  refreshGoogleSheets,
} from './services/sheetService';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(15);
  const [soloConfig, setSoloConfig] = useState<{ subject: SubjectType; numQuestions: number; semester?: SemesterType } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google Sheet Integration State
  const [sheetStatus, setSheetStatus] = useState<SheetSyncStatus | null>(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncToast, setSyncToast] = useState<{
    type: 'syncing' | 'success' | 'error';
    message: string;
  } | null>(null);

  // Quick refresh logic with status feedback
  const handleQuickRefresh = async (silent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);

    if (!silent) {
      setSyncToast({
        type: 'syncing',
        message: '구글 시트 최신 어휘 동기화 중...',
      });
    }

    try {
      const data = await refreshGoogleSheets();
      setSheetStatus(data.sheetStatus);

      if (!silent || (data.updated && data.updated > 0)) {
        setSyncToast({
          type: 'success',
          message: `동기화 완료! 총 ${data.sheetStatus.wordCount}개 최신 어휘가 반영되었습니다.`,
        });
        setTimeout(() => {
          setSyncToast((prev) => (prev?.type === 'success' ? null : prev));
        }, 3000);
      } else {
        setSyncToast(null);
      }
    } catch (err: any) {
      console.error('Quick refresh failed:', err);
      if (!silent) {
        setSyncToast({
          type: 'error',
          message: `동기화 실패: ${err.message || '네트워크 오류'}`,
        });
        setTimeout(() => {
          setSyncToast((prev) => (prev?.type === 'error' ? null : prev));
        }, 4000);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Periodic Auto-Sync (every 3 minutes when custom sheet is active)
  useEffect(() => {
    if (!autoSyncEnabled || !sheetStatus?.isCustomSheet) return;

    const intervalId = setInterval(() => {
      console.log('⏰ [수시 자동 동기화] 구글 시트 최신 어휘 갱신 점검');
      handleQuickRefresh(true);
    }, 180000); // 3 minutes

    return () => clearInterval(intervalId);
  }, [autoSyncEnabled, sheetStatus?.isCustomSheet]);

  // Auto-sync when user returns to this tab (window focus)
  useEffect(() => {
    const handleWindowFocus = () => {
      if (sheetStatus?.isCustomSheet && autoSyncEnabled) {
        const lastSync = sheetStatus.lastSyncedAt ? new Date(sheetStatus.lastSyncedAt).getTime() : 0;
        const now = Date.now();
        // If more than 30 seconds since last sync, auto-refresh
        if (now - lastSync > 30000) {
          console.log('👀 [화면 복귀 자동 동기화] 탭 활성화 감지 -> 시트 최신화 확인');
          handleQuickRefresh(false);
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [sheetStatus?.isCustomSheet, sheetStatus?.lastSyncedAt, autoSyncEnabled]);

  // Parse URL query parameter (e.g. ?room=482910)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        setInitialRoomCode(room);
      }
    }
  }, []);

  // Fetch initial sheet status from server
  useEffect(() => {
    fetchSheetStatus()
      .then((status) => setSheetStatus(status))
      .catch((err) => console.log('Sheet status check:', err));
  }, []);

  // Setup Socket Listeners
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setMyPlayerId(socket.id || '');
    });

    socket.on('sheet_synced', (status: SheetSyncStatus) => {
      setSheetStatus(status);
    });

    socket.on('room_created', (data: { roomCode: string; playerId: string }) => {
      setMyPlayerId(data.playerId);
      setErrorMessage(null);
    });

    socket.on('room_joined', (data: { roomCode: string; playerId: string }) => {
      setMyPlayerId(data.playerId);
      setErrorMessage(null);
    });

    socket.on('room_state', (state: RoomState) => {
      setRoomState(state);
      setTimeRemaining(state.questionTimeRemaining);
    });

    socket.on('timer_tick', (data: { timeRemaining: number }) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on('error_message', (data: { message: string }) => {
      setErrorMessage(data.message);
      alert(data.message);
    });

    return () => {
      socket.off('connect');
      socket.off('sheet_synced');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('room_state');
      socket.off('timer_tick');
      socket.off('error_message');
    };
  }, []);

  // Handlers
  const handleJoinRoom = (roomCode: string, playerName: string, avatar: string) => {
    joinRoom(roomCode, playerName, avatar);
  };

  const handleCreateRoom = (
    hostName: string,
    avatar: string,
    subject: SubjectType,
    numQuestions: number,
    timeLimitSec: number,
    semester: SemesterType
  ) => {
    createRoom(hostName, avatar, subject, numQuestions, timeLimitSec, semester);
  };

  const handleStartSolo = (subject: SubjectType, numQuestions: number, semester: SemesterType) => {
    setSoloConfig({ subject, numQuestions, semester });
  };

  const handleGoHome = () => {
    setRoomState(null);
    setSoloConfig(null);
    setErrorMessage(null);
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // Google Sheet handlers
  const handleSyncMultipleSheets = async (sheetUrls: Record<string, string>) => {
    setIsSheetLoading(true);
    try {
      const res = await syncMultipleGoogleSheets(sheetUrls);
      setSheetStatus(res.sheetStatus);
      return { errors: res.errors };
    } finally {
      setIsSheetLoading(false);
    }
  };

  const handleSyncSingleSubject = async (subject: string, url: string) => {
    setIsSheetLoading(true);
    try {
      const updatedStatus = await syncSingleSubjectSheet(subject, url);
      setSheetStatus(updatedStatus);
    } finally {
      setIsSheetLoading(false);
    }
  };

  const handleResetSheet = async (subject?: string) => {
    setIsSheetLoading(true);
    try {
      const updatedStatus = await resetGoogleSheet(subject);
      setSheetStatus(updatedStatus);
    } finally {
      setIsSheetLoading(false);
    }
  };

  const isHost = roomState ? roomState.hostId === myPlayerId : false;
  const inMultiplayer = roomState !== null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-jua select-none">
      {/* Top Floating Sync Notification Toast */}
      {syncToast && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 transition-all pointer-events-auto max-w-md w-[90%] sm:w-auto animate-bounce-subtle">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl border-2 flex items-center gap-2.5 text-sm font-black ${
              syncToast.type === 'syncing'
                ? 'bg-amber-100 border-amber-400 text-amber-950'
                : syncToast.type === 'success'
                ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
                : 'bg-rose-100 border-rose-400 text-rose-950'
            }`}
          >
            {syncToast.type === 'syncing' && (
              <RefreshCw size={18} className="animate-spin text-amber-600 shrink-0" />
            )}
            {syncToast.type === 'success' && (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            )}
            {syncToast.type === 'error' && (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{syncToast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        roomCode={roomState?.roomCode}
        isHost={isHost}
        playerCount={roomState ? Object.keys(roomState.players).length : undefined}
        onGoHome={inMultiplayer || soloConfig ? handleGoHome : undefined}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        sheetStatus={sheetStatus}
        isSyncing={isSyncing}
        onQuickRefresh={() => handleQuickRefresh(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* 1. Solo Mode */}
        {soloConfig && !inMultiplayer && (
          <SoloQuizScreen
            subject={soloConfig.subject}
            semester={soloConfig.semester}
            numQuestions={soloConfig.numQuestions}
            onGoHome={handleGoHome}
          />
        )}

        {/* 2. Multiplayer Views */}
        {inMultiplayer && (
          <>
            {/* LOBBY */}
            {roomState.status === 'LOBBY' &&
              (isHost ? (
                <HostLobby
                  roomCode={roomState.roomCode}
                  players={roomState.players}
                  subject={roomState.subject}
                  semester={roomState.semester || '전체'}
                  numQuestions={roomState.numQuestions}
                  timeLimitSec={roomState.timeLimitSec}
                  onUpdateSettings={updateRoomSettings}
                  onStartGame={startGame}
                  onOpenSheetModal={() => setIsSheetModalOpen(true)}
                  sheetStatus={sheetStatus}
                  isSyncing={isSyncing}
                  onQuickRefresh={() => handleQuickRefresh(false)}
                />
              ) : (
                <StudentLobby
                  roomCode={roomState.roomCode}
                  myPlayerId={myPlayerId}
                  players={roomState.players}
                  subject={roomState.subject}
                  semester={roomState.semester || '전체'}
                  numQuestions={roomState.numQuestions}
                />
              ))}

            {/* STARTING COUNTDOWN */}
            {roomState.status === 'STARTING' && (
              <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-sky-200 via-amber-100 to-sky-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-2xl border-4 border-amber-400 max-w-md w-full animate-pulse">
                  <span className="text-6xl mb-4 block animate-bounce">🚀</span>
                  <h2 className="text-3xl sm:text-4xl font-black text-sky-800 mb-3">
                    어휘 퀴즈 배틀 준비!
                  </h2>
                  <p className="text-amber-700 font-bold text-lg">
                    잠시 후 1번 문제가 시작됩니다...
                  </p>
                </div>
              </div>
            )}

            {/* QUESTION */}
            {roomState.status === 'QUESTION' && roomState.currentQuestion && (
              <QuizQuestionScreen
                question={roomState.currentQuestion}
                currentIndex={roomState.currentIndex}
                totalQuestions={roomState.numQuestions}
                timeRemaining={timeRemaining}
                timeLimitSec={roomState.timeLimitSec}
                isHost={isHost}
                myPlayerId={myPlayerId}
                players={roomState.players}
                onSubmitAnswer={submitAnswer}
                onHostSkipRound={() => {
                  submitAnswer('');
                }}
              />
            )}

            {/* ROUND RESULT */}
            {roomState.status === 'ROUND_RESULT' && roomState.currentQuestion && (
              <RoundResultScreen
                question={roomState.currentQuestion}
                currentIndex={roomState.currentIndex}
                totalQuestions={roomState.numQuestions}
                isHost={isHost}
                myPlayerId={myPlayerId}
                players={roomState.players}
                answers={roomState.answers}
                roundOptionCounts={roomState.roundOptionCounts}
                onShowLeaderboard={showLeaderboard}
                onNextQuestion={nextQuestion}
              />
            )}

            {/* LEADERBOARD */}
            {roomState.status === 'LEADERBOARD' && (
              <LeaderboardScreen
                players={roomState.players}
                isHost={isHost}
                myPlayerId={myPlayerId}
                currentIndex={roomState.currentIndex}
                totalQuestions={roomState.numQuestions}
                onNextQuestion={nextQuestion}
              />
            )}

            {/* GAME OVER */}
            {roomState.status === 'GAME_OVER' && (
              <GameOverScreen
                players={roomState.players}
                history={roomState.history}
                isHost={isHost}
                myPlayerId={myPlayerId}
                onRestart={restartGame}
                onGoHome={handleGoHome}
              />
            )}
          </>
        )}

        {/* 3. Default Home View */}
        {!inMultiplayer && !soloConfig && (
          <HomeScreen
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
            onStartSolo={handleStartSolo}
            initialRoomCode={initialRoomCode}
            onOpenSheetModal={() => setIsSheetModalOpen(true)}
            sheetStatus={sheetStatus}
          />
        )}
      </main>

      {/* Google Sheet Modal */}
      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        sheetStatus={sheetStatus}
        onSyncMultiple={handleSyncMultipleSheets}
        onSyncSingle={handleSyncSingleSubject}
        onReset={handleResetSheet}
        isLoading={isSheetLoading}
        isSyncing={isSyncing}
        onQuickRefresh={() => handleQuickRefresh(false)}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={() => setAutoSyncEnabled((prev) => !prev)}
      />
    </div>
  );
}

