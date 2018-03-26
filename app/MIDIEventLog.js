const writeMIDI = require('./writeMIDI');

class MIDIEventLog {
  constructor(midiDir, tempo, writeTimeout) {
    this.midiDir = midiDir;
    this.writeTimeout = writeTimeout;
    this.eventLog = {};
    this.setTempo(tempo);
  }
  setTempo(tempo) {
    this.tempo = tempo;
    this.ticksPerBeat = 480;
    this.beatsPerSecond = tempo / 60;
    this.ticksPerSecond = this.ticksPerBeat * this.beatsPerSecond;
    this.writeAndFlush();
  }
  writeAndFlush() {
    this.lastEventTime = null;
    if (Object.keys(this.eventLog).length > 0) {
      writeMIDI(this.midiDir, this.tempo, this.eventLog, this.ticksPerBeat);
    }
    this.eventLog = {}
  }
  receiveEvent({name, message}) {
    const now = new Date().getTime();
    if (!this.eventLog[name]) this.eventLog[name] = [];
    this.eventLog[name].push({
      deltaTime: !!this.lastEventTime
        ? (now - this.lastEventTime) * (this.ticksPerSecond/1000)
        : 0,
      message
    });
    this.lastEventTime = now;
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.writeAndFlush(), this.writeTimeout);
  }
}

module.exports = MIDIEventLog;