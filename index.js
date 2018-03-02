const { ipcMain, shell } = require('electron');
const readdir = require('recursive-readdir');
const Path = require('path');
const fs = require('fs');
const menubar = require('menubar');
const usbDetect = require('usb-detection');

const TRANSPORT_STATUS = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  STOPPED: 'STOPPED'
};

// midi spinup
const getInputs = require('./getInputs');
const writeMidi = require('./writeMidi');
let lastEventTime;
let eventLog = {};
let writeTimeout;
let transportStatus = TRANSPORT_STATUS.IDLE;
let recordingStartTime;

const resetTimeout = () => {
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }

  writeTimeout = setTimeout(() => {
    writeMidi(eventLog);
    eventLog = {};
    lastEventTime = null;
  }, 5000);
};

const refreshInputs = () => {
  const inputs = getInputs();
  const lastEvtTime = {};

  Object.keys(inputs).forEach((name) => {
    inputs[name].on('message', (deltaTime, message) => {
      if (transportStatus !== TRANSPORT_STATUS.RECORDING) {
        return;
      }
      resetTimeout();
      const now = new Date().getTime();
      if (!eventLog[name]) {
        eventLog[name] = [];
      }
      eventLog[name].push({
        deltaTime: lastEventTime ? (now - lastEventTime) * (480/1000) : 1,
        message
      });
      lastEventTime = now;
    });
  });
  console.log('current inputs:', Object.keys(inputs));
};

refreshInputs();
transportStatus = TRANSPORT_STATUS.RECORDING;
recordingStartTime = Date.now();

usbDetect.startMonitoring();
usbDetect.on('change', () => setTimeout(refreshInputs, 1500));

// electron spinup

const mb = menubar({
  icon: Path.join(__dirname, 'icons/menu.png'),
  index: Path.join('file://', __dirname, 'renderer/index.html'),
  width: 480,
  height: 402
});

mb.on('ready', () => {
  console.log('app is ready');
});

mb.on('show', () => {
  mb.tray.setImage(Path.join(__dirname, 'icons/menu-focus.png'));
});

mb.on('hide', () => {
  mb.tray.setImage(Path.join(__dirname, 'icons/menu.png'));
});

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

const getFiles = () => readdir('./output')
  .then((files) => files
    .filter((f) => Path.extname(f) === '.mid')
    .map((f) => Path.join(__dirname, f))
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
  });
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
    refreshInputs();
    recordingStartTime = Date.now();
    sendState(event.sender);
  });
  ipcMain.on('stop-recording', (event, arg) => {
    transportStatus = TRANSPORT_STATUS.STOPPED;
    sendState(event.sender);
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
  mb.app.quit();
  usbDetect.stopMonitoring();
});

