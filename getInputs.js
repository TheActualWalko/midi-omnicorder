const MIDI = require('midi');

const formatName = (index, name, nameIndex) => {
  if (nameIndex === 1) {
    return `${index}_${name}`;
  } else {
    return `${index}_${name}_${nameIndex}`;
  }
}

let lastOutput = {};

const auxInput = new MIDI.input();

module.exports = (namesOnly) => {
  const portCount = auxInput.getPortCount();

  const output = {};

  for (let i = 0; i < portCount; i ++) {
    const name = auxInput.getPortName(i);
    let nameIndex = 1;
    while (!!output[formatName(i, name, nameIndex)]) {
      nameIndex ++;
    }
    const finalName = formatName(i, name, nameIndex)
    output[finalName] = new MIDI.input();
    output[finalName].openPort(i);
  }

  Object.keys(lastOutput).forEach((k) => {
    lastOutput[k].closePort();
  });
  lastOutput = output;

  return output;
}

process.on('exit', () => {
  auxInput.closePort();
  Object.keys(lastOutput).forEach((k) => {
    lastOutput[k].closePort();
  });
});