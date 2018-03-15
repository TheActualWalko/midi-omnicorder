const { ipcMain, shell } = require('electron');
const readdir = require('recursive-readdir');
const Path = require('path');
const fs = require('fs');
const menubar = require('menubar');
const usbDetect = require('usb-detection');
const MIDIListener = require('./MIDIListener');
const MIDIEventLog = require('./MIDIEventLog');

const midiEventLog = new MIDIEventLog(5000);
const midiListener = new MIDIListener((event) => midiEventLog.receiveEvent(event));

usbDetect.startMonitoring();
usbDetect.on('add', () => setTimeout(() => midiListener.updateInputs(), 1500));
usbDetect.on('remove', () => setTimeout(() => midiListener.updateInputs(), 1500));

// electron spinup
const TRANSPORT_STATUS = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  STOPPED: 'STOPPED'
};
transportStatus = TRANSPORT_STATUS.RECORDING;
recordingStartTime = Date.now();


const mb = menubar({
  icon: Path.join(__dirname, 'icons/menu.png'),
  index: Path.join('file://', __dirname, 'renderer/index.html'),
  width: 480,
  height: 402,
  preloadWindow: true
});

mb.on('show', () => mb.tray.setImage(Path.join(__dirname, 'icons/menu-focus.png')));
mb.on('hide', () => mb.tray.setImage(Path.join(__dirname, 'icons/menu.png')));

const sortFiles = (a, b) => {
  if (a.dateCreated < b.dateCreated) {
    return 1;
  } else if (a.dateCreated > b.dateCreated) {
    return -1;
  } else if (a.path < b.path) {
    return 1;
  } else if (a.path > b.path) {
    return -1;
  } else {
    return 0;
  }
}

const getFiles = () => readdir(Path.join(__dirname, 'output'))
  .then((files) => files
    .filter((f) => Path.extname(f) === '.mid')
    .map((fullPath) => ({
      filename: Path.basename(fullPath),
      path: fullPath,
      dateCreated: fs.statSync(fullPath).birthtime
    }))
    .sort(sortFiles)
    .slice(0, 13)
  );

const sendState = (sender) => {
  getFiles().then((files) => {
    sender.send('state', {
      transportStatus,
      recordingStartTime,
      files
    });
  })
  .catch(e => console.error(e));
}

mb.on('after-create-window', () => {
  // mb.window.openDevTools();
  let stateInterval;
  ipcMain.on('initialize', (event, arg) => {
    sendState(event.sender);
    stateInterval = setInterval(() => sendState(event.sender), 500);
  });
  ipcMain.on('start-recording', (event, arg) => {
    transportStatus = TRANSPORT_STATUS.RECORDING;
    midiListener.enableRecording();
    midiListener.updateInputs();
    recordingStartTime = Date.now();
  });
  ipcMain.on('stop-recording', (event, arg) => {
    transportStatus = TRANSPORT_STATUS.STOPPED;
    midiListener.disableRecording();
  });
  ipcMain.on('ondragstart', (event, arg) => {
    ipcMain.on('ondragstart', (event, path) => {
      event.sender.startDrag({
        file: path,
        icon: Path.join(__dirname, 'icons/midi.png')
      })
    })
  });
  ipcMain.on('quit', (event, arg) => {
    mb.app.quit();
    usbDetect.stopMonitoring();
    process.exitCode = 0;
    clearInterval(stateInterval);
  });
  ipcMain.on('open-midi-folder', (event, arg) => {
    shell.openItem(Path.join(__dirname, 'output'))
  });
});

process.on('exit', () => {
  usbDetect.stopMonitoring();
  mb.app.quit();
});

