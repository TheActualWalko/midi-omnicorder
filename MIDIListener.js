const getInputs = require('./getInputs');

class MIDIListener {
  constructor(callback) {
    this.callback = callback;
    this.enableRecording();
    this.updateInputs();
  }

  updateInputs() {
    const lastEvtTime = {};

    getInputs().forEach(({input, name}) => {
      input.on('message', (deltaTime, message) => {
        if (!this.recordingEnabled) return;
        const now = new Date().getTime();
        this.callback({
          name,
          deltaTime: !!this.lastEventTime
            ? (now - this.lastEventTime) * (480/1000)
            : 0,
          message
        });
        this.lastEventTime = now;
      });
    });
  }

  enableRecording() {
    this.recordingEnabled = true;
  }

  disableRecording() {
    this.recordingEnabled = false;
  }

}

module.exports = MIDIListener;