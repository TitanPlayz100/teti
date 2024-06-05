# Teti README

Finally a readme  
Hosted on github pages [here](https://titanplayz100.github.io/teti/)  
You can literally just open up [index.html](index.html) in a browser as well to play  
***
There are several builds within this project, which you can build yourself or download from the latest release

### Electron

To build
- copy files from /src into /Electron
- cd into /Electron directory
- `npm install`

If you want to build a portable
- `npm run make`

If you want to build an installer
- `npm run dist`

### Tauri

> You need rust installed  
> https://tauri.app/v1/guides/building/

To build
- cd into Tauri/teti directory
- `npm install`
- `npm run tauri build`

Can also run dev environment
- `npm run tauri dev`

