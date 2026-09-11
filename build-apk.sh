#!/bin/bash
echo "Building React UI..."
npm run build

echo "Syncing with Android..."
npx cap sync android

echo "Compiling APK..."
cd android
./gradlew assembleRelease
cd ..

echo "Signing APK with your persistent key..."
apksigner sign --ks sovereign-key.jks --ks-pass pass:sovereign2026 --out Sovereign-Video-Editor.apk android/app/build/outputs/apk/release/app-release-unsigned.apk

echo "Done! Sovereign-Video-Editor.apk is ready to install."
