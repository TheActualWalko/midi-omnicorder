module.exports = function (evt, offset, lastEvent) {
    const [statusByte, ...remainder] = evt;//evt.map(x => String.fromCharCode(x));
    var eventType = statusByte >> 4;
    var sanitizedLastEvent = ((statusByte & 0x80) === 0) ? lastEvent : null;
    var event;
    var sanitizedOffset = ((statusByte & 0x80) === 0) ? offset - 1 : offset;
    if (eventType === 0x08 || (sanitizedLastEvent !== null && 'noteOff' in sanitizedLastEvent)) {
        event = {
            noteOff: {
                noteNumber: remainder[sanitizedOffset],
                velocity: remainder[sanitizedOffset + 1]
            }
        };
        sanitizedOffset += 2;
    }
    else if (eventType === 0x09 || (sanitizedLastEvent !== null && 'noteOn' in sanitizedLastEvent)) {
        var noteNumber = remainder[sanitizedOffset];
        var velocity = remainder[sanitizedOffset + 1];
        if (velocity === 0) {
            event = {
                noteOff: {
                    noteNumber: noteNumber,
                    velocity: velocity
                }
            };
        }
        else {
            event = {
                noteOn: {
                    noteNumber: noteNumber,
                    velocity: velocity
                }
            };
        }
        sanitizedOffset += 2;
    }
    else if (eventType === 0x0B || (sanitizedLastEvent !== null &&
        'controlChange' in sanitizedLastEvent)) {
        event = {
            controlChange: {
                type: remainder[sanitizedOffset],
                value: remainder[sanitizedOffset + 1]
            }
        };
        sanitizedOffset += 2;
    }
    else if (eventType === 0x0C || (sanitizedLastEvent !== null &&
        'programChange' in sanitizedLastEvent)) {
        event = {
            programChange: {
                programNumber: remainder[sanitizedOffset]
            }
        };
        sanitizedOffset += 1;
    }
    else if (eventType === 0x0E || (sanitizedLastEvent !== null &&
        'pitchBend' in sanitizedLastEvent)) {
        event = {
            pitchBend: remainder[sanitizedOffset] | (remainder[sanitizedOffset + 1] << 7)
        };
        sanitizedOffset += 2;
    }
    else {
        throw new Error("Cannot parse a midi event with a type of \"" + statusByte + "\"");
    }
    event.channel = statusByte & 0x0F;
    console.log(evt, offset, sanitizedOffset, event);
    return { event: event, offset: sanitizedOffset };
};
