const $ = require('jquery');
const { ipcRenderer } = require('electron');
const moment = require('moment');

const RECORDING_MESSAGE_UPDATE_INTERVAL_MS = 500;
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

const shortenFilename = (filename) => {
  if (filename.length > 30) {
    const split = filename.split('_');
    const bpmPart = split[split.length - 1];
    const hashPart = split[split.length - 2];
    let rest = split.slice(0, -2).join('_');
    while ((rest + '...' + bpmPart).length > 30) {
      rest = rest.slice(0, -1);
    }
    return rest + '...' + bpmPart;
  } else {
    return filename;
  }
}

const makeFileListItem = (now, {filename, dateCreated, path}) => `
  <li>
    <img src='../icons/midi@2x.png' />
    <span class='file-name'>${shortenFilename(filename)}</span>
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

  // Initial state

  let currentFiles = [];
  let transportStatus = TRANSPORT_STATUS.IDLE;
  let recordingStartTime;
  let currentTempo;

  // Event listeners

  $('#quit').click(() => ipcRenderer.send('quit'));
  $("#open-midi-folder").click(() => ipcRenderer.send('open-midi-folder'));
  $("#file-list").on('click dragstart', '.file-dragger', (e) => {
    e.preventDefault();
    ipcRenderer.send('ondragstart', $(e.currentTarget).attr('data-path'));
  });
  $("#tempo").on('blur', (e) => {
    const nextTempo = Number($("#tempo").val());
    ipcRenderer.send('set-tempo', nextTempo);
    $("#tempo").val(nextTempo.toFixed(2));
  });
  $("#tempo").on('keypress', (e) => {
    if (e.which === 13) { // enter
      $("#tempo").blur();
    }
  });

  // State changes

  ipcRenderer.on('state', (event, payload) => {
    swapFiles(currentFiles, payload.files);

    currentFiles = payload.files;
    transportStatus = payload.transportStatus;
    recordingStartTime = payload.recordingStartTime;
    if (payload.tempo !== currentTempo) {
      currentTempo = payload.tempo;
      $("#tempo").val(currentTempo.toFixed(2));
    }

    if (transportStatus === TRANSPORT_STATUS.IDLE) {

      $("#toggle-recording")
        .off('click')
        .addClass('disabled')
        .text('Please wait...');

    } else if (transportStatus === TRANSPORT_STATUS.STOPPED) {

      $("#toggle-recording")
        .off('click')
        .click(() => ipcRenderer.send('start-recording'))
        .removeClass('disabled')
        .text('Start Recording');

    } else if (transportStatus === TRANSPORT_STATUS.RECORDING) {

      $("#toggle-recording")
        .off('click')
        .click(() => ipcRenderer.send('stop-recording'))
        .removeClass('disabled')
        .text('Stop Recording');

    } else {
      throw new Error(`Invalid transport status ${transportStatus}`);
    }
  });

  // Recording timer updates

  setInterval(() =>
    setRecordingMessage(
      makeRecordingMessage(
        Date.now(),
        transportStatus,
        recordingStartTime
      )
    ),
    RECORDING_MESSAGE_UPDATE_INTERVAL_MS
  );

  // Connect to main process

  ipcRenderer.send('initialize');

});