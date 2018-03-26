const fs = require('fs');
const path = require('path');
const { encode } = require('./json-midi-encoder-hax/module');
const parseMidiEvent = require('./parseMidiEvent');

const hasNoteEvent = (events) => {
  let found = false;
  events.forEach((e) => {
    if (e.message[0] >= 0x80 && e.message[0] <= 0x9F) {
      found = true;
    }
  });
  return found;
}

module.exports = (midiDir, tempo, eventLog, ticksPerBeat) => {
  Object.keys(eventLog).forEach((name) => {
    const events = [];

    if (eventLog[name].length === 0 || !hasNoteEvent(eventLog[name])) {
      return;
    }

    console.log(eventLog[name]);

    let lastEvent = null;
    eventLog[name].forEach((e) => {
      // skip unwriteable midi events

      const result = parseMidiEvent(e.message, 0, lastEvent);
      events.push({
        delta: Math.round(e.deltaTime),
        channel: 0,
        ...result.event
      });
      lastEvent = result.event;
    });
    const output = {
      division: ticksPerBeat,
      format: 0,
      tracks: [
        [
          {
              delta: 0,
              trackName: name
          },
          {
            timeSignature:{
              denominator: 4,
              metronome: 36,
              numerator: 4,
              thirtyseconds: 8
            },
            delta:0
          },
          ...events,
          {delta: 0, endOfTrack: true}
        ]
      ]
    };
    const outputFile = path.join(midiDir, `${name}_${new Date().getTime()}_${tempo}bpm.mid`);
    fs.writeFileSync(outputFile, Buffer.from(encode(output)));
    console.log('wrote file to', outputFile);
  });
};