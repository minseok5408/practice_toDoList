import { resolveLanguage } from './i18n';

describe('resolveLanguage', () => {
  it('직접 선택한 언어는 시스템 설정보다 우선한다', () => {
    expect(resolveLanguage('ko', ['en-US'])).toBe('ko');
    expect(resolveLanguage('en', ['ko-KR'])).toBe('en');
  });

  it('시스템의 첫 번째 지원 언어를 사용한다', () => {
    expect(resolveLanguage('system', ['ko-KR', 'en-US'])).toBe('ko');
    expect(resolveLanguage('system', ['ja-JP', 'en-US'])).toBe('en');
  });

  it('지원 언어를 감지하지 못하면 한국어를 기본값으로 사용한다', () => {
    expect(resolveLanguage('system', ['ja-JP'])).toBe('ko');
    expect(resolveLanguage('system')).toBe('ko');
  });
});
