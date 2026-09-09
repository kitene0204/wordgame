import { SheetSyncStatus } from '../types';

export async function fetchSheetStatus(): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/status');
  if (!res.ok) throw new Error('시트 상태를 불러오지 못했습니다.');
  return res.json();
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

export async function resetGoogleSheet(): Promise<SheetSyncStatus> {
  const res = await fetch('/api/sheet/reset', {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '초기화에 실패했습니다.');
  }
  return data.sheetStatus;
}
