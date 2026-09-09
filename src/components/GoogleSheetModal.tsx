import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Info,
  RotateCcw,
} from 'lucide-react';
import { SheetSyncStatus } from '../types';
import { playSound } from '../utils/audio';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetStatus: SheetSyncStatus | null;
  onSync: (sheetUrl: string) => Promise<void>;
  onReset: () => Promise<void>;
  isLoading: boolean;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  sheetStatus,
  onSync,
  onReset,
  isLoading,
}) => {
  const [urlInput, setUrlInput] = useState(sheetStatus?.sheetUrl || '');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SYNC' | 'GUIDE'>('SYNC');

  if (!isOpen) return null;

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setErrorMsg('구글 시트 링크를 입력해주세요.');
      return;
    }
    setErrorMsg(null);
    playSound('click');
    try {
      await onSync(urlInput.trim());
      playSound('victory');
    } catch (err: any) {
      setErrorMsg(err.message || '시트를 불러오는데 실패했습니다.');
      playSound('wrong');
    }
  };

  const handleResetClick = async () => {
    if (!confirm('기본 내장 단어장으로 되돌리시겠습니까?')) return;
    playSound('click');
    try {
      await onReset();
      setUrlInput('');
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || '초기화에 실패했습니다.');
    }
  };

  const sampleTsvData = `과목\t단어\t뜻\t한자\t예문
국어\t촉구\t어떤 일을 빨리 하도록 재촉함\t促求\t시민들이 대책 마련을 강력히 촉구했다.
수학\t분모\t분수에서 분수선 아래에 위치한 기준 수\t分母\t분모가 다른 분수는 통분한다.
사회\t헌법\t국가의 기본 원칙을 정한 최고의 법\t憲法\t헌법은 국민의 기본권을 보장한다.
영어\tdiscover\t발견하다, 알아내다\t[dɪˈskʌvər]\tScientists discover new planets.
영어\tcurious\t호기심이 많은, 궁금해하는\t[ˈkjʊəriəs]\tThe curious boy asked many questions.
영어\tenvironment\t환경, 자연환경\t[ɪnˈvaɪrənmənt]\tWe must protect our environment.`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(sampleTsvData);
    setCopiedTemplate(true);
    playSound('click');
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in break-keep">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-4 border-emerald-400 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
              📊
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">구글 시트 단어장 연동</h2>
              <p className="text-xs text-emerald-100 font-medium">
                선생님의 구글 시트 어휘 목록(국어·수학·사회·영어)을 실시간으로 퀴즈에 반영합니다
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
        <div className="flex border-b-2 border-slate-100 bg-slate-50 px-4 pt-3 gap-2">
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
            🔗 시트 링크 연결 & 동기화
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
            📖 양식 작성 안내 및 샘플
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'SYNC' ? (
            <>
              {/* Current Status Banner */}
              <div
                className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-3 ${
                  sheetStatus?.isCustomSheet
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-sky-50 border-sky-200 text-sky-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-black text-base">
                    {sheetStatus?.isCustomSheet ? (
                      <>
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <span>선생님 구글 시트 연동 중!</span>
                        <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          총 {sheetStatus.wordCount}개 단어
                        </span>
                      </>
                    ) : (
                      <>
                        <BookOpen size={18} className="text-sky-600" />
                        <span>기본 제공 단어장 사용 중</span>
                        <span className="text-xs bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                          총 {sheetStatus?.wordCount || 60}개 단어
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs opacity-80">
                    {sheetStatus?.lastSyncedAt
                      ? `최근 동기화: ${new Date(sheetStatus.lastSyncedAt).toLocaleTimeString('ko-KR')} (시트 수정 후 '동기화' 버튼만 누르면 바로 반영!)`
                      : '구글 시트 링크를 아래에 입력하면 우리반 맞춤 퀴즈로 바뀝니다.'}
                  </p>

                  {/* Subject Badges */}
                  {sheetStatus?.subjectCounts && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {Object.entries(sheetStatus.subjectCounts).map(([subj, count]) => (
                        <span
                          key={subj}
                          className="text-xs px-2.5 py-0.5 rounded-lg bg-white/80 border border-slate-200 font-bold text-slate-700 shadow-2xs"
                        >
                          {subj}: <strong className="text-emerald-600">{count}</strong>개
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {sheetStatus?.isCustomSheet && (
                  <button
                    onClick={handleResetClick}
                    className="shrink-0 p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="기본 단어장으로 복구"
                  >
                    <RotateCcw size={14} />
                    기본으로 초기화
                  </button>
                )}
              </div>

              {/* URL Input Form */}
              <form onSubmit={handleSyncSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                    구글 시트 공유 링크 (URL)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none text-sm font-medium text-slate-800 transition-colors pr-24"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          불러오는 중...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          동기화하기
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </form>

              {/* Quick Check Guide */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs text-amber-900">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                  <Info size={16} />
                  구글 시트 연결 필수 체크사항 (2단계)
                </div>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 leading-relaxed font-medium">
                  <li>
                    구글 시트 오른쪽 상단의 <strong>[공유]</strong> 버튼을 누릅니다.
                  </li>
                  <li>
                    일반 액세스를 <strong>'링크가 있는 모든 사용자'</strong>(역할: <strong>뷰어</strong>)로 변경한 후 <strong>[링크 복사]</strong>하여 위 입력창에 붙여넣어 주세요!
                  </li>
                </ol>
              </div>
            </>
          ) : (
            /* Guide / Sample Tab */
            <div className="space-y-4 text-slate-800 text-xs leading-relaxed">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                <h3 className="font-bold text-sm text-emerald-800">
                  📋 구글 시트 표 양식 (1행 머리글)
                </h3>
                <p className="text-emerald-700">
                  구글 시트 1행에 아래와 같이 5개의 열 이름을 적고, 2행부터 단어를 입력하시면 됩니다.
                </p>
              </div>

              {/* Sample Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">과목</th>
                      <th className="p-2.5">단어(낱말)</th>
                      <th className="p-2.5">뜻</th>
                      <th className="p-2.5">한자 / 발음기호</th>
                      <th className="p-2.5">예문</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-white">
                      <td className="p-2 font-bold text-sky-600">국어</td>
                      <td className="p-2 font-extrabold">촉구</td>
                      <td className="p-2">빨리 하도록 재촉함</td>
                      <td className="p-2 text-slate-500">促求</td>
                      <td className="p-2 text-slate-600">대책 마련을 촉구했다.</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2 font-bold text-amber-600">수학</td>
                      <td className="p-2 font-extrabold">분모</td>
                      <td className="p-2">분수선 아래 기준 수</td>
                      <td className="p-2 text-slate-500">分母</td>
                      <td className="p-2 text-slate-600">분모를 통분한다.</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2 font-bold text-emerald-600">사회</td>
                      <td className="p-2 font-extrabold">헌법</td>
                      <td className="p-2">국가 최고의 법</td>
                      <td className="p-2 text-slate-500">憲法</td>
                      <td className="p-2 text-slate-600">헌법을 준수한다.</td>
                    </tr>
                    <tr className="bg-indigo-50/40">
                      <td className="p-2 font-bold text-indigo-600">영어</td>
                      <td className="p-2 font-extrabold">discover</td>
                      <td className="p-2">발견하다, 알아내다</td>
                      <td className="p-2 text-slate-500">[dɪˈskʌvər]</td>
                      <td className="p-2 text-slate-600">discover new planets</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2 font-bold text-indigo-600">영어</td>
                      <td className="p-2 font-extrabold">curious</td>
                      <td className="p-2">호기심 많은</td>
                      <td className="p-2 text-slate-500">[ˈkjʊəriəs]</td>
                      <td className="p-2 text-slate-600">a curious student</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Copy template button */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700">
                  구글 시트에 바로 붙여넣을 수 있는 샘플 데이터 복사
                </span>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedTemplate ? <Check size={14} /> : <Copy size={14} />}
                  {copiedTemplate ? '복사 완료!' : '표 데이터 복사하기'}
                </button>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-800 text-xs">
                💡 <strong>영어 과목 안내:</strong> 영어 단어는 한자 열에 발음기호나 품사를 적으시거나 비워두셔도 됩니다. 퀴즈 생성 시 '단어 ➔ 우리말 뜻', '우리말 뜻 ➔ 영어 단어', '예문 빈칸 채우기' 문제로 자동 출제됩니다.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
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
