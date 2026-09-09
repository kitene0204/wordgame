import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  Info,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { SheetSyncStatus } from '../types';
import { playSound } from '../utils/audio';

interface SubjectConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  sem1Placeholder: string;
  sem2Placeholder: string;
  unifiedPlaceholder: string;
}

const SUBJECT_CONFIGS: SubjectConfig[] = [
  {
    id: '국어',
    name: '국어',
    icon: '📖',
    color: 'text-sky-700',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    borderColor: 'border-sky-300 focus:border-sky-500',
    sem1Placeholder: '국어 1학기 구글 시트 공유 링크 (URL)',
    sem2Placeholder: '국어 2학기 구글 시트 공유 링크 (URL)',
    unifiedPlaceholder: '국어 1·2학기 통합 구글 시트 공유 링크 (URL)',
  },
  {
    id: '수학',
    name: '수학',
    icon: '📐',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    borderColor: 'border-amber-300 focus:border-amber-500',
    sem1Placeholder: '수학 1학기 구글 시트 공유 링크 (URL)',
    sem2Placeholder: '수학 2학기 구글 시트 공유 링크 (URL)',
    unifiedPlaceholder: '수학 1·2학기 통합 구글 시트 공유 링크 (URL)',
  },
  {
    id: '사회',
    name: '사회',
    icon: '🏛️',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-300 focus:border-emerald-500',
    sem1Placeholder: '사회 1학기 구글 시트 공유 링크 (URL)',
    sem2Placeholder: '사회 2학기 구글 시트 공유 링크 (URL)',
    unifiedPlaceholder: '사회 1·2학기 통합 구글 시트 공유 링크 (URL)',
  },
  {
    id: '영어',
    name: '영어',
    icon: '🔤',
    color: 'text-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    borderColor: 'border-indigo-300 focus:border-indigo-500',
    sem1Placeholder: '영어 1학기 구글 시트 공유 링크 (URL)',
    sem2Placeholder: '영어 2학기 구글 시트 공유 링크 (URL)',
    unifiedPlaceholder: '영어 1·2학기 통합 구글 시트 공유 링크 (URL)',
  },
];

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetStatus: SheetSyncStatus | null;
  onSyncMultiple: (sheetUrls: Record<string, string>) => Promise<{ errors?: Record<string, string> }>;
  onSyncSingle?: (keyOrSubject: string, sheetUrl: string) => Promise<void>;
  onReset: (keyOrSubject?: string) => Promise<void>;
  isLoading: boolean;
  isSyncing?: boolean;
  onQuickRefresh?: () => Promise<void>;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  sheetStatus,
  onSyncMultiple,
  onSyncSingle,
  onReset,
  isLoading,
  isSyncing = false,
  onQuickRefresh,
  autoSyncEnabled = true,
  onToggleAutoSync,
}) => {
  const [urls, setUrls] = useState<Record<string, string>>({
    국어_1학기: '',
    국어_2학기: '',
    국어: '',
    수학_1학기: '',
    수학_2학기: '',
    수학: '',
    사회_1학기: '',
    사회_2학기: '',
    사회: '',
    영어_1학기: '',
    영어_2학기: '',
    영어: '',
  });

  // Track whether each subject is in "SEMESTER" (split 1/2 sem) or "UNIFIED" mode
  const [subjectModes, setSubjectModes] = useState<Record<string, 'SEMESTER' | 'UNIFIED'>>({
    국어: 'SEMESTER',
    수학: 'SEMESTER',
    사회: 'SEMESTER',
    영어: 'SEMESTER',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SYNC' | 'GUIDE'>('SYNC');
  const [guideSubject, setGuideSubject] = useState<'국어' | '수학' | '사회' | '영어'>('국어');
  const [copiedSubject, setCopiedSubject] = useState<string | null>(null);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);

  const [showGlobalUnified, setShowGlobalUnified] = useState(false);
  const [globalUnifiedUrl, setGlobalUnifiedUrl] = useState('');

  // Synchronize internal inputs with sheetStatus when modal opens or updates
  useEffect(() => {
    if (sheetStatus?.sheetUrls) {
      setUrls((prev) => ({
        ...prev,
        국어_1학기: sheetStatus.sheetUrls['국어_1학기'] || '',
        국어_2학기: sheetStatus.sheetUrls['국어_2학기'] || '',
        국어: sheetStatus.sheetUrls['국어'] || '',
        수학_1학기: sheetStatus.sheetUrls['수학_1학기'] || '',
        수학_2학기: sheetStatus.sheetUrls['수학_2학기'] || '',
        수학: sheetStatus.sheetUrls['수학'] || '',
        사회_1학기: sheetStatus.sheetUrls['사회_1학기'] || '',
        사회_2학기: sheetStatus.sheetUrls['사회_2학기'] || '',
        사회: sheetStatus.sheetUrls['사회'] || '',
        영어_1학기: sheetStatus.sheetUrls['영어_1학기'] || '',
        영어_2학기: sheetStatus.sheetUrls['영어_2학기'] || '',
        영어: sheetStatus.sheetUrls['영어'] || '',
      }));

      // Automatically switch to unified mode if only unified URL exists for a subject
      setSubjectModes((prev) => {
        const next = { ...prev };
        for (const subj of ['국어', '수학', '사회', '영어']) {
          const hasUnified = Boolean(sheetStatus.sheetUrls[subj]);
          const hasSem = Boolean(sheetStatus.sheetUrls[`${subj}_1학기`] || sheetStatus.sheetUrls[`${subj}_2학기`]);
          if (hasUnified && !hasSem) {
            next[subj] = 'UNIFIED';
          }
        }
        return next;
      });
    }
  }, [sheetStatus, isOpen]);

  if (!isOpen) return null;

  const handleUrlChange = (key: string, val: string) => {
    setUrls((prev) => ({ ...prev, [key]: val }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Sync all non-empty subject URLs at once
  const handleSyncAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Collect active URLs based on current subject mode
    const activePayload: Record<string, string> = {};
    for (const subj of ['국어', '수학', '사회', '영어']) {
      const mode = subjectModes[subj];
      if (mode === 'SEMESTER') {
        const url1 = urls[`${subj}_1학기`]?.trim();
        const url2 = urls[`${subj}_2학기`]?.trim();
        if (url1) activePayload[`${subj}_1학기`] = url1;
        if (url2) activePayload[`${subj}_2학기`] = url2;
      } else {
        const urlUnified = urls[subj]?.trim();
        if (urlUnified) activePayload[subj] = urlUnified;
      }
    }

    const hasAnyInput = Object.values(activePayload).some((u) => u.length > 0);
    if (!hasAnyInput && !sheetStatus?.isCustomSheet) {
      setGeneralError('적어도 하나 이상의 과목/학기 구글 시트 링크를 입력해주세요.');
      return;
    }

    playSound('click');
    try {
      const res = await onSyncMultiple(activePayload);
      if (res.errors && Object.keys(res.errors).length > 0) {
        setFieldErrors(res.errors);
        playSound('wrong');
      } else {
        playSound('victory');
      }
    } catch (err: any) {
      setGeneralError(err.message || '시트 동기화에 실패했습니다.');
      playSound('wrong');
    }
  };

  // Sync a single key (e.g. '국어_1학기', '국어_2학기', '국어')
  const handleSyncSingleKey = async (key: string) => {
    const url = urls[key]?.trim() || '';
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSyncingKey(key);
    playSound('click');

    try {
      if (onSyncSingle) {
        await onSyncSingle(key, url);
        playSound('victory');
      } else {
        await onSyncMultiple({ ...urls, [key]: url });
        playSound('victory');
      }
    } catch (err: any) {
      setFieldErrors((prev) => ({ ...prev, [key]: err.message || '동기화 실패' }));
      playSound('wrong');
    } finally {
      setSyncingKey(null);
    }
  };

  // Reset a specific key, entire subject, or everything
  const handleResetTarget = async (keyOrSubject?: string) => {
    let confirmMsg = '모든 과목을 기본 내장 단어장으로 되돌리시겠습니까?';
    if (keyOrSubject) {
      if (keyOrSubject.includes('_')) {
        const [subj, sem] = keyOrSubject.split('_');
        confirmMsg = `[${subj} ${sem}] 시트 연동을 해제하고 기본 단어로 복구하시겠습니까?`;
      } else {
        confirmMsg = `[${keyOrSubject}] 과목의 모든 학기 시트 연동을 해제하고 기본 단어로 복구하시겠습니까?`;
      }
    }

    if (!confirm(confirmMsg)) return;

    playSound('click');
    try {
      await onReset(keyOrSubject);
      if (keyOrSubject) {
        if (keyOrSubject.includes('_')) {
          setUrls((prev) => ({ ...prev, [keyOrSubject]: '' }));
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[keyOrSubject];
            return next;
          });
        } else {
          setUrls((prev) => ({
            ...prev,
            [keyOrSubject]: '',
            [`${keyOrSubject}_1학기`]: '',
            [`${keyOrSubject}_2학기`]: '',
          }));
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[keyOrSubject];
            delete next[`${keyOrSubject}_1학기`];
            delete next[`${keyOrSubject}_2학기`];
            return next;
          });
        }
      } else {
        setUrls({
          국어_1학기: '',
          국어_2학기: '',
          국어: '',
          수학_1학기: '',
          수학_2학기: '',
          수학: '',
          사회_1학기: '',
          사회_2학기: '',
          사회: '',
          영어_1학기: '',
          영어_2학기: '',
          영어: '',
        });
        setFieldErrors({});
      }
      setGeneralError(null);
    } catch (err: any) {
      setGeneralError(err.message || '초기화에 실패했습니다.');
    }
  };

  // Apply a single spreadsheet link to all subjects
  const handleApplyGlobalUnified = () => {
    if (!globalUnifiedUrl.trim()) return;
    const url = globalUnifiedUrl.trim();
    setUrls((prev) => ({
      ...prev,
      국어: url,
      수학: url,
      사회: url,
      영어: url,
    }));
    setSubjectModes({
      국어: 'UNIFIED',
      수학: 'UNIFIED',
      사회: 'UNIFIED',
      영어: 'UNIFIED',
    });
    setShowGlobalUnified(false);
    playSound('click');
  };

  // Sample TSV data with '학기' column included
  const samplesBySubject: Record<
    string,
    { tsv: string; rows: Array<{ word: string; meaning: string; extra: string; example: string; semester: string }> }
  > = {
    국어: {
      tsv: `단어\t뜻\t한자\t예문\t학기
촉구\t어떤 일을 빨리 하도록 재촉함\t促求\t시민들이 대책 마련을 강력히 촉구했다.\t1학기
경청\t남의 말을 귀 기울여 들음\t傾聽\t선생님의 말씀을 바른 자세로 경청했다.\t1학기
함축\t말이나 글이 많은 뜻을 속에 담고 있음\t含蓄\t시의 구절마다 깊은 의미가 함축되어 있다.\t2학기
관철\t어려움을 뚫고 뜻이나 계획을 끝까지 이룸\t貫徹\t그는 끈기 있는 노력으로 자신의 주장을 관철했다.\t2학기`,
      rows: [
        { word: '촉구', meaning: '어떤 일을 빨리 하도록 재촉함', extra: '促求', example: '대책 마련을 강력히 촉구했다.', semester: '1학기' },
        { word: '경청', meaning: '남의 말을 귀 기울여 들음', extra: '傾聽', example: '말씀을 바른 자세로 경청했다.', semester: '1학기' },
        { word: '함축', meaning: '많은 뜻을 속에 담고 있음', extra: '含蓄', example: '깊은 의미가 함축되어 있다.', semester: '2학기' },
        { word: '관철', meaning: '계획을 끝까지 이룸', extra: '貫徹', example: '주장을 관철했다.', semester: '2학기' },
      ],
    },
    수학: {
      tsv: `단어\t뜻\t한자\t예문\t학기
분모\t분수에서 분수선 아래에 위치한 기준 수\t分母\t분모가 다른 분수는 통분하여 계산한다.\t1학기
약수\t어떤 수를 나누어떨어지게 하는 수\t約數\t12의 약수는 1, 2, 3, 4, 6, 12입니다.\t1학기
직각\t직각삼각형에서 90도를 이루는 각\t直角\t네 각이 모두 직각인 사각형은 직사각형이다.\t2학기
원주율\t원의 지름에 대한 원주의 비율(약 3.14)\t圓周率\t원의 넓이는 반지름 × 반지름 × 원주율이다.\t2학기`,
      rows: [
        { word: '분모', meaning: '분수에서 분수선 아래 기준 수', extra: '分母', example: '분모가 다른 분수는 통분한다.', semester: '1학기' },
        { word: '약수', meaning: '나누어떨어지게 하는 수', extra: '約數', example: '12의 약수는 1, 2, 3, 4, 6, 12입니다.', semester: '1학기' },
        { word: '직각', meaning: '90도를 이루는 각', extra: '直角', example: '네 각이 직각인 사각형이다.', semester: '2학기' },
        { word: '원주율', meaning: '지름에 대한 원주의 비율', extra: '圓周率', example: '반지름 × 반지름 × 원주율', semester: '2학기' },
      ],
    },
    사회: {
      tsv: `단어\t뜻\t한자\t예문\t학기
헌법\t국가의 기본 원칙을 정한 최고의 법\t憲法\t대한민국 헌법은 국민의 기본권을 보장한다.\t1학기
삼권분립\t입법·사법·행정의 권력을 나눔\t三權分立\t권력 남용을 막기 위해 삼권분립을 실천한다.\t1학기
민주주의\t국민이 국가의 주권을 가지는 정치 제도\t民主主義\t선거는 민주주의의 꽃이라고 부른다.\t2학기
세계화\t세계 여러 나라가 하나의 지구촌으로 통합됨\t世界化\t세계화 시대를 맞아 다양한 문화를 배운다.\t2학기`,
      rows: [
        { word: '헌법', meaning: '국가의 기본 원칙을 정한 최고의 법', extra: '憲法', example: '헌법은 국민의 기본권을 보장한다.', semester: '1학기' },
        { word: '삼권분립', meaning: '입법·사법·행정의 권력을 나눔', extra: '三權分立', example: '권력 남용을 막기 위해 분립한다.', semester: '1학기' },
        { word: '민주주의', meaning: '국민이 주권을 가지는 정치 제도', extra: '民主主義', example: '선거는 민주주의의 꽃이다.', semester: '2학기' },
        { word: '세계화', meaning: '지구촌으로 통합됨', extra: '世界化', example: '다양한 문화를 배운다.', semester: '2학기' },
      ],
    },
    영어: {
      tsv: `단어\t뜻\t발음기호\t예문\t학기
discover\t발견하다, 알아내다\t[dɪˈskʌvər]\tScientists discover new planets.\t1학기
curious\t호기심이 많은, 궁금해하는\t[ˈkjʊəriəs]\tThe curious boy asked many questions.\t1학기
environment\t자연환경, 주위 환경\t[ɪnˈvaɪrənmənt]\tWe must protect our environment.\t2학기
adventure\t모험, 신나는 경험\t[ədˈventʃər]\tThey went on a wild adventure.\t2학기`,
      rows: [
        { word: 'discover', meaning: '발견하다, 알아내다', extra: '[dɪˈskʌvər]', example: 'Scientists discover new planets.', semester: '1학기' },
        { word: 'curious', meaning: '호기심이 많은', extra: '[ˈkjʊəriəs]', example: 'The curious boy asked questions.', semester: '1학기' },
        { word: 'environment', meaning: '자연환경, 주위 환경', extra: '[ɪnˈvaɪrənmənt]', example: 'We must protect our environment.', semester: '2학기' },
        { word: 'adventure', meaning: '모험, 신나는 경험', extra: '[ədˈventʃər]', example: 'They went on a wild adventure.', semester: '2학기' },
      ],
    },
  };

  const handleCopyTsv = (subject: string) => {
    const data = samplesBySubject[subject]?.tsv;
    if (data) {
      navigator.clipboard.writeText(data);
      setCopiedSubject(subject);
      playSound('click');
      setTimeout(() => setCopiedSubject(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in break-keep">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border-4 border-emerald-400 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              📚
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                과목별 & 학기별 구글 시트 단어장 연동
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                국어·수학·사회·영어 과목별로 1학기·2학기 시트를 따로 등록하거나 통합하여 연동할 수 있습니다
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-slate-100 bg-slate-50 px-4 pt-2.5 gap-2">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('SYNC');
            }}
            className={`px-4 py-2 font-bold text-sm rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'SYNC'
                ? 'bg-white text-emerald-700 border-t-2 border-x-2 border-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🔗 과목 및 학기별 링크 등록
          </button>
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('GUIDE');
            }}
            className={`px-4 py-2 font-bold text-sm rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'GUIDE'
                ? 'bg-white text-emerald-700 border-t-2 border-x-2 border-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📖 시트 양식 안내 & 샘플
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'SYNC' ? (
            <>
              {/* Overall Status Banner */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSyncing
                    ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
                    : sheetStatus?.isCustomSheet
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-black text-sm sm:text-base">
                    {isSyncing ? (
                      <>
                        <RefreshCw size={18} className="text-amber-600 animate-spin shrink-0" />
                        <span>구글 시트 어휘 수시 동기화 중...</span>
                      </>
                    ) : sheetStatus?.isCustomSheet ? (
                      <>
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span>선생님 구글 시트 동기화 완료!</span>
                        <span className="text-xs bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold">
                          총 {sheetStatus.wordCount}개 어휘
                        </span>
                      </>
                    ) : (
                      <>
                        <BookOpen size={18} className="text-slate-500 shrink-0" />
                        <span>기본 제공 단어장 사용 중 (과목당 15단어, 총 60단어)</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs opacity-80">
                    {sheetStatus?.lastSyncedAt
                      ? `최근 동기화: ${new Date(sheetStatus.lastSyncedAt).toLocaleTimeString('ko-KR')} · 수시로 시트가 업데이트되면 퀴즈에 즉시 반영됩니다.`
                      : '과목별로 1학기/2학기 시트 링크를 등록하고 [모든 시트 한 번에 동기화하기]를 눌러주세요.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
                  {/* Quick Refresh Button */}
                  {sheetStatus?.isCustomSheet && onQuickRefresh && (
                    <button
                      onClick={() => onQuickRefresh()}
                      disabled={isSyncing || isLoading}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                      지금 즉시 새로고침
                    </button>
                  )}

                  {/* Auto-Sync Toggle */}
                  {sheetStatus?.isCustomSheet && onToggleAutoSync && (
                    <button
                      onClick={onToggleAutoSync}
                      title="3분마다 백그라운드에서 구글 시트를 자동으로 최신화합니다"
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        autoSyncEnabled
                          ? 'bg-sky-100 hover:bg-sky-200 text-sky-800 border-sky-300'
                          : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-sky-500 animate-pulse' : 'bg-slate-400'}`} />
                      수시 자동 동기화 {autoSyncEnabled ? 'ON' : 'OFF'}
                    </button>
                  )}

                  {/* Reset Button */}
                  {sheetStatus?.isCustomSheet && (
                    <button
                      onClick={() => handleResetTarget()}
                      disabled={isLoading || isSyncing}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <RotateCcw size={13} />
                      전체 초기화
                    </button>
                  )}
                </div>
              </div>

              {/* General Error Alert */}
              {generalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <div className="whitespace-pre-line font-bold">{generalError}</div>
                </div>
              )}

              {/* Subject Cards Section */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    과목별 1학기 · 2학기 링크 설정
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGlobalUnified(!showGlobalUnified)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showGlobalUnified ? '단일 통합 시트 닫기' : '💡 한 시트에 모든 과목과 학기가 들어있나요?'}</span>
                    {showGlobalUnified ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Collapsible Global Single Unified Sheet Helper */}
                {showGlobalUnified && (
                  <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-2 animate-fade-in">
                    <div className="font-bold flex items-center gap-1.5">
                      <FileSpreadsheet size={15} />
                      모든 과목과 학기가 구글 시트 단 1개에 [과목], [학기] 열로 구분되어 있는 경우
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={globalUnifiedUrl}
                        onChange={(e) => setGlobalUnifiedUrl(e.target.value)}
                        placeholder="통합 구글 시트 공유 링크 붙여넣기..."
                        className="flex-1 px-3 py-2 rounded-xl border border-teal-300 bg-white text-xs font-medium focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyGlobalUnified}
                        className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shrink-0"
                      >
                        4개 과목 일괄 적용
                      </button>
                    </div>
                  </div>
                )}

                {/* 4 Subjects Grid / List */}
                <div className="space-y-3.5">
                  {SUBJECT_CONFIGS.map((subj) => {
                    const mode = subjectModes[subj.name] || 'SEMESTER';
                    const sem1Key = `${subj.name}_1학기`;
                    const sem2Key = `${subj.name}_2학기`;
                    const unifiedKey = subj.name;

                    const count1 = sheetStatus?.subjectSemesterCounts?.[sem1Key] ?? 0;
                    const count2 = sheetStatus?.subjectSemesterCounts?.[sem2Key] ?? 0;
                    const countTotal = sheetStatus?.subjectCounts?.[subj.name] ?? (count1 + count2);

                    const hasSem1Custom = Boolean(sheetStatus?.sheetUrls?.[sem1Key]);
                    const hasSem2Custom = Boolean(sheetStatus?.sheetUrls?.[sem2Key]);
                    const hasUnifiedCustom = Boolean(sheetStatus?.sheetUrls?.[unifiedKey]);
                    const hasAnySubjectCustom = hasSem1Custom || hasSem2Custom || hasUnifiedCustom;

                    const isSyncingSem1 = syncingKey === sem1Key;
                    const isSyncingSem2 = syncingKey === sem2Key;
                    const isSyncingUnified = syncingKey === unifiedKey;

                    const errorSem1 = fieldErrors[sem1Key];
                    const errorSem2 = fieldErrors[sem2Key];
                    const errorUnified = fieldErrors[unifiedKey];

                    return (
                      <div
                        key={subj.id}
                        className="p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-3"
                      >
                        {/* Subject Top Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{subj.icon}</span>
                            <span className={`font-black text-lg ${subj.color}`}>
                              {subj.name}
                            </span>
                            {hasAnySubjectCustom ? (
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-600" />
                                시트 연동됨 (1학기 {count1}개 · 2학기 {count2}개)
                              </span>
                            ) : (
                              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                기본 단어 (1학기 {count1 || 8}개 · 2학기 {count2 || 7}개)
                              </span>
                            )}
                          </div>

                          {/* Mode Toggle & Subject Reset */}
                          <div className="flex items-center gap-2">
                            {/* Toggle 1/2학기 분리 vs 통합 */}
                            <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click');
                                  setSubjectModes((prev) => ({ ...prev, [subj.name]: 'SEMESTER' }));
                                }}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  mode === 'SEMESTER'
                                    ? 'bg-white text-slate-800 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                🌸 1·2학기 분리
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click');
                                  setSubjectModes((prev) => ({ ...prev, [subj.name]: 'UNIFIED' }));
                                }}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  mode === 'UNIFIED'
                                    ? 'bg-white text-slate-800 shadow-2xs'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                🌟 통합 링크 1개
                              </button>
                            </div>

                            {hasAnySubjectCustom && (
                              <button
                                type="button"
                                onClick={() => handleResetTarget(subj.name)}
                                title="이 과목 기본 단어로 복구"
                                className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                              >
                                과목 초기화
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inputs based on mode */}
                        {mode === 'SEMESTER' ? (
                          <div className="space-y-2.5 pt-1">
                            {/* 1학기 Input */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1 text-slate-700">
                                  <span>🌸</span>
                                  <span>1학기 구글 시트 링크</span>
                                  {hasSem1Custom && (
                                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                                      {count1}단어 연결됨
                                    </span>
                                  )}
                                </span>
                                {hasSem1Custom && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetTarget(sem1Key)}
                                    className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer"
                                  >
                                    1학기만 초기화
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                  <input
                                    type="url"
                                    value={urls[sem1Key] || ''}
                                    onChange={(e) => handleUrlChange(sem1Key, e.target.value)}
                                    placeholder={subj.sem1Placeholder}
                                    disabled={isLoading || isSyncingSem1}
                                    className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-medium text-slate-800 bg-slate-50/60 focus:bg-white transition-all ${
                                      errorSem1 ? 'border-rose-400 bg-rose-50/30' : subj.borderColor
                                    }`}
                                  />
                                  {urls[sem1Key] && (
                                    <button
                                      type="button"
                                      onClick={() => handleUrlChange(sem1Key, '')}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSyncSingleKey(sem1Key)}
                                  disabled={isLoading || isSyncingSem1 || !urls[sem1Key]?.trim()}
                                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40 shrink-0"
                                  title="1학기만 동기화"
                                >
                                  <RefreshCw size={12} className={isSyncingSem1 ? 'animate-spin' : ''} />
                                  1학기 동기화
                                </button>
                              </div>
                              {errorSem1 && (
                                <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1 pl-1">
                                  <AlertCircle size={12} className="shrink-0" />
                                  <span>{errorSem1}</span>
                                </div>
                              )}
                            </div>

                            {/* 2학기 Input */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1 text-slate-700">
                                  <span>🍁</span>
                                  <span>2학기 구글 시트 링크</span>
                                  {hasSem2Custom && (
                                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                                      {count2}단어 연결됨
                                    </span>
                                  )}
                                </span>
                                {hasSem2Custom && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetTarget(sem2Key)}
                                    className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer"
                                  >
                                    2학기만 초기화
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-1.5">
                                <div className="relative flex-1">
                                  <input
                                    type="url"
                                    value={urls[sem2Key] || ''}
                                    onChange={(e) => handleUrlChange(sem2Key, e.target.value)}
                                    placeholder={subj.sem2Placeholder}
                                    disabled={isLoading || isSyncingSem2}
                                    className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-medium text-slate-800 bg-slate-50/60 focus:bg-white transition-all ${
                                      errorSem2 ? 'border-rose-400 bg-rose-50/30' : subj.borderColor
                                    }`}
                                  />
                                  {urls[sem2Key] && (
                                    <button
                                      type="button"
                                      onClick={() => handleUrlChange(sem2Key, '')}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSyncSingleKey(sem2Key)}
                                  disabled={isLoading || isSyncingSem2 || !urls[sem2Key]?.trim()}
                                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40 shrink-0"
                                  title="2학기만 동기화"
                                >
                                  <RefreshCw size={12} className={isSyncingSem2 ? 'animate-spin' : ''} />
                                  2학기 동기화
                                </button>
                              </div>
                              {errorSem2 && (
                                <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1 pl-1">
                                  <AlertCircle size={12} className="shrink-0" />
                                  <span>{errorSem2}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Unified Mode Input */
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-1 text-slate-700">
                                <span>🌟</span>
                                <span>1·2학기 통합 구글 시트 링크</span>
                                {hasUnifiedCustom && (
                                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                                    {countTotal}단어 연결됨
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <div className="relative flex-1">
                                <input
                                  type="url"
                                  value={urls[unifiedKey] || ''}
                                  onChange={(e) => handleUrlChange(unifiedKey, e.target.value)}
                                  placeholder={subj.unifiedPlaceholder}
                                  disabled={isLoading || isSyncingUnified}
                                  className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-medium text-slate-800 bg-slate-50/60 focus:bg-white transition-all ${
                                    errorUnified ? 'border-rose-400 bg-rose-50/30' : subj.borderColor
                                  }`}
                                />
                                {urls[unifiedKey] && (
                                  <button
                                    type="button"
                                    onClick={() => handleUrlChange(unifiedKey, '')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSyncSingleKey(unifiedKey)}
                                disabled={isLoading || isSyncingUnified || !urls[unifiedKey]?.trim()}
                                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40 shrink-0"
                                title="통합 시트 동기화"
                              >
                                <RefreshCw size={12} className={isSyncingUnified ? 'animate-spin' : ''} />
                                통합 동기화
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-1">
                              시트에 [학기] 열에 '1학기', '2학기'를 적어두시면 학기별로 자동 필터링됩니다.
                            </p>
                            {errorUnified && (
                              <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1 pl-1">
                                <AlertCircle size={12} className="shrink-0" />
                                <span>{errorUnified}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync All Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSyncAll()}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      구글 시트 동기화 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} />
                      모든 시트 한 번에 동기화하기
                    </>
                  )}
                </button>
              </div>

              {/* Checklist Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2 text-xs text-amber-900">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-800 text-sm">
                  <Info size={16} />
                  구글 시트 공유 권한 필수 안내
                </div>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 leading-relaxed font-medium">
                  <li>
                    각 구글 시트의 오른쪽 상단 <strong>[공유]</strong> 버튼을 클릭합니다.
                  </li>
                  <li>
                    일반 액세스를 <strong>'링크가 있는 모든 사용자'</strong>(역할: <strong>뷰어</strong>)로 변경한 뒤 <strong>[링크 복사]</strong>하여 붙여넣어 주세요.
                  </li>
                  <li>
                    아직 시트가 준비되지 않은 학기나 과목은 비워두셔도 <strong>기본 제공 어휘</strong>로 안전하게 출제됩니다!
                  </li>
                </ol>
              </div>
            </>
          ) : (
            /* Guide Tab */
            <div className="space-y-4 text-slate-800 text-xs leading-relaxed">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                <h3 className="font-extrabold text-sm text-emerald-900 flex items-center gap-1.5">
                  <FileSpreadsheet size={16} className="text-emerald-700" />
                  과목 및 학기별 구글 시트 작성법
                </h3>
                <p className="text-emerald-800 leading-relaxed">
                  <strong>과목/학기별로 시트를 분리하여 작성하실 때:</strong> 시트에 [과목]이나 [학기] 열을 굳이 넣지 않으셔도 해당 칸에 입력된 링크에 맞춰 자동으로 분류됩니다.<br />
                  <strong>하나의 시트에 1·2학기를 함께 넣으실 때:</strong> 맨 오른쪽에 <strong>[학기]</strong> 열을 만들고 '1학기' 또는 '2학기'를 적어주시면 됩니다.
                </p>
              </div>

              {/* Subject Tabs for sample preview */}
              <div className="flex gap-1.5 border-b border-slate-200 pb-2">
                {(['국어', '수학', '사회', '영어'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setGuideSubject(s);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      guideSubject === s
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s === '국어' && '📖 '}
                    {s === '수학' && '📐 '}
                    {s === '사회' && '🏛️ '}
                    {s === '영어' && '🔤 '}
                    {s} 샘플
                  </button>
                ))}
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">단어(낱말)</th>
                      <th className="p-2.5">뜻</th>
                      <th className="p-2.5">
                        {guideSubject === '영어' ? '발음기호 (선택)' : '한자 (선택)'}
                      </th>
                      <th className="p-2.5">예문</th>
                      <th className="p-2.5">학기 (선택)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {samplesBySubject[guideSubject].rows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-2 font-black text-slate-900">{row.word}</td>
                        <td className="p-2 text-slate-700">{row.meaning}</td>
                        <td className="p-2 text-slate-500 font-serif">{row.extra}</td>
                        <td className="p-2 text-slate-600">{row.example}</td>
                        <td className="p-2 text-emerald-700 font-bold">{row.semester}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Copy Template Button */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700">
                  [{guideSubject}] 구글 시트에 바로 붙여넣을 수 있는 표 데이터 복사
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyTsv(guideSubject)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedSubject === guideSubject ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSubject === guideSubject ? '복사 완료!' : '표 데이터 복사하기'}
                </button>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 text-xs leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles size={14} className="text-sky-600" />
                  <strong>학기별 게임 진행 안내</strong>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-sky-800">
                  <li>방을 만들 때 <strong>'1학기'</strong>를 고르면 1학기 어휘만, <strong>'2학기'</strong>를 고르면 2학기 어휘만 출제됩니다.</li>
                  <li><strong>'전체'</strong>를 고르면 1학기와 2학기 어휘가 골고루 섞여 통합 출제됩니다.</li>
                  <li>선생님 대기실의 [설정 변경] 버튼을 통해 게임 시작 전 언제든 학기나 과목을 바꿀 수 있습니다.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-medium">
            💡 구글 시트 공유 권한: '링크가 있는 모든 사용자(뷰어)'
          </span>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-sm transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
