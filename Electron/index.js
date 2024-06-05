const { app, BrowserWindow } = require('electron');

const createWindow = () => {
    const win = new BrowserWindow({ 
        show: false,
        icon: 'assets/titanicon.ico',
     });
    win.maximize();
    win.show();

    win.setMenuBarVisibility(false);

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})