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
};

refreshInputs();