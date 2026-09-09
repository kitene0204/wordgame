import { SheetSyncStatus } from '../types';

async function safeParseResponse(res: Response): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON response (e.g., Cloud Run / proxy 502/503/504 HTML error page)
    if (!res.ok) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error('서버가 일시적으로 연결 준비 중입니다. 잠시 후 다시 시도해주세요.');
      }
      throw new Error(`서버 오류가 발생했습니다 (${res.status}). 잠시 후 다시 시도해주세요.`);
    }
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }

  if (!res.ok) {
    throw new Error(data?.error || `요청 처리 중 오류가 발생했습니다 (${res.status}).`);
  }
  return data;
}

export async function fetchSheetStatus(): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/status');
  return safeParseResponse(res);
}

export async function syncMultipleGoogleSheets(
  sheetUrls: Record<string, string>
): Promise<{ sheetStatus: SheetSyncStatus; errors?: Record<string, string> }> {
  const res = await fetch('/api/sheet/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetUrls }),
  });
  const data = await safeParseResponse(res);
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
  const data = await safeParseResponse(res);
  return data.sheetStatus;
}

export async function syncGoogleSheet(sheetUrl: string): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetUrl }),
  });
  const data = await safeParseResponse(res);
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
  const data = await safeParseResponse(res);
  return { sheetStatus: data.sheetStatus, updated: data.updated, errors: data.errors };
}

export async function resetGoogleSheet(keyOrSubject?: string): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyOrSubject, subject: keyOrSubject }),
  });
  const data = await safeParseResponse(res);
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

