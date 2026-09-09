import { io, Socket } from 'socket.io-client';
import { RoomState, SubjectType } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function createRoom(
  hostName: string,
  avatar: string,
  subject: SubjectType,
  numQuestions: number,
  timeLimitSec: number
) {
  const s = getSocket();
  s.emit('create_room', { hostName, avatar, subject, numQuestions, timeLimitSec });
}

export function joinRoom(roomCode: string, playerName: string, avatar: string) {
  const s = getSocket();
  s.emit('join_room', { roomCode, playerName, avatar });
}

export function updateRoomSettings(subject: SubjectType, numQuestions: number, timeLimitSec: number) {
  const s = getSocket();
  s.emit('update_settings', { subject, numQuestions, timeLimitSec });
}

export function startGame() {
  const s = getSocket();
  s.emit('start_game');
}

export function submitAnswer(option: string) {
  const s = getSocket();
  s.emit('submit_answer', { option });
}

export function showLeaderboard() {
  const s = getSocket();
  s.emit('show_leaderboard');
}

export function nextQuestion() {
  const s = getSocket();
  s.emit('next_question');
}

export function restartGame() {
  const s = getSocket();
  s.emit('restart_game');
}
