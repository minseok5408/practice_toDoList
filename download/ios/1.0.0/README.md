# MOMENT iOS 1.0.0

서명된 IPA는 아직 생성되지 않았습니다.

iOS 설치 파일은 macOS의 Xcode 또는 원격 iOS 빌드 서비스에서 Apple 서명 인증서와
프로비저닝 프로파일로 서명해야 합니다. 현재 Windows 환경에는 Xcode가 없고 Expo
계정에도 로그인되어 있지 않아, 설치 가능한 IPA를 임의로 만들 수 없습니다.

직접 전달할 IPA를 생성하려면 Apple Developer 계정과 설치 대상 기기 등록이 필요합니다.
인증 준비 후 프로젝트 루트에서 아래 명령으로 내부 배포 빌드를 만들 수 있습니다.

```sh
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest build --platform ios --profile preview
```

빌드에서 받은 `.ipa`를 이 폴더에 `moment-1.0.0-ios.ipa`라는 이름으로 보관합니다.
등록되지 않은 일반 iPhone에는 IPA 파일만 보내 설치할 수 없으므로, 다수 사용자에게
배포할 때는 TestFlight 방식이 더 적합합니다.
