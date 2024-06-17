# Teti README

Finally a readme  
Hosted on github pages [here](https://titanplayz100.github.io/teti/)  
You can literally just open up [src/index.html](src/index.html) in a browser as well to play 

## Build With Tauri
Build this yourself or download the installer from the latest release

> You need rust installed  
> https://tauri.app/v1/guides/building/

- open **tauri** directory
- `npm run build` or run build.bat to build
- `npm run dev` to run as dev

Creates an exe at **/target/release/teti.exe**  

## Build With Neutralino

- open Neutralino directory
- `neu build` to build
- `neu run` to run as dev

Creates an exe and related files at **/dist/myapp/myapp-win_x64 and resources.neu**

To create exe with icon use build-win.sh and follow instructions for installation

## Build With Electron

- open electron folder
- `npm run dist`
- `npm run start` for dev

Creates an installer in **dist/teti Setup 1.0.0.exe**

Installer will create app and desktop shortcut