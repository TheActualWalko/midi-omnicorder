const jsonMidiMessageEncoder = require('./message-encoder');

var createArrayBufferWithDataView = function createArrayBufferWithDataView(length) {
    var arrayBuffer = new ArrayBuffer(length);
    var dataView = new DataView(arrayBuffer);
    return { arrayBuffer: arrayBuffer, dataView: dataView };
};

var encode = function encode(division, format, tracks) {
    var _createArrayBufferWit = createArrayBufferWithDataView(14),
        arrayBuffer = _createArrayBufferWit.arrayBuffer,
        dataView = _createArrayBufferWit.dataView;
    // Write MThd as number.


    dataView.setUint32(0, 1297377380);
    dataView.setUint32(4, 6);
    dataView.setUint16(8, format);
    dataView.setUint16(10, tracks.length);
    dataView.setUint16(12, division);
    return arrayBuffer;
};

var joinArrayBuffers = function joinArrayBuffers(arrayBuffers) {
    var byteLength = arrayBuffers.reduce(function (bytLngth, arrayBuffer) {
        return bytLngth + arrayBuffer.byteLength;
    }, 0);
    // @todo Remove this tslint rule again when possible.
    // tslint:disable-next-line:no-use-before-declare

    var _arrayBuffers$reduce = arrayBuffers.reduce(function (_ref, arrayBuffer) {
        var offset = _ref.offset,
            nt8Rry = _ref.uint8Array;

        nt8Rry.set(new Uint8Array(arrayBuffer), offset);
        return { offset: offset + arrayBuffer.byteLength, uint8Array: nt8Rry };
    }, { offset: 0, uint8Array: new Uint8Array(byteLength) }),
        uint8Array = _arrayBuffers$reduce.uint8Array;

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

var encode$1 = function encode(track) {
    var _createArrayBufferWit = createArrayBufferWithDataView(8),
        arrayBuffer = _createArrayBufferWit.arrayBuffer,
        dataView = _createArrayBufferWit.dataView;

    var arrayBuffers = [arrayBuffer];
    var byteLength = 0;
    // Write MTrk as number.
    dataView.setUint32(0, 1297379947);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = track[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var message = _step.value;

            var deltaArrayBuffer = writeVariableLengthQuantity(message.delta);
            try {
                var messageArrayBuffer = jsonMidiMessageEncoder.encode(message);
                byteLength += deltaArrayBuffer.byteLength + messageArrayBuffer.byteLength;
                arrayBuffers.push(deltaArrayBuffer, messageArrayBuffer);
            } catch (err) {
                if (err.message.match(/Unencodable\smessage\swith\sa\sdelta\sof\s[0-9]+\./)) {
                    var index = track.indexOf(message);
                    throw new Error('Unencodable message at index ' + index + '.');
                }
                throw err;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    dataView.setUint32(4, byteLength);
    return joinArrayBuffers(arrayBuffers);
};

var encode$2 = function encode$$1(_ref) {
    var division = _ref.division,
        format = _ref.format,
        tracks = _ref.tracks;

    var arrayBuffers = [];
    try {
        arrayBuffers.push(encode(division, format, tracks));
    } catch (err) {
        throw new Error('The given JSON object seems to be invalid.');
    }
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = tracks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var track = _step.value;

            try {
                arrayBuffers.push(encode$1(track));
            } catch (err) {
                if (err.message.match(/Unencodable\sevent\sat\sposition\s[0-9]+\./)) {
                    var index = tracks.indexOf(track);
                    throw new Error(err.message.slice(0, -1) + ' of the track at index ' + index + '.');
                }
                throw err;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return joinArrayBuffers(arrayBuffers);
};

module.exports = {
    encode: encode$2
};