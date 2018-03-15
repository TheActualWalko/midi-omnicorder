const fs = require('fs');
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

module.exports = (eventLog, ticksPerBeat) => {
  Object.keys(eventLog).forEach((name) => {
    const events = [];
    const filtered = eventLog[name].filter((e) => {
      if (
        (e.message[0] >= 0xD0 && e.message[0] <= 0xDF) // monophonic aftertouch (TODO)
        ||
        (e.message[0] >= 0xA0 && e.message[0] <= 0xAF) // polyphonic aftertouch (TODO)
        ||
        (e.message[0] >= 0xB0 && e.message[0] <= 0xBF) // control mode changes (leave these out)
        ||
        (e.message[0] >= 0xF0) // system messages (leave these out)
      ) {
        return false;
      } else {
        return true;
      }
    });

    if (filtered.length === 0 || !hasNoteEvent(filtered)) {
      return;
    }

    console.log(filtered);

    let lastEvent = null;
    filtered.forEach((e) => {
      // skip unwriteable midi events

      const result = parseMidiEvent(e.message, 0, lastEvent);
      events.push({
        delta: e.deltaTime,
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
    const path = `output/${name}_${new Date().getTime()}.mid`;
    fs.writeFileSync(path, Buffer.from(encode(output)));
    console.log('wrote file to', path);
  });
};