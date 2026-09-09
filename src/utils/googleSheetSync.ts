import { VocabItem } from '../data/vocabData';

/**
 * Normalizes user-pasted Google Sheet URLs into direct downloadable CSV URLs
 */
export function normalizeGoogleSheetCsvUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // 1. Direct CSV link already
  if (trimmed.includes('output=csv') || trimmed.endsWith('.csv')) {
    return trimmed;
  }

  // 2. Published web URL (pubhtml -> pub?output=csv)
  if (trimmed.includes('/pubhtml')) {
    return trimmed.replace('/pubhtml', '/pub?output=csv');
  }

  // 3. Standard Google Sheet URL (https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...)
  const sheetIdMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetIdMatch && sheetIdMatch[1]) {
    const sheetId = sheetIdMatch[1];
    // Check for gid (specific worksheet/tab)
    const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return trimmed;
}

/**
 * Robust CSV line/cell splitter that handles quotes, escaped quotes, and commas
 */
function parseCsvRows(csvText: string): string[][] {
  // Strip UTF-8 BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '');
  // Normalize newlines
  cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote ("")
        currentCell += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Cell boundary
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      // Row boundary
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes subject names into standard elementary curriculum subjects
 */
export function normalizeSubjectName(raw: string): string {
  const s = raw.trim();
  if (/국어/i.test(s)) return '국어';
  if (/수학/i.test(s)) return '수학';
  if (/사회/i.test(s)) return '사회';
  if (/영어|eng/i.test(s)) return '영어';
  if (/과학/i.test(s)) return '과학';
  return s || '국어';
}

/**
 * Parses raw CSV into array of VocabItem
 */
export function parseCsvToVocab(
  csvText: string,
  defaultSubject?: string,
  defaultSemester?: string
): VocabItem[] {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return [];

  const headerRow = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, ''));

  let subjectCol = -1;
  let semesterCol = -1;
  let wordCol = -1;
  let meaningCol = -1;
  let hanjaCol = -1;
  let exampleCol = -1;

  headerRow.forEach((col, idx) => {
    if (/학기|semester|term/.test(col)) {
      semesterCol = idx;
    } else if (/과목|구분|교과|분야|subject|category/.test(col)) {
      subjectCol = idx;
    } else if (/한자|발음|발음기호|음훈|hanja|pronunciation/.test(col)) {
      // Must check hanja before meaning, so '한자 풀이' is assigned to hanjaCol, not meaningCol
      hanjaCol = idx;
    } else if (/단어|낱말|어휘|영어단어|영단어|word|term|vocab/.test(col)) {
      wordCol = idx;
    } else if (/뜻|의미|설명|풀이|우리말|정의|meaning|definition/.test(col)) {
      meaningCol = idx;
    } else if (/예문|문장|활용|example|sentence/.test(col)) {
      exampleCol = idx;
    }
  });

  const isHeaderValid = wordCol !== -1 && meaningCol !== -1;
  const startIdx = isHeaderValid ? 1 : 0;

  // Fallback column positions if standard headers weren't named
  if (!isHeaderValid) {
    if (defaultSubject) {
      // In subject-specific sheet, column 0 is usually word, 1 is meaning, etc.
      wordCol = 0;
      meaningCol = 1;
      hanjaCol = 2;
      exampleCol = 3;
    } else {
      subjectCol = 0;
      wordCol = 1;
      meaningCol = 2;
      hanjaCol = 3;
      exampleCol = 4;
    }
  }

  const items: VocabItem[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawSubject =
      (subjectCol >= 0 && row[subjectCol] && row[subjectCol].trim())
        ? row[subjectCol]
        : (defaultSubject || '국어');

    let semester: '1학기' | '2학기' = (defaultSemester === '2학기' ? '2학기' : '1학기');
    if (semesterCol >= 0 && row[semesterCol]) {
      const semVal = row[semesterCol].trim();
      if (/2|2학기|second/i.test(semVal)) {
        semester = '2학기';
      } else if (/1|1학기|first/i.test(semVal)) {
        semester = '1학기';
      }
    }

    const word = (wordCol >= 0 && row[wordCol]) ? row[wordCol].trim() : '';
    const meaning = (meaningCol >= 0 && row[meaningCol]) ? row[meaningCol].trim() : '';
    const hanja = (hanjaCol >= 0 && row[hanjaCol]) ? row[hanjaCol].trim() : '';
    const example = (exampleCol >= 0 && row[exampleCol]) ? row[exampleCol].trim() : '';

    // Must have at least word and meaning
    if (!word || !meaning) continue;
    // Skip if it looks like an unparsed header row or notice
    if (
      word === '단어' ||
      word === '낱말' ||
      word.toLowerCase() === 'word' ||
      meaning === '뜻' ||
      meaning.toLowerCase() === 'meaning' ||
      word.startsWith('※') ||
      word.startsWith('*')
    ) {
      continue;
    }

    const subject = normalizeSubjectName(rawSubject);

    items.push({
      word,
      meaning,
      hanja: hanja || (subject === '영어' ? '' : '-'),
      subject,
      semester,
      example: example || '',
    });
  }

  return items;
}

/**
 * Fetches and parses a Google Sheet from a given URL
 */
export async function fetchGoogleSheetVocab(
  sheetUrl: string,
  defaultSubject?: string,
  defaultSemester?: string
): Promise<{
  items: VocabItem[];
  subjectCounts: Record<string, number>;
  csvUrl: string;
}> {
  const csvUrl = normalizeGoogleSheetCsvUrl(sheetUrl);
  if (!csvUrl) {
    throw new Error('올바른 구글 시트 링크를 입력해주세요.');
  }

  const response = await fetch(csvUrl, {
    headers: {
      Accept: 'text/csv,text/plain,*/*',
    },
  });

  if (!response.ok) {
    throw new Error(
      `구글 시트를 불러올 수 없습니다 (${response.status}). 시트의 공유 권한을 '링크가 있는 모든 사용자에게 보기 공개'로 설정했는지 확인해주세요!`
    );
  }

  const text = await response.text();
  // Check if Google returned an HTML login page instead of CSV
  if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('accounts.google.com')) {
    throw new Error(
      '구글 로그인 화면이 반환되었습니다. 구글 시트 우측 상단 [공유] ➔ [일반 액세스: 링크가 있는 모든 사용자(뷰어)]로 변경해주세요!'
    );
  }

  const items = parseCsvToVocab(text, defaultSubject, defaultSemester);
  if (items.length === 0) {
    throw new Error('시트에서 유효한 단어 데이터를 찾지 못했습니다. 열 제목(단어, 뜻 등)을 확인해주세요.');
  }

  const subjectCounts: Record<string, number> = {};
  items.forEach((item) => {
    subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
  });

  return { items, subjectCounts, csvUrl };
}
