import React, { useState } from 'react';
import { getGasUrl, setGasUrl, DEFAULT_GAS_URL } from '../services/gasApi';
import { X, Copy, Check, ExternalLink, HelpCircle, Server, Cloud, Code } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const GAS_BACKEND_CODE = `/**
 * 구글 스프레드시트 연동 백엔드 스크립트 (Code.gs)
 * - doGet: 프론트엔드에 전체 재고 목록 JSON 반환
 * - doPost: 프론트엔드에서 전달된 신규 로트 행 추가
 * - LockService 적용으로 다중 사용자 동시 등록 충돌 방지
 */

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    // 시트가 비어있는 경우
    if (data.length <= 1) {
      return createJsonResponse({ status: 'success', data: [] });
    }
    
    var headers = data[0]; // 헤더 행 (예: 품목명, 용량, 재질, 로트번호, 입고일자)
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue; // 품목명이 비어있으면 건너뜀
      
      var dateVal = row[4];
      var formattedDate = '';
      if (dateVal instanceof Date) {
        formattedDate = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        formattedDate = String(dateVal || '');
      }
      
      result.push({
        name: String(row[0] || '').trim(),
        capacity: String(row[1] || '').trim(),
        material: String(row[2] || '').trim(),
        lot: String(row[3] || '').trim(),
        date: formattedDate
      });
    }
    
    return createJsonResponse({ status: 'success', data: result });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  // 동시 접속 충돌 방지 (최대 10초 대기)
  try {
    lock.waitLock(10000);
  } catch (err) {
    return createJsonResponse({ status: 'error', message: '서버가 혼잡합니다. 잠시 후 다시 시도하세요.' });
  }
  
  try {
    var rawContent = e.postData ? e.postData.contents : '';
    if (!rawContent) {
      return createJsonResponse({ status: 'error', message: '전송된 데이터가 없습니다.' });
    }
    
    var payload = JSON.parse(rawContent);
    var name = String(payload.name || '').trim();
    var capacity = String(payload.capacity || '').trim();
    var material = String(payload.material || '').trim();
    var lot = String(payload.lot || '').trim().toUpperCase();
    var date = payload.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    if (!name || !lot) {
      return createJsonResponse({ status: 'error', message: '품목명과 로트번호는 필수입니다.' });
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 시트 첫 행이 없으면 헤더 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['품목명', '용량', '재질', '로트번호', '입고일자']);
    }
    
    // 새 행 추가
    sheet.appendRow([name, capacity, material, lot, date]);
    
    return createJsonResponse({
      status: 'success',
      message: '성공적으로 등록되었습니다.',
      data: { name: name, capacity: capacity, material: material, lot: lot, date: date }
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// CORS 응답 생성 헬퍼
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [urlInput, setUrlInput] = useState(getGasUrl());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'code' | 'guide'>('url');

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    setGasUrl(urlInput);
    onSaved();
    onClose();
  };

  const handleResetDefault = () => {
    setUrlInput(DEFAULT_GAS_URL);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GAS_BACKEND_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select textarea or silent handle
      console.warn('Clipboard write failed.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="font-black text-gray-900 text-lg">시스템 연동 설정</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'url' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
            }`}
          >
            웹앱 URL 설정
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'code' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
            }`}
          >
            GAS 백엔드 코드
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'guide' ? 'bg-white text-primary shadow-sm' : 'text-gray-600'
            }`}
          >
            배포 가이드
          </button>
        </div>

        {/* Tab 1: URL Config */}
        {activeTab === 'url' && (
          <div className="space-y-4 py-1 flex-1 overflow-y-auto">
            <div>
              <label className="block text-xs font-black text-gray-800 mb-1.5">
                구글 앱스 스크립트 웹앱 배포 URL (/exec)
              </label>
              <textarea
                rows={3}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full p-3 bg-gray-50 border-2 border-gray-300 rounded-2xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-gray-500 hover:text-gray-800 font-bold underline"
              >
                기본 URL로 복원
              </button>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1.5 font-bold">
              <div className="font-black flex items-center space-x-1 text-primary">
                <HelpCircle className="w-4 h-4" />
                <span>중요 설정 확인사항</span>
              </div>
              <p>
                GAS 배포 시 <strong>&quot;웹 앱에 액세스할 수 있는 사용자&quot;</strong>를 반드시{' '}
                <span className="underline font-black text-red-700">모든 사용자 (Anyone)</span>로 설정해야
                외부 프론트엔드(Cloudflare Pages 등)에서 CORS 차단 없이 스프레드시트를 조회/수정할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveUrl}
              className="w-full py-3.5 bg-primary hover:bg-primaryDark text-white font-black rounded-2xl text-sm shadow transition-all active:scale-[0.99]"
            >
              설정 저장 및 동기화
            </button>
          </div>
        )}

        {/* Tab 2: Backend Code.gs Snippet */}
        {activeTab === 'code' && (
          <div className="space-y-3 py-1 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-gray-700">
                구글 시트 &gt; 확장 프로그램 &gt; Apps Script에 붙여넣을 코드
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-black hover:bg-gray-800 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span>복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>코드 복사</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 bg-gray-900 text-gray-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
              <code>{GAS_BACKEND_CODE}</code>
            </pre>
          </div>
        )}

        {/* Tab 3: Deployment Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-3.5 py-1 flex-1 overflow-y-auto text-xs font-bold text-gray-700 leading-relaxed">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
              <div className="font-black text-gray-900 flex items-center space-x-1.5 text-sm">
                <Cloud className="w-4 h-4 text-primary" />
                <span>Cloudflare Pages 배포 방법 (3단계)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-gray-600 font-bold pl-1">
                <li>
                  현재 리액트 프로젝트를 본인의 <strong>GitHub Repository</strong>에 푸시합니다.
                </li>
                <li>
                  <strong>Cloudflare 대시보드</strong> &gt; Workers &amp; Pages &gt; Create application &gt; Pages &gt; Connect to Git 선택
                </li>
                <li>
                  빌드 설정 입력:
                  <div className="ml-4 mt-1 bg-white p-2 rounded-xl border border-gray-200 font-mono text-[11px]">
                    <div>프레임워크 프리셋: <strong>Vite</strong></div>
                    <div>빌드 명령어: <code>npm run build</code></div>
                    <div>출력 디렉터리: <code>dist</code></div>
                  </div>
                </li>
              </ol>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
              <div className="font-black text-gray-900 text-sm">스마트폰 앱(PWA)처럼 설치하기</div>
              <p className="text-gray-600">
                Cloudflare Pages 배포 후 생성된 URL을 스마트폰(사파리/크롬)으로 열고, 브라우저 메뉴에서{' '}
                <strong>[홈 화면에 추가]</strong>를 누르면 전체 화면으로 앱처럼 실행할 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Footer Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-2xl text-xs transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
