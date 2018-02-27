const MIDI = require('midi');

const formatName = (index, name, nameIndex) => {
  if (nameIndex === 1) {
    return `${index}_${name}`;
  } else {
    return `${index}_${name}_${nameIndex}`;
  }
}

const lastOutput = {};

module.exports = (namesOnly) => {
  const auxInput = new MIDI.input();
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

  auxInput.closePort();

  return output;
}