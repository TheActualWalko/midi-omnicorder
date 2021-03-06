const { ipcMain, shell, app, systemPreferences } = require('electron');
const readdir = require('recursive-readdir');
const Path = require('path');
const fs = require('fs');
const menubar = require('menubar');
const usbDetect = require('usb-detection');
const MIDIListener = require('./MIDIListener');
const MIDIEventLog = require('./MIDIEventLog');

const mb = menubar({
  icon: Path.join(__dirname, systemPreferences.isDarkMode() ? 'icons/menu-on-dark.png' : 'icons/menu.png'),
  index: Path.join('file://', __dirname, 'renderer/index.html'),
  width: 480,
  height: 435,
  preloadWindow: true
});

const MIDI_DIR = Path.join(mb.app.getPath('documents'), 'MIDICatch Recordings');
const TEMPO_BPM = 120;
const WRITE_TIMEOUT_MS = 5000;

if (!fs.existsSync(MIDI_DIR)) {
  fs.mkdirSync(MIDI_DIR);
}

const midiEventLog = new MIDIEventLog(MIDI_DIR, TEMPO_BPM, WRITE_TIMEOUT_MS);
const midiListener = new MIDIListener((event) => midiEventLog.receiveEvent(event));

usbDetect.startMonitoring();
usbDetect.on('add', () => setTimeout(() => midiListener.updateInputs(), 1500));
usbDetect.on('remove', () => setTimeout(() => midiListener.updateInputs(), 1500));

const TRANSPORT_STATUS = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  STOPPED: 'STOPPED'
};
transportStatus = TRANSPORT_STATUS.RECORDING;
recordingStartTime = Date.now();



mb.on('show', () => {
  mb.tray.setImage(Path.join(__dirname, 'icons/menu-focus.png'));
  midiEventLog.writeAndFlush();
});
mb.on('hide', () => mb.tray.setImage(Path.join(__dirname, systemPreferences.isDarkMode() ? 'icons/menu-on-dark.png' : 'icons/menu.png')));

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

const getFiles = () => readdir(MIDI_DIR)
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
      tempo: midiEventLog.tempo,
      transportStatus,
      recordingStartTime,
      files
    });
  })
  .catch(e => console.error(e));
}

mb.on('after-create-window', () => {
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
  ipcMain.on('ondragstart', (event, path) => {
    event.sender.startDrag({
      file: path,
      icon: Path.join(__dirname, 'icons/midi.png')
    })
  });
  ipcMain.on('set-tempo', (event, arg) => {
    midiEventLog.setTempo(arg);
  });
  ipcMain.on('hide-window', (event, arg) => {
    mb.hideWindow();
  })
  ipcMain.on('quit', (event, arg) => {
    mb.app.quit();
    usbDetect.stopMonitoring();
    process.exitCode = 0;
    clearInterval(stateInterval);
  });
  ipcMain.on('open-midi-folder', (event, arg) => {
    shell.openItem(MIDI_DIR)
  });
});

process.on('exit', () => {
  usbDetect.stopMonitoring();
  mb.app.quit();
});

