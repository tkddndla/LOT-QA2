const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자열에서 초성을 추출합니다.
 */
export function getChosung(str: string): string {
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) {
      res += CHO[Math.floor(code / 588)];
    } else {
      res += str.charAt(i);
    }
  }
  return res;
}

/**
 * 타겟 문자열에 검색어(일반 텍스트 또는 한글 초성)가 매칭되는지 확인합니다.
 * 띄어쓰기로 분리된 다중 검색어도 모두 만족하도록 처리합니다.
 */
export function matchQuery(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  const qTerms = query.toLowerCase().trim().split(/\s+/);
  const t = target.toLowerCase();
  const tCho = getChosung(target);

  return qTerms.every(term => {
    return t.includes(term) || tCho.includes(term);
  });
}
