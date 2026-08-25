# 출시 운영 가이드

## 버전과 빌드 번호

- 사용자 기능·호환성 버전은 `app.json`의 `expo.version`에 SemVer 형식으로 기록합니다.
- Production의 iOS `buildNumber`와 Android `versionCode`는 EAS의 원격 버전과 `autoIncrement`로 관리합니다.
- `patch`는 버그 수정, `minor`는 하위 호환 기능, `major`는 데이터·동작의 큰 변경에 사용합니다.
- 저장 스키마 변경은 앱 버전과 별개로 마이그레이션 함수와 단위 테스트를 먼저 추가합니다.

## 환경과 오류 추적

```bash
pnpm dlx eas-cli@latest env:create --name EXPO_PUBLIC_SENTRY_DSN --value "..." --environment production --visibility plaintext
pnpm dlx eas-cli@latest env:create --name SENTRY_AUTH_TOKEN --value "..." --environment production --visibility sensitive
pnpm dlx eas-cli@latest env:create --name SENTRY_ORG --value "..." --environment production --visibility plaintext
pnpm dlx eas-cli@latest env:create --name SENTRY_PROJECT --value "..." --environment production --visibility plaintext
```

할 일 제목·메모·백업 본문은 오류 보고서에 넣지 않습니다. Production 빌드 후 Sentry에 난독화되지 않은 스택과 앱 버전이 표시되는지 테스트 오류로 한 번 검증합니다.

## TestFlight

1. Apple Developer와 App Store Connect에서 Bundle Identifier를 등록합니다.
2. `eas init` 후 Production iOS 빌드를 만듭니다.
3. `eas submit --platform ios --profile production`으로 업로드합니다.
4. 수출 규정·개인정보 항목·테스트 정보를 입력하고 내부 테스터에게 배포합니다.
5. [실기기 회귀 테스트](./REGRESSION_CHECKLIST.md)를 모두 통과한 빌드만 외부 테스트로 올립니다.

## Google Play 내부 테스트

1. Play Console에서 앱과 `com.minseok5408.practicetodo` 패키지를 등록합니다.
2. Production Android App Bundle을 만들고 내부 테스트 트랙에 업로드합니다.
3. 데이터 보안, 콘텐츠 등급, 광고 여부와 개인정보 처리방침 URL을 입력합니다.
4. 테스터 목록을 등록하고 설치 링크로 회귀 테스트를 수행합니다.

## 스크린샷 촬영 목록

- iPhone: 할 일 홈, 상세 편집, 다크 모드, 프로젝트·검색, 기록·백업
- iPad: 홈 목록과 상세 편집 화면
- Android 휴대폰: 동일한 핵심 5장
- 태블릿 지원을 Play에 노출한다면 Android 태블릿 화면 추가
- 실제 앱 화면만 사용하고 테스트용 개인정보·알림·기기 상태바 내용을 제거합니다.

## 출시 전 확인

- [ ] 앱 이름과 패키지명·Bundle Identifier 사용 가능 여부 확인
- [ ] Development Build와 Preview 설치 성공
- [ ] `pnpm check` 및 GitHub Actions 성공
- [ ] `pnpm exec expo install --check` 성공
- [ ] Sentry 이벤트와 소스맵 확인
- [ ] 개인정보 처리방침 공개 URL 준비
- [ ] 스토어 설명·키워드·스크린샷 등록
- [ ] TestFlight·Google Play 내부 테스트 회귀 테스트 통과
- [ ] 서명 인증서와 복구 권한을 안전한 계정에 보관

## 장애와 롤백

- 심각한 데이터 손상이나 시작 실패가 있으면 새 배포를 중지하고 해당 빌드를 스토어에서 단계적으로 제외합니다.
- JavaScript 수정만으로 안전하게 해결 가능하고 네이티브 런타임이 호환될 때만 OTA 업데이트를 사용합니다.
- 저장 스키마는 이전 원본을 보존하고 역방향 데이터 손실을 유발하는 롤백을 금지합니다.
