import express from 'express';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { generateQuizQuestions } from './src/utils/quizGenerator';
import { VOCAB_DATA, VocabItem } from './src/data/vocabData';
import { fetchGoogleSheetVocab } from './src/utils/googleSheetSync';
import { Player, PlayerAnswerRecord, QuestionHistoryItem, QuizQuestion, RoomState, RoomStatus, SemesterType, SheetSyncStatus, SubjectType } from './src/types';

interface ServerRoom {
  roomCode: string;
  hostId: string;
  status: RoomStatus;
  subject: SubjectType;
  semester: SemesterType;
  numQuestions: number;
  timeLimitSec: number;
  questions: QuizQuestion[];
  currentIndex: number;
  currentQuestion: QuizQuestion | null;
  questionStartTime: number | null;
  questionTimeRemaining: number;
  timerInterval: NodeJS.Timeout | null;
  players: Map<string, Player>;
  answers: Map<string, PlayerAnswerRecord>;
  roundOptionCounts: Record<string, number>;
  history: QuestionHistoryItem[];
}

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Vocabulary and Google Sheet State
function getSubjectCounts(vocabList: VocabItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  vocabList.forEach((item) => {
    counts[item.subject] = (counts[item.subject] || 0) + 1;
  });
  return counts;
}

function getSubjectSemesterCounts(vocabList: VocabItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  vocabList.forEach((item) => {
    const sem = item.semester === '2학기' ? '2학기' : '1학기';
    const key = `${item.subject}_${sem}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

// Stores custom sheets by subject_semester key (e.g. '국어_1학기', '국어_2학기', or '국어')
const customVocabsByKey: Record<string, VocabItem[]> = {
  '국어_1학기': [],
  '국어_2학기': [],
  '수학_1학기': [],
  '수학_2학기': [],
  '사회_1학기': [],
  '사회_2학기': [],
  '영어_1학기': [],
  '영어_2학기': [],
};

const sheetUrlsByKey: Record<string, string> = {
  '국어_1학기': '',
  '국어_2학기': '',
  '수학_1학기': '',
  '수학_2학기': '',
  '사회_1학기': '',
  '사회_2학기': '',
  '영어_1학기': '',
  '영어_2학기': '',
};

function rebuildActiveVocabList(): VocabItem[] {
  const result: VocabItem[] = [];
  const standardSubjects = ['국어', '수학', '사회', '영어'];

  for (const subj of standardSubjects) {
    const sem1Key = `${subj}_1학기`;
    const sem2Key = `${subj}_2학기`;
    const generalKey = subj;

    const custom1 = customVocabsByKey[sem1Key];
    const custom2 = customVocabsByKey[sem2Key];
    const customGen = customVocabsByKey[generalKey];

    // 1학기
    if (custom1 && custom1.length > 0) {
      result.push(...custom1);
    } else if (customGen && customGen.filter((v) => v.semester === '1학기').length > 0) {
      result.push(...customGen.filter((v) => v.semester === '1학기'));
    } else {
      result.push(...VOCAB_DATA.filter((v) => v.subject === subj && v.semester === '1학기'));
    }

    // 2학기
    if (custom2 && custom2.length > 0) {
      result.push(...custom2);
    } else if (customGen && customGen.filter((v) => v.semester === '2학기').length > 0) {
      result.push(...customGen.filter((v) => v.semester === '2학기'));
    } else {
      result.push(...VOCAB_DATA.filter((v) => v.subject === subj && v.semester === '2학기'));
    }
  }

  // Include any extra subject entries
  for (const [key, items] of Object.entries(customVocabsByKey)) {
    const isStandard = standardSubjects.some(
      (s) => key === s || key === `${s}_1학기` || key === `${s}_2학기`
    );
    if (!isStandard && items && items.length > 0) {
      result.push(...items);
    }
  }

  return result;
}

let activeVocabList: VocabItem[] = [...VOCAB_DATA];

function updateSheetStatus(): SheetSyncStatus {
  activeVocabList = rebuildActiveVocabList();
  const counts = getSubjectCounts(activeVocabList);
  const semCounts = getSubjectSemesterCounts(activeVocabList);
  const isCustom = Object.values(customVocabsByKey).some((items) => items && items.length > 0);
  const available = ['전체', ...Object.keys(counts)];

  sheetStatus = {
    isCustomSheet: isCustom,
    sheetUrl: Object.values(sheetUrlsByKey).find((u) => Boolean(u)) || '',
    sheetUrls: { ...sheetUrlsByKey },
    lastSyncedAt: isCustom ? new Date().toISOString() : null,
    wordCount: activeVocabList.length,
    subjectCounts: counts,
    subjectSemesterCounts: semCounts,
    availableSubjects: Array.from(new Set(available)),
  };

  return sheetStatus;
}

let sheetStatus: SheetSyncStatus = {
  isCustomSheet: false,
  sheetUrl: '',
  sheetUrls: { ...sheetUrlsByKey },
  lastSyncedAt: null,
  wordCount: VOCAB_DATA.length,
  subjectCounts: getSubjectCounts(VOCAB_DATA),
  subjectSemesterCounts: getSubjectSemesterCounts(VOCAB_DATA),
  availableSubjects: ['전체', '국어', '수학', '사회', '영어'],
};

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function getPublicRoomState(room: ServerRoom): RoomState {
  const playersObj: Record<string, Player> = {};
  room.players.forEach((player, id) => {
    playersObj[id] = { ...player };
  });

  const answersObj: Record<string, PlayerAnswerRecord> = {};
  room.answers.forEach((ans, id) => {
    answersObj[id] = { ...ans };
  });

  return {
    roomCode: room.roomCode,
    hostId: room.hostId,
    status: room.status,
    subject: room.subject,
    semester: room.semester || '전체',
    numQuestions: room.numQuestions,
    timeLimitSec: room.timeLimitSec,
    currentIndex: room.currentIndex,
    currentQuestion: room.currentQuestion,
    questionStartTime: room.questionStartTime,
    questionTimeRemaining: room.questionTimeRemaining,
    players: playersObj,
    answers: answersObj,
    roundOptionCounts: room.roundOptionCounts,
    history: room.history,
  };
}

function broadcastRoomState(room: ServerRoom) {
  const state = getPublicRoomState(room);
  io.to(room.roomCode).emit('room_state', state);
}

function stopTimer(room: ServerRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

function finishCurrentRound(room: ServerRoom) {
  stopTimer(room);
  room.status = 'ROUND_RESULT';
  room.questionTimeRemaining = 0;

  // Record history
  if (room.currentQuestion) {
    let correctCount = 0;
    room.answers.forEach((ans) => {
      if (ans.isCorrect) correctCount++;
    });

    room.history.push({
      question: room.currentQuestion,
      correctOption: room.currentQuestion.correctOption,
      optionCounts: { ...room.roundOptionCounts },
      totalAnswered: room.answers.size,
      correctCount,
    });
  }

  broadcastRoomState(room);
}

function startQuestionTimer(room: ServerRoom) {
  stopTimer(room);
  room.questionStartTime = Date.now();
  room.questionTimeRemaining = room.timeLimitSec;
  broadcastRoomState(room);

  room.timerInterval = setInterval(() => {
    room.questionTimeRemaining -= 1;

    if (room.questionTimeRemaining <= 0) {
      finishCurrentRound(room);
    } else {
      io.to(room.roomCode).emit('timer_tick', {
        timeRemaining: room.questionTimeRemaining,
      });
    }
  }, 1000);
}

function advanceToQuestion(room: ServerRoom, index: number) {
  stopTimer(room);
  room.currentIndex = index;
  room.currentQuestion = room.questions[index] || null;
  room.status = 'QUESTION';
  room.answers.clear();
  room.roundOptionCounts = {};

  // Reset player answered flags
  room.players.forEach((p) => {
    p.hasAnsweredCurrent = false;
    p.lastPointsEarned = 0;
    p.lastAnswerCorrect = null;
  });

  if (room.currentQuestion) {
    room.currentQuestion.options.forEach((opt) => {
      room.roundOptionCounts[opt] = 0;
    });
    startQuestionTimer(room);
  } else {
    room.status = 'GAME_OVER';
    broadcastRoomState(room);
  }
}

// Socket connection
io.on('connection', (socket: Socket) => {
  // Send current sheet sync status immediately
  socket.emit('sheet_synced', sheetStatus);

  // 1. Create Room (Host)
  socket.on('create_room', (data: {
    subject?: SubjectType;
    semester?: SemesterType;
    numQuestions?: number;
    timeLimitSec?: number;
    hostName?: string;
    avatar?: string;
  }) => {
    const roomCode = generateRoomCode();
    const subject = data.subject || '전체';
    const semester = data.semester || '전체';
    const numQuestions = data.numQuestions || 10;
    const timeLimitSec = data.timeLimitSec || 15;
    const hostName = (data.hostName || '선생님').trim();
    const avatar = data.avatar || '🎓';

    const hostPlayer: Player = {
      id: socket.id,
      name: hostName,
      avatar,
      isHost: true,
      score: 0,
      streak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      connected: true,
      hasAnsweredCurrent: false,
      lastPointsEarned: 0,
      lastAnswerCorrect: null,
    };

    const newRoom: ServerRoom = {
      roomCode,
      hostId: socket.id,
      status: 'LOBBY',
      subject,
      semester,
      numQuestions,
      timeLimitSec,
      questions: [],
      currentIndex: 0,
      currentQuestion: null,
      questionStartTime: null,
      questionTimeRemaining: timeLimitSec,
      timerInterval: null,
      players: new Map([[socket.id, hostPlayer]]),
      answers: new Map(),
      roundOptionCounts: {},
      history: [],
    };

    rooms.set(roomCode, newRoom);
    socket.join(roomCode);
    (socket as any).roomCode = roomCode;
    (socket as any).isHost = true;

    socket.emit('room_created', { roomCode, playerId: socket.id });
    broadcastRoomState(newRoom);
  });

  // 2. Join Room (Student)
  socket.on('join_room', (data: { roomCode: string; playerName: string; avatar: string }) => {
    const roomCode = (data.roomCode || '').trim();
    const playerName = (data.playerName || '학생').trim();
    const avatar = data.avatar || '⭐';

    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error_message', { message: '방 코드를 찾을 수 없습니다. 다시 확인해주세요!' });
      return;
    }

    if (room.status !== 'LOBBY' && room.status !== 'GAME_OVER') {
      socket.emit('error_message', { message: '이미 퀴즈가 진행 중인 방입니다!' });
      return;
    }

    const studentPlayer: Player = {
      id: socket.id,
      name: playerName,
      avatar,
      isHost: false,
      score: 0,
      streak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      connected: true,
      hasAnsweredCurrent: false,
      lastPointsEarned: 0,
      lastAnswerCorrect: null,
    };

    room.players.set(socket.id, studentPlayer);
    socket.join(roomCode);
    (socket as any).roomCode = roomCode;
    (socket as any).isHost = false;

    socket.emit('room_joined', { roomCode, playerId: socket.id });
    broadcastRoomState(room);
  });

  // 3. Update Room Settings in Lobby (Host)
  socket.on('update_settings', (data: { subject?: SubjectType; semester?: SemesterType; numQuestions?: number; timeLimitSec?: number }) => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') return;

    if (data.subject) room.subject = data.subject;
    if (data.semester) room.semester = data.semester;
    if (data.numQuestions) room.numQuestions = data.numQuestions;
    if (data.timeLimitSec) room.timeLimitSec = data.timeLimitSec;

    broadcastRoomState(room);
  });

  // 4. Start Game (Host)
  socket.on('start_game', () => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    // Generate questions using active vocabulary list (synced from Google Sheet if connected) and selected semester
    const generated = generateQuizQuestions(room.subject, room.numQuestions, activeVocabList, room.semester);
    room.questions = generated;
    room.numQuestions = generated.length;
    room.currentIndex = 0;
    room.history = [];
    room.status = 'STARTING';

    // Reset scores
    room.players.forEach((p) => {
      p.score = 0;
      p.streak = 0;
      p.totalCorrect = 0;
      p.totalAnswered = 0;
      p.hasAnsweredCurrent = false;
      p.lastPointsEarned = 0;
      p.lastAnswerCorrect = null;
    });

    broadcastRoomState(room);

    // 3 second countdown before question 1
    setTimeout(() => {
      if (rooms.get(roomCode) === room && room.status === 'STARTING') {
        advanceToQuestion(room, 0);
      }
    }, 3000);
  });

  // 5. Submit Answer (Student)
  socket.on('submit_answer', (data: { option: string }) => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.status !== 'QUESTION' || !room.currentQuestion) return;

    const player = room.players.get(socket.id);
    if (!player || player.hasAnsweredCurrent) return;

    const selectedOption = data.option;
    const isCorrect = selectedOption === room.currentQuestion.correctOption;
    const now = Date.now();
    const timeTakenSec = room.questionStartTime ? Math.max(0.5, (now - room.questionStartTime) / 1000) : 1;

    // Scoring: Base 100 + speed bonus up to 50 + streak bonus up to 30
    let points = 0;
    if (isCorrect) {
      const speedRatio = Math.max(0, (room.timeLimitSec - timeTakenSec) / room.timeLimitSec);
      const speedBonus = Math.round(speedRatio * 50);
      const streakBonus = Math.min(30, player.streak * 10);
      points = 100 + speedBonus + streakBonus;

      player.streak += 1;
      player.totalCorrect += 1;
    } else {
      player.streak = 0;
    }

    player.score += points;
    player.totalAnswered += 1;
    player.hasAnsweredCurrent = true;
    player.lastPointsEarned = points;
    player.lastAnswerCorrect = isCorrect;

    // Record answer
    room.answers.set(socket.id, {
      playerId: socket.id,
      option: selectedOption,
      isCorrect,
      timeTakenSec,
      points,
    });

    // Update option count
    room.roundOptionCounts[selectedOption] = (room.roundOptionCounts[selectedOption] || 0) + 1;

    // Notify all about answer progress
    const nonHostPlayers = Array.from(room.players.values()).filter((p) => !p.isHost && p.connected);
    const totalAnswered = room.answers.size;

    io.to(room.roomCode).emit('answer_progress', {
      totalAnswered,
      totalPlayers: nonHostPlayers.length,
      playerId: socket.id,
    });

    // If all students answered, immediately reveal results!
    if (nonHostPlayers.length > 0 && totalAnswered >= nonHostPlayers.length) {
      finishCurrentRound(room);
    } else {
      // Just update public state so host sees player answered flag
      broadcastRoomState(room);
    }
  });

  // 6. Host goes to Leaderboard
  socket.on('show_leaderboard', () => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.status = 'LEADERBOARD';
    broadcastRoomState(room);
  });

  // 7. Host advances to Next Question
  socket.on('next_question', () => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    const nextIdx = room.currentIndex + 1;
    if (nextIdx < room.questions.length) {
      advanceToQuestion(room, nextIdx);
    } else {
      stopTimer(room);
      room.status = 'GAME_OVER';
      broadcastRoomState(room);
    }
  });

  // 8. Restart / Play Again
  socket.on('restart_game', () => {
    const roomCode = (socket as any).roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    stopTimer(room);
    room.status = 'LOBBY';
    room.currentIndex = 0;
    room.currentQuestion = null;
    room.answers.clear();
    room.roundOptionCounts = {};
    room.history = [];

    room.players.forEach((p) => {
      p.score = 0;
      p.streak = 0;
      p.totalCorrect = 0;
      p.totalAnswered = 0;
      p.hasAnsweredCurrent = false;
      p.lastPointsEarned = 0;
      p.lastAnswerCorrect = null;
    });

    broadcastRoomState(room);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomCode = (socket as any).roomCode;
    if (roomCode && rooms.has(roomCode)) {
      const room = rooms.get(roomCode)!;
      const player = room.players.get(socket.id);
      if (player) {
        player.connected = false;
        // If room is in lobby, remove player
        if (room.status === 'LOBBY') {
          room.players.delete(socket.id);
        }

        // If host disconnected and nobody left, clean room after 10 mins
        const connectedCount = Array.from(room.players.values()).filter((p) => p.connected).length;
        if (connectedCount === 0) {
          stopTimer(room);
          rooms.delete(roomCode);
        } else {
          broadcastRoomState(room);
        }
      }
    }
  });
});

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, wordCount: activeVocabList.length });
});

app.get('/api/sheet/status', (req, res) => {
  res.json(sheetStatus);
});

function parseSubjectSemesterKey(key: string): { subject: string; semester?: '1학기' | '2학기' } {
  if (key.includes('_2학기')) {
    return { subject: key.replace('_2학기', ''), semester: '2학기' };
  }
  if (key.includes('_1학기')) {
    return { subject: key.replace('_1학기', ''), semester: '1학기' };
  }
  return { subject: key };
}

app.post('/api/sheet/sync', async (req, res) => {
  try {
    const { sheetUrls, subject, key, sheetUrl, semester } = req.body;
    const errors: Record<string, string> = {};

    // 1. Single key / subject sync request: { key: '국어_1학기', sheetUrl: '...' }
    const targetKey = key || (subject && semester ? `${subject}_${semester}` : subject);
    if (targetKey && typeof targetKey === 'string') {
      const url = typeof sheetUrl === 'string' ? sheetUrl.trim() : '';
      if (!url) {
        customVocabsByKey[targetKey] = [];
        sheetUrlsByKey[targetKey] = '';
      } else {
        try {
          const { subject: parsedSubj, semester: parsedSem } = parseSubjectSemesterKey(targetKey);
          const result = await fetchGoogleSheetVocab(url, parsedSubj, parsedSem);
          customVocabsByKey[targetKey] = result.items.map((it) => ({
            ...it,
            subject: it.subject || parsedSubj,
            semester: it.semester || parsedSem || '1학기',
          }));
          sheetUrlsByKey[targetKey] = url;
        } catch (err: any) {
          return res.status(400).json({ error: `[${targetKey}] ${err.message}` });
        }
      }
      const updatedStatus = updateSheetStatus();
      io.emit('sheet_synced', updatedStatus);
      return res.json({ success: true, sheetStatus: updatedStatus });
    }

    // 2. Multiple sync request: { sheetUrls: { '국어_1학기': '...', '국어_2학기': '...', ... } }
    if (sheetUrls && typeof sheetUrls === 'object') {
      const targetKeys = Object.keys(sheetUrls);

      for (const k of targetKeys) {
        const rawUrl = sheetUrls[k];
        const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';

        if (!url) {
          customVocabsByKey[k] = [];
          sheetUrlsByKey[k] = '';
          continue;
        }

        try {
          const { subject: parsedSubj, semester: parsedSem } = parseSubjectSemesterKey(k);
          const result = await fetchGoogleSheetVocab(url, parsedSubj, parsedSem);
          customVocabsByKey[k] = result.items.map((it) => ({
            ...it,
            subject: it.subject || parsedSubj,
            semester: it.semester || parsedSem || '1학기',
          }));
          sheetUrlsByKey[k] = url;
        } catch (err: any) {
          errors[k] = err.message || '시트를 불러오지 못했습니다.';
        }
      }

      const updatedStatus = updateSheetStatus();
      io.emit('sheet_synced', updatedStatus);

      const nonEmptyUrls = Object.entries(sheetUrls).filter(
        ([_, u]) => Boolean(u && typeof u === 'string' && u.trim())
      );

      if (nonEmptyUrls.length > 0 && Object.keys(errors).length === nonEmptyUrls.length) {
        const errorDetails = Object.entries(errors)
          .map(([s, msg]) => `• [${s}] ${msg}`)
          .join('\n');
        return res.status(400).json({ error: errorDetails, errors });
      }

      return res.json({
        success: true,
        sheetStatus: updatedStatus,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      });
    }

    // 3. Fallback single sheetUrl (unified sheet)
    if (sheetUrl && typeof sheetUrl === 'string' && sheetUrl.trim()) {
      const result = await fetchGoogleSheetVocab(sheetUrl.trim());
      for (const s of ['국어', '수학', '사회', '영어']) {
        const matching1 = result.items.filter((it) => it.subject === s && it.semester === '1학기');
        const matching2 = result.items.filter((it) => it.subject === s && it.semester === '2학기');
        if (matching1.length > 0) {
          customVocabsByKey[`${s}_1학기`] = matching1;
        }
        if (matching2.length > 0) {
          customVocabsByKey[`${s}_2학기`] = matching2;
        }
        if (matching1.length === 0 && matching2.length === 0) {
          const matchingAll = result.items.filter((it) => it.subject === s);
          if (matchingAll.length > 0) {
            customVocabsByKey[s] = matchingAll;
          }
        }
      }
      sheetUrlsByKey['국어_1학기'] = sheetUrl.trim();
      const updatedStatus = updateSheetStatus();
      io.emit('sheet_synced', updatedStatus);
      return res.json({ success: true, sheetStatus: updatedStatus });
    }

    return res.status(400).json({ error: '연동할 구글 시트 링크를 입력해주세요.' });
  } catch (err: any) {
    console.error('Failed to sync sheet:', err);
    res.status(400).json({ error: err.message || '구글 시트를 불러오지 못했습니다.' });
  }
});

app.post('/api/sheet/reset', (req, res) => {
  const { key, subject } = req.body || {};

  if (key && typeof key === 'string') {
    customVocabsByKey[key] = [];
    sheetUrlsByKey[key] = '';
  } else if (subject && typeof subject === 'string') {
    delete customVocabsByKey[subject];
    delete sheetUrlsByKey[subject];
    delete customVocabsByKey[`${subject}_1학기`];
    delete sheetUrlsByKey[`${subject}_1학기`];
    delete customVocabsByKey[`${subject}_2학기`];
    delete sheetUrlsByKey[`${subject}_2학기`];
  } else {
    for (const k of Object.keys(customVocabsByKey)) {
      customVocabsByKey[k] = [];
      sheetUrlsByKey[k] = '';
    }
  }

  const updatedStatus = updateSheetStatus();
  io.emit('sheet_synced', updatedStatus);
  res.json({ success: true, sheetStatus: updatedStatus });
});

app.get('/api/room/:code', (req, res) => {
  const code = req.params.code;
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: '방을 찾을 수 없습니다.' });
  }
  res.json({
    roomCode: room.roomCode,
    status: room.status,
    subject: room.subject,
    playerCount: room.players.size,
  });
});

// Setup Vite or Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [서버 실행 완료] 실시간 어휘 퀴즈 배틀 서버 포트 ${PORT}에서 실행 중`);
  });
}

startServer();
