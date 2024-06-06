echo Starting install
call npm install

cd ..
mkdir src-temp
xcopy /s assets\ src-temp\assets\
copy index.html src-temp\index.html
copy code.js src-temp\code.js
copy style.css src-temp\style.css

echo Starting build
cd tauri-build
call tauri build