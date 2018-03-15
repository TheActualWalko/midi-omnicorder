const MIDI = require('midi');
const auxInput = new MIDI.input();

const inputs = [];

module.exports = () => {
  const portCount = auxInput.getPortCount();

  console.log(portCount, inputs.length);

  if (portCount > inputs.length) {
    for (let i = inputs.length; i < portCount; i ++) {
      const input = new MIDI.input();
      input.openPort(i);
      inputs.push(input);
      console.log(`added input named ${input.getPortName(i)}`);
    }
  } else if (portCount < inputs.length) {
    for (let i = inputs.length - 1; i >= portCount; i --) {
      inputs[i].closePort();
      console.log(`removed input at index ${i}`);
    }
    inputs.splice(portCount, inputs.length - portCount);
  }

  const nameCounts = {};

  return inputs.map((input, index) => {
    const rawName = input.getPortName(index);

    if (nameCounts[rawName] === undefined) nameCounts[rawName] = 0;
    nameCounts[rawName] ++;

    const name = nameCounts[rawName] > 1
      ? `${rawName} ${nameCounts[rawName]}`
      : rawName;

    return {input, name};
  });
}

process.on('exit', () => {
  auxInput.closePort();
  inputs.forEach((input) => input.closePort());
});