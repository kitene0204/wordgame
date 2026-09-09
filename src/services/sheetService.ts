import { SheetSyncStatus } from '../types';

export async function fetchSheetStatus(): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/status');
  if (!res.ok) throw new Error('시트 상태를 불러오지 못했습니다.');
  return res.json();
}

export async function syncMultipleGoogleSheets(
  sheetUrls: Record<string, string>
): Promise<{ sheetStatus: SheetSyncStatus; errors?: Record<string, string> }> {
  const res = await fetch('/api/sheet/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetUrls }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '구글 시트 동기화에 실패했습니다.');
  }
  return { sheetStatus: data.sheetStatus, errors: data.errors };
}

export async function syncSingleSubjectSheet(
  keyOrSubject: string,
  sheetUrl: string
): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyOrSubject, subject: keyOrSubject, sheetUrl }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '시트 동기화에 실패했습니다.');
  }
  return data.sheetStatus;
}

export async function syncGoogleSheet(sheetUrl: string): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetUrl }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '구글 시트 동기화에 실패했습니다.');
  }
  return data.sheetStatus;
}

export async function refreshGoogleSheets(): Promise<{
  sheetStatus: SheetSyncStatus;
  updated: number;
  errors?: Record<string, string>;
}> {
  const res = await fetch('/api/sheet/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '시트 새로고침에 실패했습니다.');
  }
  return { sheetStatus: data.sheetStatus, updated: data.updated, errors: data.errors };
}

export async function resetGoogleSheet(keyOrSubject?: string): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyOrSubject, subject: keyOrSubject }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '초기화에 실패했습니다.');
  }
  return data.sheetStatus;
}

// Client-side localStorage persistence helpers for 100% durable URL retention
const LOCAL_STORAGE_URLS_KEY = 'voca_battle_saved_sheet_urls';
const LOCAL_STORAGE_MODES_KEY = 'voca_battle_subject_modes';

export function saveLocalSheetUrls(urls: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalSheetUrls() || {};
    const merged = { ...existing };
    for (const [k, v] of Object.entries(urls)) {
      if (v && v.trim()) {
        merged[k] = v.trim();
      }
    }
    localStorage.setItem(LOCAL_STORAGE_URLS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export function getLocalSheetUrls(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_URLS_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function clearLocalSheetUrls(keyOrSubject?: string) {
  if (typeof window === 'undefined') return;
  try {
    if (!keyOrSubject) {
      localStorage.removeItem(LOCAL_STORAGE_URLS_KEY);
      return;
    }
    const current = getLocalSheetUrls();
    if (!current) return;
    delete current[keyOrSubject];
    delete current[`${keyOrSubject}_1학기`];
    delete current[`${keyOrSubject}_2학기`];
    localStorage.setItem(LOCAL_STORAGE_URLS_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to clear from localStorage:', e);
  }
}

export function saveLocalSubjectModes(modes: Record<string, 'SEMESTER' | 'UNIFIED'>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_MODES_KEY, JSON.stringify(modes));
  } catch (e) {
    console.warn('Failed to save subject modes to localStorage:', e);
  }
}

export function getLocalSubjectModes(): Record<string, 'SEMESTER' | 'UNIFIED'> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODES_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

