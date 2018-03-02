const $ = require('jquery');
const { ipcRenderer } = require('electron');
const moment = require('moment');

const TRANSPORT_STATUS = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  STOPPED: 'STOPPED'
};

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = MINUTE_SECONDS * 60;
const DAY_SECONDS = HOUR_SECONDS * 24;

const getRelativeSeconds = (now, date) => Math.round((now - date) / 1000);

const friendlyDate = (now, date) => {
  const relativeSeconds = getRelativeSeconds(now, date);

  if (relativeSeconds < 15) {
    return 'Just now';
  } else if (relativeSeconds < MINUTE_SECONDS) {
    return relativeSeconds + ' seconds ago';
  } else if (relativeSeconds < 2 * MINUTE_SECONDS) {
    return 'A minute ago'
  } else if (relativeSeconds < HOUR_SECONDS) {
    return Math.floor(relativeSeconds / MINUTE_SECONDS) + ' minutes ago';
  } else if (relativeSeconds < DAY_SECONDS) {
    return 'Today, ' + moment(date).format('h:mm A');
  } else if (relativeSeconds < DAY_SECONDS * 2) {
    return 'Yesterday, ' + moment(date).format('h:mm A');
  } else {
    return moment(date).format('MMM D, Y, h:mm A')
  }
}

const preciseTimeAgo = (now, date) => {
  const relativeSeconds = getRelativeSeconds(now, date);
  const days = Math.floor(relativeSeconds / DAY_SECONDS);
  const hours = Math.floor((relativeSeconds % DAY_SECONDS) / HOUR_SECONDS);
  const minutes = Math.floor((relativeSeconds % HOUR_SECONDS) / MINUTE_SECONDS);
  const seconds = Math.floor(relativeSeconds % MINUTE_SECONDS);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

const makeFileListItem = (now, {filename, dateCreated, path}) => `
  <li>
    <img src='../icons/midi@2x.png' />
    <span class='file-name'>${filename}</span>
    <span class='date-created'>${friendlyDate(now, dateCreated)}</span>
    <div class='file-dragger' data-path='${path}' draggable='true'></div>
  </li>
`;

const makeRecordingMessage = (now, transportStatus, recordingStartTime) => {
  if (transportStatus === TRANSPORT_STATUS.IDLE) {
    return `<span>MIDICatch: <strong>Initializing...</strong></span>`
  } else if (transportStatus === TRANSPORT_STATUS.STOPPED) {
    return `<span>MIDICatch: <strong>Recording stopped.</strong></span>`;
  } else if (transportStatus === TRANSPORT_STATUS.RECORDING) {
    return `<span>MIDICatch: <strong>Recording</strong> since <strong>${preciseTimeAgo(now, recordingStartTime)}</strong> ago.</span>`;
  } else {
    throw new Error(`Invalid transport status ${transportStatus}`);
  }
}

const setRecordingMessage = (message) => $('#status').empty().append(message);

const swapFiles = (lastFiles, files) => {
  if (JSON.stringify(lastFiles) === JSON.stringify(files)) return;

  $("#file-list").empty();
  files.forEach((f) => $('#file-list').append(makeFileListItem(Date.now(), f)));
}

$(() => {
  let currentFiles = [];
  let transportStatus = TRANSPORT_STATUS.IDLE;
  let recordingStartTime;

  // Event Listeners

  $('#quit').click(() => ipcRenderer.send('quit'));
  $("#open-midi-folder").click(() => ipcRenderer.send('open-midi-folder'));
  $('#toggle-recording').click(() => {
    if (transportStatus === TRANSPORT_STATUS.IDLE) {
      return;
    } else if (transportStatus === TRANSPORT_STATUS.STOPPED) {
      ipcRenderer.send('start-recording');
    } else if (transportStatus === TRANSPORT_STATUS.RECORDING) {
      ipcRenderer.send('start-recording');
    } else {
      throw new Error(`Invalid transport status ${transportStatus}`);
    }
  });
  $("#file-list").on('click dragstart', '.file-dragger', (e) => {
    e.preventDefault();
    ipcRenderer.send('ondragstart', $(e.currentTarget).attr('data-path'));
  });

  setInterval(() =>
    setRecordingMessage(
      makeRecordingMessage(Date.now(), transportStatus, recordingStartTime)
    ),
    500
  );

  setRecordingMessage(
    makeRecordingMessage(Date.now(), transportStatus, recordingStartTime)
  );

  ipcRenderer.on('state', (event, payload) => {
    swapFiles(currentFiles, payload.files);
    currentFiles = payload.files;
    transportStatus = payload.transportStatus;
    recordingStartTime = payload.recordingStartTime;

    if (transportStatus === TRANSPORT_STATUS.IDLE) {
      $("#toggle-recording")
        .addClass('disabled')
        .text('Please wait...');
    } else if (transportStatus === TRANSPORT_STATUS.STOPPED) {
      $("#toggle-recording")
        .removeClass('disabled')
        .text('Start Recording');
    } else if (transportStatus === TRANSPORT_STATUS.RECORDING) {
      $("#toggle-recording")
        .removeClass('disabled')
        .text('Stop Recording');
    } else {
      throw new Error(`Invalid transport status ${transportStatus}`);
    }
  });

  ipcRenderer.send('initialize');
});