(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('babel-runtime/helpers/slicedToArray')) :
  typeof define === 'function' && define.amd ? define(['exports', 'babel-runtime/helpers/slicedToArray'], factory) :
  (factory((global.jsonMidiMessageEncoder = {}),global._slicedToArray));
}(this, (function (exports,_slicedToArray) { 'use strict';

_slicedToArray = _slicedToArray && _slicedToArray.hasOwnProperty('default') ? _slicedToArray['default'] : _slicedToArray;

var isIMidiChannelPrefixEvent = function isIMidiChannelPrefixEvent(event) {
    return event.channelPrefix !== undefined;
};

var isIMidiControlChangeEvent = function isIMidiControlChangeEvent(event) {
    return event.controlChange !== undefined;
};

var isIMidiEndOfTrackEvent = function isIMidiEndOfTrackEvent(event) {
    return event.endOfTrack !== undefined;
};

var isIMidiKeySignatureEvent = function isIMidiKeySignatureEvent(event) {
    return event.keySignature !== undefined;
};

var isIMidiLyricEvent = function isIMidiLyricEvent(event) {
    return event.lyric !== undefined;
};

var isIMidiMidiPortEvent = function isIMidiMidiPortEvent(event) {
    return event.midiPort !== undefined;
};

var isIMidiNoteOffEvent = function isIMidiNoteOffEvent(event) {
    return event.noteOff !== undefined;
};

var isIMidiNoteOnEvent = function isIMidiNoteOnEvent(event) {
    return event.noteOn !== undefined;
};

var isIMidiPitchBendEvent = function isIMidiPitchBendEvent(event) {
    return event.pitchBend !== undefined;
};

var isIMidiProgramChangeEvent = function isIMidiProgramChangeEvent(event) {
    return event.programChange !== undefined;
};

var isIMidiSetTempoEvent = function isIMidiSetTempoEvent(event) {
    return event.setTempo !== undefined;
};

var isIMidiSmpteOffsetEvent = function isIMidiSmpteOffsetEvent(event) {
    return event.smpteOffset !== undefined;
};

var isIMidiSysexEvent = function isIMidiSysexEvent(event) {
    return event.sysex !== undefined;
};

var isIMidiTextEvent = function isIMidiTextEvent(event) {
    return event.text !== undefined;
};

var isIMidiTimeSignatureEvent = function isIMidiTimeSignatureEvent(event) {
    return event.timeSignature !== undefined;
};

var isIMidiTrackNameEvent = function isIMidiTrackNameEvent(event) {
    return event.trackName !== undefined;
};

var createArrayBufferWithDataView = function createArrayBufferWithDataView(length) {
    var arrayBuffer = new ArrayBuffer(length);
    var dataView = new DataView(arrayBuffer);
    return { arrayBuffer: arrayBuffer, dataView: dataView };
};

var joinArrayBuffers = function joinArrayBuffers(arrayBuffers) {
    var byteLength = arrayBuffers.reduce(function (bytLngth, arrayBuffer) {
        return bytLngth + arrayBuffer.byteLength;
    }, 0);

    var _arrayBuffers$reduce = arrayBuffers.reduce(function (_ref, arrayBuffer) {
        var _ref2 = _slicedToArray(_ref, 2),
            offset = _ref2[0],
            nt8Rry = _ref2[1];

        nt8Rry.set(new Uint8Array(arrayBuffer), offset);
        return [offset + arrayBuffer.byteLength, nt8Rry];
    }, [0, new Uint8Array(byteLength)]),
        _arrayBuffers$reduce2 = _slicedToArray(_arrayBuffers$reduce, 2),
        uint8Array = _arrayBuffers$reduce2[1];

    return uint8Array.buffer;
};

var writeVariableLengthQuantity = function writeVariableLengthQuantity(value) {
    var numberOfBytes = Math.max(1, Math.floor(Math.log(value) / Math.log(2) / 7) + 1);

    var _createArrayBufferWit = createArrayBufferWithDataView(numberOfBytes),
        arrayBuffer = _createArrayBufferWit.arrayBuffer,
        dataView = _createArrayBufferWit.dataView;

    var length = numberOfBytes - 1;
    var shiftedValue = value;
    for (var i = 0; i < length; i += 1) {
        dataView.setUint8(i, shiftedValue >> 7 | 0x80); // tslint:disable-line:no-bitwise
        shiftedValue &= 0x7F; // tslint:disable-line:no-bitwise
    }
    dataView.setUint8(numberOfBytes - 1, shiftedValue);
    return arrayBuffer;
};

var encode = function encode(event) {
    if (isIMidiChannelPrefixEvent(event)) {
        var _createArrayBufferWit = createArrayBufferWithDataView(4),
            arrayBuffer = _createArrayBufferWit.arrayBuffer,
            dataView = _createArrayBufferWit.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        dataView.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x20.
        dataView.setUint8(1, 0x20);
        dataView.setUint8(2, 1);
        dataView.setUint8(3, event.channelPrefix);
        return arrayBuffer;
    }
    if (isIMidiControlChangeEvent(event)) {
        var _createArrayBufferWit2 = createArrayBufferWithDataView(3),
            _arrayBuffer = _createArrayBufferWit2.arrayBuffer,
            _dataView = _createArrayBufferWit2.dataView;

        _dataView.setUint8(0, 0xB0 | event.channel & 0xF); // tslint:disable-line:no-bitwise
        _dataView.setUint8(1, event.controlChange.type);
        _dataView.setUint8(2, event.controlChange.value);
        return _arrayBuffer;
    }
    if (isIMidiEndOfTrackEvent(event)) {
        var _createArrayBufferWit3 = createArrayBufferWithDataView(3),
            _arrayBuffer2 = _createArrayBufferWit3.arrayBuffer,
            _dataView2 = _createArrayBufferWit3.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        _dataView2.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x2F.
        _dataView2.setUint8(1, 0x2F);
        _dataView2.setUint8(2, 0);
        return _arrayBuffer2;
    }
    if (isIMidiKeySignatureEvent(event)) {
        var _createArrayBufferWit4 = createArrayBufferWithDataView(5),
            _arrayBuffer3 = _createArrayBufferWit4.arrayBuffer,
            _dataView3 = _createArrayBufferWit4.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        _dataView3.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x59.
        _dataView3.setUint8(1, 0x59);
        _dataView3.setUint8(2, 2);
        _dataView3.setUint8(3, event.keySignature.key);
        _dataView3.setUint8(4, event.keySignature.scale);
        return _arrayBuffer3;
    }
    if (isIMidiLyricEvent(event)) {
        var _createArrayBufferWit5 = createArrayBufferWithDataView(2),
            _arrayBuffer4 = _createArrayBufferWit5.arrayBuffer,
            _dataView4 = _createArrayBufferWit5.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        _dataView4.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x05.
        _dataView4.setUint8(1, 0x05);
        var textEncoder = new TextEncoder();
        var textArrayBuffer = textEncoder.encode(event.lyric).buffer;
        var textLengthArrayBuffer = writeVariableLengthQuantity(textArrayBuffer.byteLength);
        return joinArrayBuffers([_arrayBuffer4, textLengthArrayBuffer, textArrayBuffer]);
    }
    if (isIMidiMidiPortEvent(event)) {
        var _createArrayBufferWit6 = createArrayBufferWithDataView(4),
            _arrayBuffer5 = _createArrayBufferWit6.arrayBuffer,
            _dataView5 = _createArrayBufferWit6.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        _dataView5.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x21.
        _dataView5.setUint8(1, 0x21);
        _dataView5.setUint8(2, 1);
        _dataView5.setUint8(3, event.midiPort);
        return _arrayBuffer5;
    }
    if (isIMidiNoteOffEvent(event)) {
        var _createArrayBufferWit7 = createArrayBufferWithDataView(3),
            _arrayBuffer6 = _createArrayBufferWit7.arrayBuffer,
            _dataView6 = _createArrayBufferWit7.dataView;

        _dataView6.setUint8(0, 0x80 | event.channel & 0xF); // tslint:disable-line:no-bitwise
        _dataView6.setUint8(1, event.noteOff.noteNumber);
        _dataView6.setUint8(2, event.noteOff.velocity);
        return _arrayBuffer6;
    }
    if (isIMidiNoteOnEvent(event)) {
        var _createArrayBufferWit8 = createArrayBufferWithDataView(3),
            _arrayBuffer7 = _createArrayBufferWit8.arrayBuffer,
            _dataView7 = _createArrayBufferWit8.dataView;

        _dataView7.setUint8(0, 0x90 | event.channel & 0xF); // tslint:disable-line:no-bitwise
        _dataView7.setUint8(1, event.noteOn.noteNumber);
        _dataView7.setUint8(2, event.noteOn.velocity);
        return _arrayBuffer7;
    }
    if (isIMidiPitchBendEvent(event)) {
        var _createArrayBufferWit9 = createArrayBufferWithDataView(3),
            _arrayBuffer8 = _createArrayBufferWit9.arrayBuffer,
            _dataView8 = _createArrayBufferWit9.dataView;

        _dataView8.setUint8(0, 0xE0 | event.channel & 0xF); // tslint:disable-line:no-bitwise
        _dataView8.setUint8(1, event.pitchBend & 0x7F); // tslint:disable-line:no-bitwise
        _dataView8.setUint8(2, event.pitchBend >> 7); // tslint:disable-line:no-bitwise
        return _arrayBuffer8;
    }
    if (isIMidiProgramChangeEvent(event)) {
        var _createArrayBufferWit10 = createArrayBufferWithDataView(2),
            _arrayBuffer9 = _createArrayBufferWit10.arrayBuffer,
            _dataView9 = _createArrayBufferWit10.dataView;

        _dataView9.setUint8(0, 0xC0 | event.channel & 0xF); // tslint:disable-line:no-bitwise
        _dataView9.setUint8(1, event.programChange.programNumber);
        return _arrayBuffer9;
    }
    if (isIMidiSetTempoEvent(event)) {
        var _createArrayBufferWit11 = createArrayBufferWithDataView(6),
            _arrayBuffer10 = _createArrayBufferWit11.arrayBuffer,
            _dataView10 = _createArrayBufferWit11.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        _dataView10.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x51.
        _dataView10.setUint8(1, 0x51);
        _dataView10.setUint8(2, 3);
        _dataView10.setUint8(3, event.setTempo.microsecondsPerBeat >> 16); // tslint:disable-line:no-bitwise
        _dataView10.setUint8(4, event.setTempo.microsecondsPerBeat >> 8); // tslint:disable-line:no-bitwise
        _dataView10.setUint8(5, event.setTempo.microsecondsPerBeat);
        return _arrayBuffer10;
    }
    if (isIMidiSmpteOffsetEvent(event)) {
        var _createArrayBufferWit12 = createArrayBufferWithDataView(8),
            _arrayBuffer11 = _createArrayBufferWit12.arrayBuffer,
            _dataView11 = _createArrayBufferWit12.dataView;

        var frameRateByte = void 0;
        if (event.smpteOffset.frameRate === 24) {
            frameRateByte = 0x00;
        } else if (event.smpteOffset.frameRate === 25) {
            frameRateByte = 0x20;
        } else if (event.smpteOffset.frameRate === 29) {
            frameRateByte = 0x40;
        } else if (event.smpteOffset.frameRate === 30) {
            frameRateByte = 0x60;
        } else {
            throw new Error(); // @todo
        }
        // Write an eventTypeByte with a value of 0xFF.
        _dataView11.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x54.
        _dataView11.setUint8(1, 0x54);
        _dataView11.setUint8(2, 5);
        _dataView11.setUint8(3, event.smpteOffset.hour | frameRateByte); // tslint:disable-line:no-bitwise
        _dataView11.setUint8(4, event.smpteOffset.minutes);
        _dataView11.setUint8(5, event.smpteOffset.seconds);
        _dataView11.setUint8(6, event.smpteOffset.frame);
        _dataView11.setUint8(7, event.smpteOffset.subFrame);
        return _arrayBuffer11;
    }
    if (isIMidiSysexEvent(event)) {
        var _createArrayBufferWit13 = createArrayBufferWithDataView(1),
            _arrayBuffer12 = _createArrayBufferWit13.arrayBuffer,
            _dataView12 = _createArrayBufferWit13.dataView;
        // Write an eventTypeByte with a value of 0xF0.


        _dataView12.setUint8(0, 0xF0);
        var sysexLength = event.sysex.length / 2;
        var sysexLengthArrayBuffer = writeVariableLengthQuantity(sysexLength);

        var _createArrayBufferWit14 = createArrayBufferWithDataView(sysexLength),
            sysexArrayBuffer = _createArrayBufferWit14.arrayBuffer,
            sysexDataView = _createArrayBufferWit14.dataView;

        for (var i = 0; i < event.sysex.length; i += 2) {
            sysexDataView.setUint8(i / 2, parseInt(event.sysex.slice(i, i + 2), 16));
        }
        return joinArrayBuffers([_arrayBuffer12, sysexLengthArrayBuffer, sysexArrayBuffer]);
    }
    if (isIMidiTimeSignatureEvent(event)) {
        var _createArrayBufferWit15 = createArrayBufferWithDataView(7),
            _arrayBuffer13 = _createArrayBufferWit15.arrayBuffer,
            _dataView13 = _createArrayBufferWit15.dataView;

        var denominator = event.timeSignature.denominator;
        var counter = 0;
        while (denominator > 1) {
            denominator /= 2;
            counter += 1;
        }
        // Write an eventTypeByte with a value of 0xFF.
        _dataView13.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x58.
        _dataView13.setUint8(1, 0x58);
        _dataView13.setUint8(2, 4);
        _dataView13.setUint8(3, event.timeSignature.numerator);
        _dataView13.setUint8(4, counter);
        _dataView13.setUint8(5, event.timeSignature.metronome);
        _dataView13.setUint8(6, event.timeSignature.thirtyseconds);
        return _arrayBuffer13;
    }
    if (isIMidiTextEvent(event)) {
        var _createArrayBufferWit16 = createArrayBufferWithDataView(2),
            _arrayBuffer14 = _createArrayBufferWit16.arrayBuffer,
            _dataView14 = _createArrayBufferWit16.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        _dataView14.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x01.
        _dataView14.setUint8(1, 0x01);
        var _textArrayBuffer = Buffer.from(event.text);
        var _textLengthArrayBuffer = writeVariableLengthQuantity(_textArrayBuffer.byteLength);
        return joinArrayBuffers([_arrayBuffer14, _textLengthArrayBuffer, _textArrayBuffer]);
    }
    if (isIMidiTrackNameEvent(event)) {
        var _createArrayBufferWit17 = createArrayBufferWithDataView(2),
            _arrayBuffer15 = _createArrayBufferWit17.arrayBuffer,
            _dataView15 = _createArrayBufferWit17.dataView;
        // Write an eventTypeByte with a value of 0xFF.


        _dataView15.setUint8(0, 0xFF);
        // Write a metaTypeByte with a value of 0x03.
        _dataView15.setUint8(1, 0x03);
        var _textArrayBuffer2 = Buffer.from(event.trackName);
        var _textLengthArrayBuffer2 = writeVariableLengthQuantity(_textArrayBuffer2.byteLength);
        return joinArrayBuffers([_arrayBuffer15, _textLengthArrayBuffer2, _textArrayBuffer2]);
    }
    throw new Error('Unencodable event with a delta of "' + event.delta + '".');
};

exports.encode = encode;

Object.defineProperty(exports, '__esModule', { value: true });

})));
