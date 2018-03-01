const fs = require('fs');
const { encode } = require('./json-midi-encoder-hax/module');
const parseMidiEvent = require('./parseMidiEvent');

module.exports = (eventLog) => {
  Object.keys(eventLog).forEach((name) => {
    const events = [];
    let lastEvent = null;
    eventLog[name].forEach((e) => {
      // skip aftertouch
      if (e.message[0] >= 0xD0 && e.message[0] <= 0xDF) {
        return;
      }
      const result = parseMidiEvent(e.message, 0, lastEvent);
      events.push({
        delta: e.deltaTime,
        channel: 0,
        ...result.event
      });
      lastEvent = result.event;
    });
    const output = {
      division: 480,
      format: 0,
      tracks: [
        [
          {
              delta: 0,
              trackName: name
          },
          {
            timeSignature:{
              denominator:4,
              metronome:36,
              numerator:4,
              thirtyseconds:8
            },
            delta:0
          },
          ...events,
          {delta: 0, endOfTrack: true}
        ]
      ]
    };
    //console.log(JSON.stringify(output,null,2));
    const path = `output/${name}_${new Date().getTime()}.mid`;
    fs.writeFileSync(path, Buffer.from(encode(output)));
    console.log('wrote file to', path);
  });
};