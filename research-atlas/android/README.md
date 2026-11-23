# Research Atlas on Android

**Atlas Check** opens the existing Research Atlas web app in an Android browser using Android Browser Helper. The temporary application ID is `com.researchatlas.devicecheck`. This identity is for device testing. The web release follows the [existing site](https://rishadamin001.github.io/research-tracker-app/).

## Build on a fresh checkout

Use JDK 17, SDK Platform 36, Build Tools 36.0.0, and Platform Tools. Install the SDK packages and review their licenses in Android Studio. In this directory, set `JAVA_HOME` to the JDK and `ANDROID_HOME` to the SDK for the current shell. Maven Central and Google's Maven repository supply the dependencies. The wrapper verifies the Gradle distribution checksum. [Android Gradle Plugin compatibility](https://developer.android.com/build/releases/agp-8-10-0-release-notes) · [Gradle Java compatibility](https://docs.gradle.org/current/userguide/compatibility.html)

```powershell
.\gradlew.bat :app:assembleDebug :app:bundleRelease
```

On macOS or Linux run `sh ./gradlew :app:assembleDebug :app:bundleRelease`. The first build downloads Gradle 8.11.1. The app uses Android Gradle Plugin 8.10.1, Android Browser Helper 2.7.4, minimum SDK 24 as required by that library, and target SDK 36. Build outputs are local.

| Output | Purpose |
| --- | --- |
| `app/build/outputs/apk/debug/app-debug.apk` | Debug-signed device test |
| `app/build/outputs/bundle/release/app-release.aab` | Unsigned bundle for inspecting the packaging |

## Install on a test device

Enable USB debugging on the phone, connect it, and accept the computer's fingerprint on the phone. Use a current browser that supports Custom Tabs. Select the intended device from `adb devices -l`. Each command below uses its serial. The `-r` option keeps the installed test app's data when the signing identity matches. If installation reports a signature mismatch, preserve the existing profile and use another test device.

```powershell
$adb = Join-Path $env:ANDROID_HOME 'platform-tools/adb.exe'
& $adb devices -l
$serial = Read-Host 'Test device serial'
& $adb -s $serial install -r app/build/outputs/apk/debug/app-debug.apk
& $adb -s $serial shell am start -W -n com.researchatlas.devicecheck/.LauncherActivity
& $adb -s $serial shell pm get-app-links com.researchatlas.devicecheck
```

The last command works on Android 12 and newer. Browser choice and profile determine which local projects appear. Another phone or browser can import an exported backup. Use synthetic data and retain the original export through verification.

## Confirm the Android experience

1. Record the APK hash, device or emulator model, Android version, browser and web release. Launch from the icon, open a section, use the Android Back gesture, switch apps, and return.
2. Create a project titled **Synthetic device test**, edit its question with the software keyboard, rotate the device and verify that the save action remains reachable. Close and reopen the app and inspect the saved question.
3. Search for papers, load another page, save a paper, screen it and write a test finding with its locator. Keep interpretation in its own field. Open the scholarly source and return to the project.
4. Export DOCX, RIS and BibTeX. Open the downloads and check the draft and reference fields. Download an encrypted backup. Use the system file picker to verify it, then import it into a fresh browser profile or separate device. Compare the recovered project with the original.
5. After an online launch, disable connectivity on the test device, reopen the cached workspace and inspect the saved project. Restore connectivity, test large text and TalkBack, and record any crashes or obstructed controls.

## Domain verification and Play decisions

The browser can display a toolbar until the site's HTTPS origin serves the matching package and public SHA-256 signing fingerprint at `/.well-known/assetlinks.json`. The project's `/research-tracker-app/` deployment only controls its own path. Run `node scripts/check-android-web-prerequisites.mjs https://rishadamin001.github.io/research-tracker-app/` from the web app directory. [Android association requirements](https://developer.android.com/training/app-links/configure-assetlinks)

For a Play candidate, the owner selects a permanent package ID and approves the origin, upload key, Play App Signing, data disclosures, tester plan and distribution. The app-signing certificate used for installed Play builds belongs in the production association. Keep signing material in private storage. The test app's debug certificate is specific to the machine that generated it. [Play readiness and listing checklist](../docs/PLAY-READINESS.md)
