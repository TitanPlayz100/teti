call npm install

cd ..
mkdir src
xcopy assets\ src-temp\assets\
copy index.html src-temp\index.html
copy code.js src-temp\code.js
copy style.css src-temp\style.css

cd tauri-build
call tauri build

cd ..