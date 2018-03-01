const $ = require('jquery');
const {ipcRenderer} = require('electron');

const makeFileListItem = (f) => `
  <li>
    <img src='midi-icon.png' />
    <span class='file-name'>${f}</span>
    <span class='date-created'>Feb 20, 2018, 12:30 PM</span>
  </li>
`;

ipcRenderer.on('state', (event, { files }) => {
  $('#file-list').empty();
  files.forEach((f) => $('#file-list').append(makeFileListItem(f)));
});

ipcRenderer.send('update');