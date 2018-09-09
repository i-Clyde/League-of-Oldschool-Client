const {app, BrowserWindow} = require('electron');
const {autoUpdater} = require("electron-updater");
 app.on('ready', function()  {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  }

  dialog.showMessageBox(dialogOpts, (response) => {
    if (response === 0) autoUpdater.quitAndInstall()
  })
})

var win = null;

var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

if (shouldQuit) {
  app.quit();
  return;
}


/////////////////
// Resoultions //
// 1. 1024x576 //
// 2. 1280x720 //
// 3. 1600x900 //
/////////////////

app.on('ready',() => {
  createWindow('./components/index.html')
})

function createWindow (path, nn = null) {
  // Create the browser window.

  win = new BrowserWindow({
    width: 1024,
    height: 576,
    frame: false,
    transparent: true,
    hasShadow: true,
    center: true,
    setMaximizable: false,
    setFullScreenable: false,
    resizable: false,
    fullscreen: false,
    'auto-hide-menu-bar': true,
    'use-content-size': true,
    icon: __dirname + '/icon.png',
    webPreferences: {
      experimentalFeatures: true
    }
  })

  win.setFullScreenable(false);win.setMaximizable(false); win.isResizable(false);

  // i ładowanie index.html aplikacji.
  win.loadFile(path)

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
