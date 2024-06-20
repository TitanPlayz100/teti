echo Starting install
call npm install

cd ..
mkdir src-temp
xcopy /s /y assets\ src-temp\assets\
copy /y index.html src-temp\index.html
copy /y code.js src-temp\code.js
copy /y style.css src-temp\style.css

echo Starting build
cd tauri-build
call npm run tauri build