console.log(process.versions);

// midi spinup

const usbDetect = require('usb-detection');
const getInputs = require('./getInputs');
const writeMidi = require('./writeMidi');
let lastEventTime;
let eventLog = {};
let oldInputs;

let writeTimeout;

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

  if (oldInputs) {
    Object.keys(oldInputs).forEach((name) => {
      oldInputs[name].closePort();
    });
  }

  oldInputs = inputs;
  console.log('current inputs:', Object.keys(inputs));
};

refreshInputs();

usbDetect.startMonitoring();
usbDetect.on('change', () => setTimeout(refreshInputs, 1500));


// electron spinup

const { ipcMain } = require('electron');
const Path = require('path');
const menubar = require('menubar');

const mb = menubar({
  icon: Path.join(__dirname, '/Icon.png'),
  index: Path.join('file://', __dirname, 'index.html'),
  width: 480,
  height: 402
});

mb.on('ready', () => {
  console.log('app is ready');
});

mb.on('show', () => {
  mb.tray.setImage(`${process.cwd()}/Icon-Focus.png`);
});

mb.on('hide', () => {
  mb.tray.setImage(`${process.cwd()}/Icon.png`);
});

mb.on('after-create-window', () => {
  ipcMain.on('update', (event, arg) => {
    event.sender.send('state', {
      files: [1,2,3,4,5]
    });
  });
});