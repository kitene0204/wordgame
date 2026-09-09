import { SheetSyncStatus } from '../types';

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  delayMs = 600
): Promise<Response> {
  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (
        !res.ok &&
        (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 404)
      ) {
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
          continue;
        }
      }
      return res;
    } catch (err: any) {
      lastError = err;
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastError || new Error('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
}

async function safeParseResponse(res: Response): Promise<any> {
  const text = await res.text();
  let data: any = null;
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error('서버가 일시적으로 재시작 중입니다. 잠시 후 다시 시도해주세요.');
        }
        if (res.status === 404) {
          throw new Error('서버 연결을 확인 중입니다. 다시 한 번 동기화 버튼을 눌러주세요.');
        }
        throw new Error(`서버 응답 오류 (${res.status}). 다시 시도해주세요.`);
      }
      throw new Error('서버 응답 형식이 올바르지 않습니다.');
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || `요청 처리 중 오류가 발생했습니다 (${res.status}).`);
  }
  return data;
}

export async function fetchSheetStatus(): Promise<SheetSyncStatus> {
  const res = await fetchWithRetry('/api/sheet/status');
  return safeParseResponse(res);
}

function parseSubjectSemesterKey(key: string): { subject: string; semester?: '1학기' | '2학기' } {
  if (key.includes('_2학기')) {
    return { subject: key.replace('_2학기', ''), semester: '2학기' };
  }
  if (key.includes('_1학기')) {
    return { subject: key.replace('_1학기', ''), semester: '1학기' };
  }
  return { subject: key };
}

export async function syncMultipleGoogleSheets(
  sheetUrls: Record<string, string>
): Promise<{ sheetStatus: SheetSyncStatus; errors?: Record<string, string> }> {
  try {
    const res = await fetchWithRetry('/api/sheet/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrls }),
    });
    const data = await safeParseResponse(res);
    return { sheetStatus: data.sheetStatus, errors: data.errors };
  } catch (err: any) {
    console.warn('Server multi-sync notice, falling back:', err);
    // If server is unavailable, try to at least parse any valid sheets locally
    const { fetchGoogleSheetVocab } = await import('../utils/googleSheetSync');
    const currentUrls = getLocalSheetUrls() || {};
    const errors: Record<string, string> = {};
    let totalCount = 0;
    const semCounts: Record<string, number> = {};
    const subjCounts: Record<string, number> = {};

    for (const [k, u] of Object.entries(sheetUrls)) {
      if (!u || !u.trim()) continue;
      currentUrls[k] = u.trim();
      try {
        const parsed = parseSubjectSemesterKey(k);
        const res = await fetchGoogleSheetVocab(u.trim(), parsed.subject, parsed.semester);
        semCounts[k] = res.items.length;
        subjCounts[parsed.subject] = (subjCounts[parsed.subject] || 0) + res.items.length;
        totalCount += res.items.length;
      } catch (e: any) {
        errors[k] = e.message || '시트 불러오기 실패';
      }
    }
    saveLocalSheetUrls(currentUrls);

    const fallbackStatus: SheetSyncStatus = {
      isCustomSheet: totalCount > 0,
      sheetUrl: Object.values(currentUrls).find(Boolean) || '',
      sheetUrls: currentUrls,
      lastSyncedAt: new Date().toISOString(),
      wordCount: totalCount,
      subjectCounts: subjCounts,
      subjectSemesterCounts: semCounts,
      availableSubjects: ['전체', '국어', '수학', '사회', '영어'],
    };

    return { sheetStatus: fallbackStatus, errors: Object.keys(errors).length > 0 ? errors : undefined };
  }
}

export async function syncSingleSubjectSheet(
  keyOrSubject: string,
  sheetUrl: string
): Promise<SheetSyncStatus> {
  const urlTrimmed = sheetUrl ? sheetUrl.trim() : '';

  try {
    const res = await fetchWithRetry('/api/sheet/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: keyOrSubject, subject: keyOrSubject, sheetUrl: urlTrimmed }),
    });
    const data = await safeParseResponse(res);
    return data.sheetStatus;
  } catch (err: any) {
    // If the error message came from Google Sheet itself (e.g. permission/404 on Google), show it!
    if (err.message && err.message.includes('공유 권한')) {
      throw err;
    }

    // Direct browser fallback when server endpoint is unavailable or restarted
    if (urlTrimmed) {
      try {
        const { fetchGoogleSheetVocab } = await import('../utils/googleSheetSync');
        const parsed = parseSubjectSemesterKey(keyOrSubject);
        const res = await fetchGoogleSheetVocab(urlTrimmed, parsed.subject, parsed.semester);
        if (!res.items || res.items.length === 0) {
          throw new Error('구글 시트에 유효한 단어 데이터가 없습니다.');
        }

        const currentUrls = getLocalSheetUrls() || {};
        currentUrls[keyOrSubject] = urlTrimmed;
        saveLocalSheetUrls(currentUrls);

        const currentStatus = await fetchSheetStatus().catch(() => null);
        const fallbackStatus: SheetSyncStatus = {
          isCustomSheet: true,
          sheetUrl: urlTrimmed,
          sheetUrls: { ...(currentStatus?.sheetUrls || {}), [keyOrSubject]: urlTrimmed },
          lastSyncedAt: new Date().toISOString(),
          wordCount: (currentStatus?.wordCount || 0) + res.items.length,
          subjectCounts: {
            ...(currentStatus?.subjectCounts || {}),
            [parsed.subject]: res.items.length,
          },
          subjectSemesterCounts: {
            ...(currentStatus?.subjectSemesterCounts || {}),
            [keyOrSubject]: res.items.length,
          },
          availableSubjects: ['전체', '국어', '수학', '사회', '영어'],
        };

        // Try syncing to server again in background asynchronously
        fetch('/api/sheet/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: keyOrSubject, subject: keyOrSubject, sheetUrl: urlTrimmed }),
        }).catch(() => {});

        return fallbackStatus;
      } catch (clientErr: any) {
        throw clientErr;
      }
    }
    throw err;
  }
}

export async function syncGoogleSheet(sheetUrl: string): Promise<SheetSyncStatus> {
  const res = await fetchWithRetry('/api/sheet/sync', {
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
  const res = await fetchWithRetry('/api/sheet/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await safeParseResponse(res);
  return { sheetStatus: data.sheetStatus, updated: data.updated, errors: data.errors };
}

export async function resetGoogleSheet(keyOrSubject?: string): Promise<SheetSyncStatus> {
  const res = await fetchWithRetry('/api/sheet/reset', {
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

