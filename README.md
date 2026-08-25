# Practice Todo

## 실행과 검사

```bash
pnpm install       # 의존성 설치
pnpm start         # Expo Go용 QR 코드 실행
pnpm start:dev     # 설치된 Development Build용 개발 서버 실행
pnpm check         # 타입·린트·테스트·포맷 통합 검사
pnpm expo:check    # Expo SDK 패키지 호환성 검사
pnpm test:e2e      # 연결된 기기에서 Maestro 회귀 테스트 실행
```

## Development Build

```bash
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest init
pnpm dlx eas-cli@latest build --platform android --profile development # Android 개발 앱
pnpm dlx eas-cli@latest build --platform ios --profile development     # iPhone 개발 앱
```

## 출시 빌드와 업로드

```bash
pnpm dlx eas-cli@latest build --platform android --profile preview     # 내부 테스트 APK
pnpm dlx eas-cli@latest build --platform all --profile production      # 스토어 설치 파일
pnpm dlx eas-cli@latest submit --platform android --profile production # Google Play 제출
pnpm dlx eas-cli@latest submit --platform ios --profile production     # App Store 제출
```

Sentry를 사용할 때는 `.env.example`을 참고해 공개 DSN만 로컬 환경에 두고, 인증 토큰은 EAS의 민감한 환경 변수로 등록합니다.
