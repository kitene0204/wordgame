import { VocabItem } from './data/vocabData';

export type SubjectType = '전체' | '국어' | '수학' | '사회' | '영어' | '과학' | string;
export type SemesterType = '전체' | '1학기' | '2학기';
export type QuizQuestionType = 'hanjaToWord' | 'wordToHanja' | 'meaningToWord' | 'wordToMeaning' | 'sentenceFillBlank';

export interface SheetSyncStatus {
  isCustomSheet: boolean;
  sheetUrl?: string;
  sheetUrls: Record<string, string>;
  lastSyncedAt: string | null;
  wordCount: number;
  subjectCounts: Record<string, number>;
  subjectSemesterCounts?: Record<string, number>;
  availableSubjects: string[];
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  item: VocabItem;
  questionTitle: string;
  questionHighlight: string;
  options: string[];
  correctOption: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  streak: number;
  totalCorrect: number;
  totalAnswered: number;
  connected: boolean;
  hasAnsweredCurrent: boolean;
  lastPointsEarned: number;
  lastAnswerCorrect: boolean | null;
}

export type RoomStatus = 'LOBBY' | 'STARTING' | 'QUESTION' | 'ROUND_RESULT' | 'LEADERBOARD' | 'GAME_OVER';

export interface PlayerAnswerRecord {
  playerId: string;
  option: string;
  isCorrect: boolean;
  timeTakenSec: number;
  points: number;
}

export interface QuestionHistoryItem {
  question: QuizQuestion;
  correctOption: string;
  optionCounts: Record<string, number>;
  totalAnswered: number;
  correctCount: number;
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  status: RoomStatus;
  subject: SubjectType;
  semester: SemesterType;
  numQuestions: number;
  timeLimitSec: number;
  currentIndex: number;
  currentQuestion: QuizQuestion | null;
  questionStartTime: number | null;
  questionTimeRemaining: number;
  players: Record<string, Player>;
  answers: Record<string, PlayerAnswerRecord>; // playerId -> answer
  roundOptionCounts: Record<string, number>;
  history: QuestionHistoryItem[];
}
