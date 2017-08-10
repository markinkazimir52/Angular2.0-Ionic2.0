// import filesystem access module, to handle static materials
var debug = require('debug')('arbor:mod-app-data-store');
var fs = require('fs');
var AWS = require('aws-sdk');

var SimpleDynamo = require('node-simple-dynamo');

// connect to the AWS servers
AWS.config.update({
    accessKeyId: JSON.parse(process.env.AWS_ACCESS_KEY),
    secretAccessKey: JSON.parse(process.env.AWS_SECRET_ACCESS_KEY),
    region: JSON.parse(process.env.AWS_REGION)
});

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var s3 = require('s3');

var s3client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId: JSON.parse(process.env.AWS_ACCESS_KEY),
        secretAccessKey: JSON.parse(process.env.AWS_SECRET_ACCESS_KEY),
        region: JSON.parse(process.env.AWS_REGION)
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    }
});

// file locations
const questionFilePath = '/../objects/questions/';
const allQuestionsFile = __dirname + '/../objects/all-questions.json';
const defaultProgressValueFile = __dirname + '/../objects/default-progress-values.json';
const defaultFollowupResponseFile = __dirname + '/../objects/default-concern-update.json';

// data source flag
// valid values:
//  - "db" --> everything from database
//  - "filesystem" --> filesystem has priority, database if/as required
const defaultDataSource = JSON.parse(process.env.API_DEFAULT_DATASOURCE);

const reportTableName = 'report2';


// required references
// TODO: make sure these are kept up-to-date!
const topicQuestionName = 'topic-selection';
const issueQuestionName = 'issue-selection';

// storage variables for loaded data to avoid synchronous loads
// especially important w/ items sourced from DB
var questions;
var followups;
var theTopics;
var questionTemplates;
var help;
var about;
var faq;
var terms;


function getCounts() {


    var column = 'report_type';

    var database = SimpleDynamo(
        AWS.config,
        {
            dynamodb: '2016-10-17'
        }
    );

    var promiseSecurity = database.list(reportTableName, [{
        key: column,
        operator: "EQ",
        value: 'SECURITY'
    }]);
    var promiseSafety = database.list(reportTableName, [{
        key: column,
        operator: "EQ",
        value: 'SAFETY'
    }]);
    var promiseIntegrity = database.list(reportTableName, [{
        key: column,
        operator: "EQ",
        value: 'INTEGRITY'
    }]);
    var promiseOther = this.getData();

    var securityCount = 0;
    var safetyCount = 0;
    var integrityCount = 0;
    var otherCount = 0;


    return new Promise(function(fulfill, reject){

        promiseSecurity.then(function(item) {
                securityCount = item.length;

                promiseSafety.then(function(item){
                        safetyCount = item.length;

                        promiseIntegrity.then(function(item){
                            integrityCount = item.length;

                            promiseOther.then(function(item){
                                    otherCount = item.Count - (securityCount + safetyCount + integrityCount);

                                    fulfill(
                                        {
                                            stats: {
                                                topics: [
                                                    {name: "SECURITY", count: securityCount },
                                                    {name: "SAFETY",   count: safetyCount   },
                                                    {name: "ETHICS",   count: integrityCount   },
                                                    {name: "OTHER",    count: otherCount    }
                                                ]
                                            }
                                        },
                                        function(error) {
                                            reject(error);
                                        });

                                },
                                function(error) {
                                    reject(error);
                                });
                        })
                    },
                    function(error) {
                        reject(error);
                    });
            },
            function(error) {
                reject(error);
            });
    });

}

// get all of the possible Topic answers
// expects: void
// returns: object
function getTopics() {
    // only load Topics if not already done
    if (theTopics == undefined) {
        // no topic data loaded yet, so do so now
        // step 1 - load all questions data
        var theQuestions = getQuestions();
        // init storage to empty array
        theTopics = [];
        
        // step 2 - find Topic question via location and save each possible answer
        theQuestions[0].possibleAnswers.forEach(function (item) {
            // save each possible answer
            theTopics.push(item.name);
        });
    }
    // generate output
    return theTopics;
}


// load the entire Report dataset (via SCAN op)
// expects: void
// returns: promise
function getData() {
    var getDataPromise = new Promise(function(fulfill, reject) {
        // request - get the Report table
        var params = {
            TableName: reportTableName
        };
        
        // scan the entire Table to fetch entire dataset
        docClient.scan(params, function (err, data) {
            // proper Promise actions
            if (err) {
                reject(err);
            } else {
                fulfill(data);
            }
        });
    });
    // return a promise
    return getDataPromise;
}

function lookupConcern(tipId) {

    var database = SimpleDynamo(
        AWS.config,
        {
            dynamodb: '2016-10-17'
        }
    );

    console.log('--- lookup tipid ' + tipId);

    var promise = database.list(reportTableName, [{
        key: "tip_id",
        operator: "EQ",
        value: tipId
    }]);

    console.log('--- return promise');

    return promise;
}

function getQuestions(dSrc) {
    // apply fallback datasource (specified as constant, above)
    dSrc = (dSrc || defaultDataSource);
    
    // determine requested lookup method
    switch (dSrc) {
        case 'db':
            // using existing DB data (populated previously)
            if (questions !== undefined) {
                // so just provide server output and finish
                console.log("lookup of all questions using method: " + dSrc);
                console.log("currently have: " + questions.length + " questions in memory");
            } else {
                // no stored questions found - strange
                // fallback to default
                questions = getQuestions(defaultDataSource);
            }
            break;
            
        case 'filesystem':
            console.log("lookup of all questions using method: " + dSrc);
            // use filesystem objects to source question data
            var tmp = JSON.parse(fs.readFileSync(allQuestionsFile, 'utf8'));
            // question data expects no array property
            questions = tmp.questions;
            // provide useful server output
            console.log("currently have: " + questions.length + " questions in memory");
            break;
            
        default:
            // unknown input - use default
            questions = getQuestions(defaultDataSource);
    }
    
    // generate output
    return questions;
}

function getFollowups() {

        return followups;
    }

function getAdminNames() {

    var tableName = 'access_filters';
    var column = 'filter_id';

    var database = SimpleDynamo(
        AWS.config,
        {
            dynamodb: '2016-10-17'
        }
    );

    var promiseSecurity = database.list(tableName, [{
        key: column,
        operator: "EQ",
        value: 'admin'
    }]);

    return promiseSecurity;
}

function getFiltersFor(userid) {

    var tableName = 'access_filters';
    var column = 'user_id';

    var database = SimpleDynamo(
        AWS.config,
        {
            dynamodb: '2016-10-17'
        }
    );

    var promiseSecurity = database.list(tableName, [{
        key: column,
        operator: "CONTAINS",
        value: userid
    }]);

    return promiseSecurity;
}

// load static content of app into storage variables for serving later
// expects: void
// returns: void
function initialize() {

    var getDataPromise =
        new Promise(function(fulfill, reject)
        {

            var params = {
                TableName: 'content'
            };

            docClient.scan(params, function (err, data) {
                if (err)
                {
                    reject(err);
                }
                else {

                    fulfill(data);
                }
            });
        });

    getDataPromise.then(
        function(data){

            data.Items.forEach(function(row) {

                switch(row.content_id)
                {
                    case 'help_content':
                        help = JSON.parse(row.data);
                        break;
                    case 'terms_content':
                        terms = JSON.parse(row.data);
                        break;
                    case 'faq_content':
                        faq = JSON.parse(row.data);
                        break;
                    case 'about_content':
                        about = JSON.parse(row.data);
                        break;
                    default:
                        console.log('unknown static data content ' + row.content_id);
                        break;
                }
            });
        },
        function(error){
            console.log('ERROR initializing static content!');
            console.log(error);
        }
    );

}

// return "About this App" JSON content (sourced from DB)
// expects: void
// returns: void
function getAbout() {

    return about;
}

// return "Dashboard FAQ" JSON content (sourced from DB)
// expects: void
// returns: void
function getFaq() {

    return faq;
}

// return "Dashboard Help" JSON content (sourced from DB)
// expects: void
// returns: void
function getHelp() {

    return help;
}

// return "App Privacy Policy & Terms" JSON content (sourced from DB)
// expects: void
// returns: void
function getTerms() {

    return terms;
}

// submit (create) a new Concern in the database
// expects: void
// returns: void
function submit(concern) {
    // initialize the followup thread (empty)
    concern.followupthread = 0;
    
    // build parameter array with spec for DynamoDB PUT operation
    // NOTE: replace uuId everywhere in the application
    var params = {
        TableName: reportTableName,
        Item: fromUuidToReportId(concern)
    };
    
    // run put and handle result
    docClient.put(params, function(err, data) {
        if (err) {
            console.log(JSON.stringify(err, null, 2));
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    });

}

// replace every occurrence of 'uuId' in Concern with 'report_id'
// expects: Concern (object)
// returns: Concern (object)
function fromUuidToReportId(obj) {
    var output = {};
    var newKey = null;
    
    // sanity check
    if ((typeof obj == "object") && (obj !== null)) {
        // real object passed
        Object.keys(obj).forEach(function(key, index) {
            // step 1 - check if current key matches offending 'uuid'
            if (key.toLowerCase() == "uuid") {
                // copy existing value to output with replaced key
                newKey = 'report_id';
            } else {
                // copy existing key and value to output
                newKey = key;
            }
            
            // step 2 - check if current item is itself an object
            if ((typeof obj[key] == "object") && (obj[key] !== null)) {
                // object inside object
                // so recurse function on internal object
                output[newKey] = fromUuidToReportId(obj[key]);
            } else {
                // not an object(ish) so just rename
                output[newKey] = obj[key];
            }
        });
        // finished creating output
        return output;
    }
}

function getQuestion(questionId) {
    // provide useful server data
    console.log("Searching for question ID: " + questionId);
    
    // fetch core information on all questions
    var allQ = getQuestions('filesystem');

    // find the question-overview that matches the given uuId
    // since name property of Overview match filenames
    var qOverview = allQ.find(
        function (qst) {
            // trigger a response when the uuId's match
            return (qst.uuId == questionId);
        }
    );
    
    // handle error condition - no match found
    if (typeof qOverview === 'undefined') {
        // error - no match found
        console.log("!!! No match for question found.");
        qOverview = null;
    } else {
        // provide useful server data
        console.log("Question match: " + qOverview.name);
    }
    
    // return Overview object/null
    return qOverview;
}

function getAnswer(q_uuId, a_uuId) {
    // fetch the question Object
    var qObj = getQuestion(q_uuId);
    // iterate through each of the associated answers for that object
    var aObj = qObj.possibleAnswers.find(
        function (ans) {
            // trigger a response when the report_ids match
            return (ans.uuId == a_uuId);
        }
    );
    // return the answer that matched
    return aObj;
}

function getQuestionTemplate(name, dSrc) {
    // apply fallback datasource (specified as constant, above)
    dSrc = (dSrc || defaultDataSource);
    var qTemplate = null;
    
    // determine how to do lookup based on desired data source
    switch (dSrc) {
        case 'db':
            console.log("Fetching Question template for name: " + name + " from DB");
            // check if templates data already loaded
            if (questionTemplates === undefined) {
                // fail "gracefully"
                qTemplate = null;
            } else {
                // return question Template data
                qTemplate = questionTemplates[name];
            }
            break;
        case 'filesystem':
            console.log("Fetching Question template for name: " + name + " from Filesystem");
            // generate file name with path
            var qFilename = __dirname + questionFilePath + 'q-' + name + '.json';
            console.log("Location: " + qFilename);
            // read and parse file
            qTemplate = JSON.parse(fs.readFileSync(qFilename, 'utf8'));
            break;
        default:
            // run with default data-source applied
            qTemplate = (getQuestionTemplate(name, defaultDataSource));
            break;
    }
    // generate output
    return qTemplate;
}

function getConcernStatus(tipId) {
    console.log("Get current status of Tip: " + tipId);
    
    // placeholder stub
    // TODO: actual code to hit DynamoDB and return promise
    var promise = new Promise(function(fulfill, reject) {
        // stub
        fulfill({ status: 'Placeholder' });
    });
    return promise;
}

function setConcernStatus(tipId, status) {

    var promise = this.lookupConcern(tipId);

    promise.then(function(found) {

        found.status = status;

            var params = {
                TableName:reportTableName,
                Key: {
                    report_id: found.report_id,
                    tip_id: found.tip_id
                },
                UpdateExpression: "set report_status = " + status,
                ReturnValues:"UPDATED_NEW"
            };

        docClient.update(params, function(updated) {
                console.log(updated);
        },
        function(error) {
            console.log(error);
        });

    },
    function(error) {
        console.log("ERROR: Updating concern statuses failed; reports error: " + error);
    });
}

function getAttachments(tipid)
{
    return new Promise(function(fulfill, reject) {
        sdb.getItem('images', tipid, {$AsArrays: true}, function (error, result, meta) {

            console.log('getting images');

            console.log('err \t|' + error);
            console.log('res \t|' + result);
            console.log('meta\t|' + JSON.stringify(meta));

            if (error )
                reject(error);
            else if (result == undefined)
                reject('No results found');
            else
            {
                console.log(JSON.stringify(result));
                fulfill(result);
            }
        })
    });
}

function saveAttachment(tipid, attachment)
{
   var params = {
        localFile: "some/local/file",

        s3Params: {
            Bucket: "squibit-concern-attachments",
            Key: "images/" + tipid
            // other options supported by putObject, except Body and ContentLength.
            // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        },
    };

    var uploader = s3client.uploadFile(params);
    uploader.on('error', function(err) {
        console.error("unable to upload:", err.stack);
    });
    uploader.on('progress', function() {
        console.log("progress", uploader.progressMd5Amount,
            uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
        console.log("done uploading");
    });
}

function addResponse(tipId, response) {

    var promise = this.lookupConcern(tipId);

    promise.then(function(data) {

        var found = data[0];

            var followup = found.followup;

            var followupthread = found.followupthread;

            if (followupthread == undefined)
            {
                followupthread = 1;
                found.followupthread = 1;
            }

            // Thinking about using the thread id to find the request instead
            //   of just using that as an index.
            var expected = followup[followupthread - 1];

            request = expected;

            if (request == undefined)
            {
                request = {
                    thread : followupthread }
                ;
                followup.push(request);
            }

            request.response_date = response.response_date;
            request.response = response.message;

            var params = {
                TableName: reportTableName,
                Key: {
                    report_id: found.report_id,
                    tip_id: found.tip_id
                },
                Item: found,
                ReturnValues:"ALL_NEW"
            };

            docClient.update(params, function(err, data) {
                if (err)
                    console.log(JSON.stringify(err, null, 2));
                else
                    console.log(JSON.stringify(data, null, 2));
            });

        },
        function(error) {
            console.log("ERROR: Updating concern statuses failed; reports error: " + error);
        });
}
    
function addFollowup(tipId, request) {

    var promise = this.lookupConcern(tipId);

    promise.then(function(data) {

        var found = data[0];

            var followup = found.followup;
            followup.push(request);

            found.followupthread = found.followupthread + 1;
            request.thread = found.followupthread;

            var params = {
                TableName: reportTableName,
                Key: {
                    report_id: found.report_id,
                    tip_id: found.tip_id
                },
                Item: found,
                ReturnValues:"ALL_NEW"
            };

            docClient.update(params, function(err, data) {
                if (err)
                    console.log(JSON.stringify(err, null, 2));
                else
                    console.log(JSON.stringify(data, null, 2));
            });

        },
        function(error) {
            console.log("ERROR: Updating concern statuses failed; reports error: " + error);
        });
}

function startMonitor() {

    subscriber.start();
}

function stopMonitor() {

    subscriber.stop();
}

// export functions for external access
module.exports = {

    getCounts: getCounts,

    getAdminNames: getAdminNames,

    getFiltersFor: getFiltersFor,

    getQuestionTemplate: getQuestionTemplate,

    getQuestion: getQuestion,

    getAnswer: getAnswer,

    getTopics: getTopics,

    getData: getData,

    lookupConcern: lookupConcern,

    // Stub - does nothing currently
    getQuestions: getQuestions,

    addResponse: addResponse,
    addFollowup: addFollowup,

    getFollowups: getFollowups,

    getTerms: getTerms,
    getAbout: getAbout,
    getHelp: getHelp,
    getFaq: getFaq,

    initialize: initialize,

    submit: submit,

    setConcernStatus: setConcernStatus,

    saveAttachment: saveAttachment,

    getAttachments: getAttachments,

    startMonitor : startMonitor,
    stopMonitor : stopMonitor,

    getDefaultProgressValues : function () {

    return {
        "weights": [
            {
                "data": [ 2, 22, 37, 52, 62, 72, 82, 88, 92, 96, 100 ],
                "coeff": {
                    "A": 3.6223776,
                    "B": 18.1881119,
                    "C": -0.87062937
                }
            }
        ],
        "issues": [
            {
                "choice": "Theft",
                "uuid": "43a8b029-f547-4235-bb15-39bd4b88b01c",
                "questions_max": 10
            },
            {
                "choice": "Drugs",
                "uuid": "e83f0cde-ed43-4ca2-8992-a5d8052d2829",
                "questions_max": 10
            },
            {
                "choice": "Vandalism",
                "uuid": "cf6a7645-9040-4949-a7b8-1cb2dcee3508",
                "questions_max": 10
            },
            {
                "choice": "Argument",
                "uuid": "85aa270a-ba11-400d-a53b-91904de88b8c",
                "questions_max": 10
            },
            {
                "choice": "Threats",
                "uuid": "15c60f1e-4b4b-4523-ac4c-8850e7147de6",
                "questions_max": 10
            },
            {
                "choice": "Unauthorized Access",
                "uuid": "98506534-fb4c-4d91-9883-b2be9da6050f",
                "questions_max": 10
            },
            {
                "choice": "Weapons",
                "uuid": "98411cb1-66ee-49b4-9384-f8eb70a1edae",
                "questions_max": 10
            },
            {
                "choice": "Unauthorized Activity",
                "uuid": "ff67adad-079c-4569-92ff-2ade3e02dfcd",
                "questions_max": 10
            },
            {
                "choice": "Premises Not Secured",
                "uuid": "da5f1714-2197-4cd9-864d-15976fdd0a3d",
                "questions_max": 10
            },
            {
                "choice": "Trespassing",
                "uuid": "ba83904c-9d27-40cb-b602-fa0e7ffd1df1",
                "questions_max": 10
            },
            {
                "choice": "Device Stolen",
                "uuid": "2e29c42b-5cb5-453f-8734-b374fd7b50e7",
                "questions_max": 10
            },
            {
                "choice": "Password Compromised",
                "uuid": "f83e3179-b680-473a-8f91-ebb4dd6bd15e",
                "questions_max": 10
            },
            {
                "choice": "Clicked a Suspicious Link",
                "uuid": "254a3cd6-9293-4f12-9fdc-9dd6f7a4320c",
                "questions_max": 10
            },
            {
                "choice": "Device Lost",
                "uuid": "78b5b6be-8bff-4e3b-aa71-05079e29df74",
                "questions_max": 10
            },
            {
                "choice": "Social Engineering",
                "uuid": "5ad08d6b-33d7-4ef1-aa7d-b0d4ba771b22",
                "questions_max": 10
            },
            {
                "choice": "Unauthorized Access of Data",
                "uuid": "2993d112-cc98-483e-ad25-2d9b0b0b9533",
                "questions_max": 10
            },
            {
                "choice": "Unauthorized Access of IT Facility",
                "uuid": "fabbd1e7-f40a-4c70-9554-b94dfce67fbf",
                "questions_max": 10
            },
            {
                "choice": "Device Found",
                "uuid": "9916e7eb-460c-4dc9-be65-9edb47bf9fd4",
                "questions_max": 10
            },
            {
                "choice": "Direct Threat",
                "uuid": "05bb0dfc-9f14-4e4b-9e65-6eeed7c124ff",
                "questions_max": 10
            },
            {
                "choice": "Overheard Threat",
                "uuid": "8f8bcd77-15be-4bfb-b356-d88da67b5a14",
                "questions_max": 10
            },
            {
                "choice": "Don't Feel Safe",
                "uuid": "17aaad4e-a4d3-4a69-b1b9-dd76c17eb77a",
                "questions_max": 10
            },
            {
                "choice": "Being Bullied",
                "uuid": "ac81073e-902f-409f-b62c-bb4fdc5fb3a0",
                "questions_max": 10
            },
            {
                "choice": "Descrimination",
                "uuid": "7de13a25-1d47-438a-b027-7f81e8659bab",
                "questions_max": 10
            },
            {
                "choice": "Broken Window",
                "uuid": "d4083870-676f-4aa0-9d7e-9bab14788bd6",
                "questions_max": 10
            },
            {
                "choice": "Broken Lock",
                "uuid": "b1e3bd2f-79cd-4850-a572-5f92c80a955f",
                "questions_max": 10
            },
            {
                "choice": "Spilled Fluid",
                "uuid": "9185fa87-9f20-4d4c-8659-f97a71e174d9",
                "questions_max": 10
            },
            {
                "choice": "Fumes",
                "uuid": "27c5310b-6f0c-4d29-a3c8-30318954135d",
                "questions_max": 10
            },
            {
                "choice": "Hazardous Materials (Hazmat)",
                "uuid": "a36a0b22-54c8-4f97-bbc3-0c31dade555b",
                "questions_max": 10
            },
            {
                "choice": "Electrical Hazard",
                "uuid": "6952475a-5bef-4f3e-806c-29ab302d378d",
                "questions_max": 10
            },
            {
                "choice": "Tripping/Fall Hazard",
                "uuid": "45c70578-634f-4cdb-8de8-bc742a2f223d",
                "questions_max": 10
            },
            {
                "choice": "Fire Hazard",
                "uuid": "68f1ad85-c362-4560-af05-2d1f3f5f467e",
                "questions_max": 10
            },
            {
                "choice": "Dangerous Assembly Process",
                "uuid": "7c8cffd5-83fb-4c62-9b4d-a55e1adf7396",
                "questions_max": 10
            },
            {
                "choice": "Moving Process Dangerous",
                "uuid": "c8b838e0-2569-4b9b-8dd2-1b6c84e6e5c1",
                "questions_max": 10
            },
            {
                "choice": "Safety Protocol Ignored",
                "uuid": "42c61054-3ef8-47ef-9ff6-42b4d3b65ce8",
                "questions_max": 10
            },
            {
                "choice": "In Dangerous Disrepair",
                "uuid": "d890baa4-4d4f-4dfe-a7ee-df71ec3ca72c",
                "questions_max": 10
            },
            {
                "choice": "Item Dangerous to Use (Guard Missing)",
                "uuid": "98ed8f64-5b70-43b2-8ca5-55abb3e686e7",
                "questions_max": 10
            },
            {
                "choice": "Used in Unintended Manner",
                "uuid": "9a400ae6-6b02-4874-8655-a2c080497314",
                "questions_max": 10
            },
            {
                "choice": "Safety Mechanisms Ignored",
                "uuid": "7223a334-c697-4e57-863c-63b1998283a0",
                "questions_max": 10
            },
            {
                "choice": "Safety Mechanisms Deliberately Tampered",
                "uuid": "d0afe13f-d977-46e0-ab31-f3fc1e3dec71",
                "questions_max": 10
            },
            {
                "choice": "Cash Missing",
                "uuid": "564fb823-9d31-41f0-b455-44011ca92f66",
                "questions_max": 10
            },
            {
                "choice": "Steal and Sell (including over-ordering)",
                "uuid": "cbb18521-4fc9-4fa6-9efb-87ebf6d0a6fd",
                "questions_max": 10
            },
            {
                "choice": "Misuse of Credit Card",
                "uuid": "e4f6e61c-e7c2-4b77-bb1f-f4c519027079",
                "questions_max": 10
            },
            {
                "choice": "Fraudulent Accounts or Transactions",
                "uuid": "b9d2b33d-55f0-4d4a-8683-5c8be8a5d2f4",
                "questions_max": 10
            },
            {
                "choice": "Fake Expenses",
                "uuid": "428be2dc-5bab-4ef2-8903-3029588c5af6",
                "questions_max": 10
            },
            {
                "choice": "Bribery",
                "uuid": "aae47775-5a9d-4cdd-ae67-a3625334fa29",
                "questions_max": 10
            },
            {
                "choice": "Dishonesty",
                "uuid": "9f54103a-c4ba-4b0b-9df3-db9ff37b9901",
                "questions_max": 10
            },
            {
                "choice": "Misuse of Confidential Information",
                "uuid": "56740a90-f6a8-467f-b33d-ed33829b7470",
                "questions_max": 10
            },
            {
                "choice": "Discrimination",
                "uuid": "e9230081-ef2d-4e3d-b90c-c680d600caba",
                "questions_max": 10
            },
            {
                "choice": "Compliance Info Not Being Reported",
                "uuid": "09334d26-a2fc-4058-98f6-7ddd26653c9c",
                "questions_max": 10
            },
            {
                "choice": "Data Being Manipulated",
                "uuid": "d66d5006-5e44-4e29-861f-ba19c68c206e",
                "questions_max": 10
            },
            {
                "choice": "Data Being Stored Incorrectly",
                "uuid": "622bf444-2668-41cc-a68c-a4d174b07c81",
                "questions_max": 10
            },
            {
                "choice": "Data Being Used Incorrectly",
                "uuid": "ecc7eabd-a0b0-4b82-9f41-0cb30ea182c2",
                "questions_max": 10
            }
        ]
    };
}

};
