const getInputs = require('./getInputs');

class MIDIListener {
  constructor(callback) {
    this.callback = callback;
    this.enableRecording();
    this.updateInputs();
  }

  updateInputs() {
    getInputs().forEach(({input, name}) => {
      input.on('message', (deltaTime, message) => {
        if (!this.recordingEnabled) return;
        if (
          (message[0] >= 0xD0 && message[0] <= 0xDF) // monophonic aftertouch (TODO)
          ||
          (message[0] >= 0xA0 && message[0] <= 0xAF) // polyphonic aftertouch (TODO)
          ||
          (message[0] >= 0xB0 && message[0] <= 0xBF) // control mode changes (leave these out)
          ||
          (message[0] >= 0xF0) // system messages (leave these out)
        ) {
          return;
        }
        this.callback({
          name,
          message
        });
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