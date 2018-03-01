const $ = require('jquery');
const {ipcRenderer} = require('electron');
const moment = require('moment');

const friendlyDate = (date, precisionMode) => {
  let delta = Math.round((Date.now() - date) / 1000);

  let minute = 60,
      hour = minute * 60,
      day = hour * 24,
      week = day * 7;

  if (precisionMode) {
    const days = Math.floor(delta / day) || '';
    const hours = Math.floor((delta - (days * day)) / hour) || '';
    const minutes = Math.floor((delta - ((days * day) + (hours * hours))) / minute) || '';
    const seconds = Math.floor((delta - ((days * day) + (hours * hour) + (minutes * minute))));
    return `${days && days + 'd, '}${hours && hours + 'h, '}${minutes && minutes + 'm, '}${seconds}s`;
  }

  let fuzzy;

  if (delta < 15) {
    fuzzy = 'Just now';
  } else if (delta < minute) {
    fuzzy = delta + ' seconds ago';
  } else if (delta < 2 * minute) {
    fuzzy = 'A minute ago'
  } else if (delta < hour) {
    fuzzy = Math.floor(delta / minute) + ' minutes ago';
  } else if (delta < day) {
    fuzzy = 'Today, ' + moment(date).format('h:mm A');
  } else if (delta < day * 2) {
    fuzzy = 'Yesterday, ' + moment(date).format('h:mm A');
  } else {
    fuzzy = moment(date).format('MMM D, Y, h:mm A')
  }

  return fuzzy;
}

const makeFileListItem = ({filename, dateCreated, path}) => `
  <li>
    <img src='midi-icon@2x.png' />
    <span class='file-name'>${filename}</span>
    <span class='date-created'>${friendlyDate(dateCreated)}</span>
    <div class='file-dragger' data-path='${path}' draggable='true'></div>
  </li>
`;

let recordingStartTime;
let recording;

const updateRecordingMessage = () => {
  let recordingMessage;
  if (recording === true) {
    recordingMessage = `<span><strong>Recording</strong> since <strong>${friendlyDate(recordingStartTime, true)}</strong> ago.</span>`;
  } else if (recording === false) {
    recordingMessage = `<span><strong>Recording stopped.</strong></span>`;
  } else {
    recordingMessage = `<span><strong>Initializing...</strong></span>`
  }
  $('#status').empty().append(recordingMessage);
}

let lastFilesStringified = '';

ipcRenderer.on('state', (event, payload) => {
  const filesStringified = JSON.stringify(payload.files);
  if (lastFilesStringified !== filesStringified) {
    $('#file-list').empty();
    payload.files.forEach((f) => $('#file-list').append(makeFileListItem(f)));
    $("#file-list .file-dragger").each(function() {
      $(this).on('click dragstart', (e) => {
        e.preventDefault();
        ipcRenderer.send('ondragstart', $(this).attr('data-path'));
      });
    });
  }
  lastFilesStringified = filesStringified;
  recording = payload.recording;
  recordingStartTime = payload.recordingStartTime;

  $('#toggle-recording').text(recording !== false ? 'Stop Recording' : 'Start Recording');
  if (recording === undefined) {
    $("#toggle-recording").addClass('disabled');
  } else {
    $("#toggle-recording").removeClass('disabled');
  }
});

$(() => {
  $('#quit').click(() => {
    ipcRenderer.send('quit');
  });

  $('#toggle-recording').click(() => {
    if (recording === false) {
      ipcRenderer.send('start-recording');
    } else if (recording === true) {
      ipcRenderer.send('stop-recording');
    }
  });

  setInterval(updateRecordingMessage, 500);
  updateRecordingMessage();

  ipcRenderer.send('initialize');
});