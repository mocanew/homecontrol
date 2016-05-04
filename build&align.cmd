cd AppHomeControll
call cordova build android --release
cd ..
"F:\3D\ADT Bundle\sdk\build-tools\23.0.1\zipalign.exe" -f 4 "AppHomeControll\platforms\android\build\outputs\apk\android-release-unsigned.apk" radiopi.apk
