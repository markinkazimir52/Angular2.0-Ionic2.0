var uuid = require('node-uuid');

// create the user-readable Tip ID
// expects: void
// returns: alphanumeric TipID string
function generateTipID() {
    // generate a 6-character long randomized alphanumeric Tip ID
    var tid = (Math.random().toString(36).substr(2, 6));
    console.log("Generated user-friendly Tip ID: " + tid);
    // return value
    return tid;
}

// create a SHA-256 hex hash string
// expects: buffer object
// returns: hex hash 
function generateHash(input) {
    // create a new crypto instance since calls cannot have 
    return (require('crypto').createHash('sha256').update(input).digest('hex'));
}

// create a new UUID v4 string
// expects: void
// returns: alphanumeric string (of form: "00000000-0000-0000-0000-000000000000")
function generateUuid() {
    // return the string in proper format
    return ((uuid.v4()).toLowerCase());
}

// export module
// =============================================================================

module.exports = {
    // app-compatible Tip ID generator
    generateTipID: generateTipID,
    // SHA-256 hex string generator
    generateHash: generateHash,
    // UUIDv4 generator
    generateUuid: generateUuid
};
