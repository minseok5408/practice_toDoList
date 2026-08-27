# MOMENT 설치 파일

버전별 설치 파일은 플랫폼 폴더 아래에 보관합니다.

- Android: `android/<version>/`
- iOS: `ios/<version>/`
- Android 버전 기록: `android/VERSION_HISTORY.md`
- iOS 버전 기록: `ios/VERSION_HISTORY.md`

## 1.0.4 (현재 Android 배포 버전)

- 설치 파일: `android/1.0.4/moment-1.0.4-android.apk`
- 설치 방식: APK 파일을 Android 기기로 전송한 뒤 파일을 열어 설치
- 별도 개발 앱, Expo Go, PC 연결 또는 서버 없이 APK만으로 실행 가능
- 최소 Android: Android 7.0 (API 24)
- 대상 SDK: API 36
- 지원 CPU: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`
- 실제 확인: Android 15(API 35) 새 설치, 최초 실행, 앱 내부 알림 안내,
  Android 시스템 권한 창, 권한 허용과 재실행 성공

기기에 따라 APK를 연 파일 앱 또는 브라우저에 대해 "알 수 없는 앱 설치" 권한을 한 번
허용해야 할 수 있습니다. 1.0.0~1.0.3과 같은 인증서로 서명되어 바로 업데이트할
수 있습니다. Android가 서명 충돌을 표시할 때만 기존 앱을 삭제한 뒤 설치하세요. 기존 앱을
삭제하면 해당 앱의 로컬 데이터도 함께 지워질 수 있습니다.

Android 13 이상에서는 최초 온보딩 뒤 알림 사용 이유를 안내합니다. `허용`을 누르면 이어서
표시되는 Android 시스템 알림 권한 창에서도 허용해야 마감 알림이 배너와 알림 목록에
표시됩니다.

## 배포 중단 버전

- Android 1.0.2: 토요일 날짜 선택 후 시간 창을 취소하면 선택 날짜가 저장되지 않는 문제
- Android 1.0.1: 시작 충돌 및 CPU 호환 범위 문제로 배포 중단
- Android 1.0.0: 설치 후 실행 문제로 배포 중단
- iOS: Apple 서명된 IPA가 아직 없어 설치 파일 배포 전

새 사용자와 기존 사용자 모두 Android 1.0.4 APK를 사용하세요.
