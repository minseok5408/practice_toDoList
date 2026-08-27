# MOMENT Android 1.0.4

## 결과

- Release APK 빌드: 성공
- APK v2 서명: 성공
- Android 15(API 35) 새 설치와 최초 실행: 성공
- 최초 메인 화면 알림 안내: 성공
- Android 시스템 알림 권한 창: 성공
- 권한 허용 뒤 `POST_NOTIFICATIONS: granted=true`: 성공
- 강제 종료 뒤 재실행: 성공
- crash 버퍼: 비어 있음

## 설치

1. `moment-1.0.4-android.apk`를 Android 기기로 전송합니다.
2. 기기에서 APK 파일을 열고 설치합니다.
3. 필요하면 APK를 연 파일 앱이나 브라우저에 `알 수 없는 앱 설치`를 허용합니다.
4. 최초 온보딩 뒤 알림 안내에서 `허용`을 누릅니다.
5. 이어서 표시되는 Android 시스템 알림 권한 창에서도 허용합니다.

APK만으로 실행되며 Expo Go, 개발 서버, PC 연결은 필요하지 않습니다. 기존 1.0.0~1.0.3과
같은 인증서로 서명되어 기존 앱 위에 업데이트할 수 있습니다.

## 호환성과 무결성

- 패키지: `com.minseok5408.practicetodo`
- 버전: `1.0.4` (`versionCode` 5)
- 최소 Android: Android 7.0 (API 24)
- 대상 SDK: API 36
- CPU: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`
- 파일 크기: 73,341,554 bytes
- SHA-256: `3E70151FCCBE4C1C3ACE1E7D1C50571320B4EB9434BECC0AC4AD629A52C4883E`
- 서명 인증서 SHA-256: `FAC61745DC0903786FB9EDE62A962B399F7348F0BB6F899B8332667591033B9C`

알림을 거부했거나 `나중에`를 선택했다면 기기의 `설정 > 앱 > Practice Todo > 알림`에서
직접 허용할 수 있습니다.
