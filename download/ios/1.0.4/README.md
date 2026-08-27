# MOMENT iOS 1.0.4

## 결과

- 앱 버전 설정: 성공 (`1.0.4`, build 5)
- 앱 내부 알림 권한 사전 안내 코드 반영: 성공
- IPA 생성: 실패/미완료
- Apple 서명: 미실행
- 실제 iPhone 설치와 알림 검증: 미실행

## 실패 원인

현재 빌드 환경이 Windows이며, 설치 가능한 iOS IPA에 필요한 macOS/Xcode와 Apple Developer
배포 인증서 및 프로비저닝 프로파일이 없습니다. 서명되지 않았거나 실제 설치를 검증하지 않은
IPA는 제공하지 않습니다.

## 개선 방향

macOS/Xcode 또는 EAS iOS 원격 빌드 환경과 Apple 서명을 준비한 뒤 실제 iPhone에서 알림
사전 안내, Apple 시스템 권한 창, 배너 표시와 앱 재실행을 검증합니다. 성공한 경우
`moment-1.0.4-ios.ipa`와 SHA-256을 이 폴더에 기록합니다.
