// import required modules
var debug = require('debug')('arbor:mod-validation');
var dataStore = require('../modules/aws-data-store');


// verify if a current session-variable set is complete (valid)
// expects: possible session (obj)
// returns: boolean
function sessionValidator(testval) {
    // valid sessions require:
    //   - "concern" array
    //   - "attachments" array
    //   - "currentResponseIndex" integer
    //   - "tipId" string
    
    if (
        (!(testval.hasOwnProperty('concern'))) ||
        (!(testval.hasOwnProperty('currentResponseIndex'))) ||
        (!(testval.hasOwnProperty('tipId'))) ||
        (!(testval.hasOwnProperty('attachments'))) ||
        (!(testval.hasOwnProperty('startTimestamp'))) ||
        (!(testval.hasOwnProperty('submitTimestamp')))
    ) {
        // session is missing something
        debug("[NOTICE] session property validation failed.");
        return false;
    } else {
        // all session variables exist
        debug("[NOTICE] session property validation passed.");
        return true;
    }
}

// validator for answer selection value
// expects: possible select value (string)
// returns: boolean
function answerSelectedValidator(testval) {
    // valid select input is string of boolean input: "true" or "false"
    debug("[NOTICE] testing answer selection value: " + testval);

    // step 1 - confirm testval exists
    if ((typeof testval !== 'undefined') && (testval !== null)) {
        // step 2 - confirm value is a valid boolean string
        if ((testval.toLowerCase() == 'true') || (testval.toLowerCase() == 'false')) {
            // input is valid
            debug("[NOTICE] answer validation passed.");
            return true;
        }
    }
    // value didn't pass tests
    debug("[NOTICE] answer validation failed.");
    return false;
}

// validator for question UUIDs
// expects: possible question UUID (string)
// returns: boolean
function questionUuidValidator(testval) {
    debug("[NOTICE] validating q_uuid: " + testval);
    // valid question UUID must:
    //  - be a valid UUID v4 string
    //  - be listed in all-questions.json
    
    // load the topic-list JSON object (synchronously)
    var allQuestions = dataStore.getQuestions();
    
    // step 1 - confirm testval is UUID v4
    if (uuidValidator(testval)) {
        // step 2 - confirm UUID exists
        if (allQuestions.find(function (val) { return (val.uuId.toLowerCase() === testval.toLowerCase()); })) {
            // valid question UUID
            debug("[NOTICE] q_uuid validation passed.");
            return true;
        }
    }
    // invalid or missing value
    debug("[NOTICE] q_uuid validation failed.");
    return false;
}


// validator for answer UUIDs
// expects: possible answer UUID (string), associated question UUID (string)
// returns: boolean
function answerUuidValidator(testval, qId) {
    debug("[NOTICE] validating a_uuid: " + testval + " (for question: " + qId + ")");
    // valid question UUID must:
    //  - be a valid UUID v4 string
    //  - be listed as an answer attached to the specified question
    
    // load the topic-list JSON object (synchronously)
    var allQuestions = dataStore.getQuestions();
    
    // step 1 - confirm question UUID is valid
    if (questionUuidValidator(qId)) {
        // step 2 - confirm testval is UUID v4
        if (uuidValidator(testval)) {
            // look up answers to specified question UUID
            var qInfo = allQuestions.find(function (val) { return (val.uuId.toLowerCase() === qId.toLowerCase()); });
            if (qInfo) {
                // load associated question object
                var qObj = dataStore.getQuestionTemplate(qInfo.name);
                // step 3 - confirm answer is valid and connected to question
                if (qObj.answers.find(function (val) { return (val.uuId.toLowerCase() === testval.toLowerCase()); })) {
                    // valid answer UUID
                    debug("[NOTICE] a_uuid validation passed.");
                    return true;
                }
            }
        }
    }
    // invalid or missing value
    debug("[NOTICE] a_uuid validation failed.");
    return false;
}


// validator for UUID v4
// expects: possible uuid (string)
// returns: boolean
function uuidValidator(testval) {
    // valid UUID v4 spec (can be lower or uppercase)
    // 00000000-0000-4000-[8,9,a,b]000-000000000000
    
    // step 1 - confirm testval exists
    if ((typeof testval !== 'undefined') && (testval !== null)) {
        // step 2 - confirm test value is a string
        if (typeof testval == 'string') {
            // step 3 - test against UUIDv4 regex
            // note: match is tested working on UUIDv4 strings
            if (testval.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/)) {
                // valid UUIDv4 was passed
                debug("[NOTICE] uuid v4 spec validation passed.");
                return true;
            }
        }
    }
    // invalid or missing UUID
    debug("[NOTICE] uuid v4 spec validation failed.");
    return false;
}

// validator for attachment type
// expects: possible type (string)
// returns: boolean
function attachmentTypeValidator(testval) {
    // valid attachment type strings:
    // image, audio, video, file
    debug("[NOTICE] validating attachment type: " + testval);
    
    // step 1 - confirm testval exists
    if ((typeof testval !== 'undefined') && (testval !== null)) {
        // step 2 - confirm testval is a string
        if (typeof testval == 'string') {
            // step 3 - test against accepted values
            switch (testval.toLowerCase()) {
                case 'image':
                case 'audio':
                case 'video':
                case 'file':
                    // accepted type
                    debug("[NOTICE] attachment type validation passed.");
                    return true;
                    break;
            }
        }
    }
    // invalid or missing value
    debug("[NOTICE] attachment type validation failed.");
    return false;
}

// validator for answer selection value
// expects: possible answer object (object)
// returns: boolean
function answerArrayValidator(testval, qId) {
    // answer objects in array must have following properties:
    //  - "a_uuid", "selected" fields required to be populated
    //  - "a_uuid" must associated with given question UUID

    // step 1 - check that Answer object has required components
    if (testval.hasOwnProperty('a_uuid') || testval.hasOwnProperty('selected')) {
        // step 2 - check that answer applies to current question
        if (answerUuidValidator(testval.a_uuid, qId)) {
            // step 3 - check that selected field has proper value
            return (answerSelectedValidator(testval.selected.toString()));
        }
    }
    // array did not pass tests
    return false;
}


// export module
// =============================================================================

module.exports = {
    // session validation
    sessionValidator: sessionValidator,

    // answer validation
    answerSelectedValidator: answerSelectedValidator,
    questionUuidValidator: questionUuidValidator,
    answerUuidValidator: answerUuidValidator,
    answerArrayValidator: answerArrayValidator,

    // attachment validation
    attachmentTypeValidator: attachmentTypeValidator,

    // overall UUIDv4 validation
    uuidValidator: uuidValidator
};

