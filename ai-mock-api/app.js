// =============================================================================
// APPLICATION SERVER - CONFIGURATION

// first action - load configuration data from .ENV file
//  - config file: conf.env
//  - config file spec: conf.env.spec
require('dotenv-safe').load({
  allowEmptyValues: false,
  sample: './config/config.spec',
  silent: false,
  path: './config/config.env'
});



// =============================================================================
// APPLICATION SERVER - MODULE LOADING

// load core modules
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var genuuid = require('node-uuid');
var debug = require('debug')('arbor:api-master');

// security module
var helmet = require('helmet');

// test data
var dataStore = require('./modules/aws-data-store');

// CORS handler
var cors = require('cors');



// =============================================================================
// SERVER ROUTES - HANDLER INCLUDES

// basic API endpoints
var root = require('./routes/index');

// API endpoints - GET handlers
var authenticate = require('./routes/app/authenticate');
var topicList = require('./routes/app/topic-list');
var issueList = require('./routes/app/issue-list');
var nextQuestion = require('./routes/app/next-question');
var prevQuestion = require('./routes/app/prev-question');
var affiliation = require('./routes/app/affiliation');
var progress = require('./routes/app/progress');
var terms = require('./routes/app/terms');
var about = require('./routes/app/about');

var dashboard_stats = require('./routes/dashboard/stats');
var dashboard_topic_list = require('./routes/dashboard/topic-list');
var dashboard_concern_list = require('./routes/dashboard/concern-list');
var dashboard_question_list = require('./routes/dashboard/question-list');
var dashboard_help = require('./routes/dashboard/help');
var dashboard_faq = require('./routes/dashboard/faq');

// API endpoints - POST handlers
var addAnswer = require('./routes/app/add-answer');
var addAttachment = require('./routes/app/add-attachment');
var lookupConcern = require('./routes/app/lookup-concern');
var updateConcern = require('./routes/app/update-concern');

var access = require('./routes/dashboard/access');
var dashboard_topic_lookup = require('./routes/dashboard/topic-lookup');
var dashboard_concern_lookup = require('./routes/dashboard/concern-lookup');
var dashboard_followup_lookup = require('./routes/dashboard/followup-lookup');
var dashboard_followup_submit = require('./routes/dashboard/followup-submit');
var dashboard_followup_response_submit = require('./routes/dashboard/followup-response-submit');
var dashboard_concern_status = require('./routes/dashboard/concern-status');
var dashboard_attachment_lookup = require('./routes/dashboard/attachment-lookup');
var dashboard_filter = require('./routes/dashboard/filter');
var report_stream = require('./routes/dashboard/report-stream');



// =============================================================================
// APPLICATION SERVER - INITIALIZATION

// start datastore connections
dataStore.initialize();

// start Express framework
var app = express();



// =============================================================================
// APPLICATION SERVER - MIDDLEWARE CONFIGURATION

// set up CORS options for different API areas - Dashboard
var corsDashOptions = {
  origin: JSON.parse(process.env.DASH_CORS_ORIGINS),
  methods: ['GET', 'POST', 'PUT'],
  credentials: true,
  preflightContinue: false,
  allowedHeaders: ['Authorization', 'X-Requested-With', 'Content-Type', 'Accept', 'Cookie', 'Origin']
};

// set up CORS options for different API areas - App
var corsAppOptions = {
  origin: JSON.parse(process.env.APP_CORS_ORIGINS),
  methods: ['GET', 'POST'],
  credentials: true,
  preflightContinue: false,
  allowedHeaders: ['Authorization', 'X-Requested-With', 'Content-Type', 'Accept', 'Cookie', 'Origin']
};

// set up server session options - Dashboard
var sessionOpts = {
    // unique name for session cookie
    name: JSON.parse(process.env.SRV_SESSION_NAME),
    // secret for encrypting cookie
    secret: JSON.parse(process.env.SRV_SESSION_SECRET),
    unset: 'destroy',
    resave: false,
    rolling: true,
    saveUninitialized: true,
    // use specific UUID generation function for session IDs
    genid: function(req) {
        return genuuid.v4();
    },
    // session ID cookie details
    cookie: {
        httpOnly: false,
        maxAge: (60 * 10 * 1000)
    }
};

// custom middleware - disable any HTTP 304 cache behavior
// from: https://goo.gl/Tgvm3w
app.use(function(req, res, next) {
    req.headers['if-none-match'] = 'no-match-for-this';
    next();
});

// middleware initialization
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionOpts));



// =============================================================================
// SERVER SECURITY ENHANCEMENTS

// disable "X-powered-by: Express" header inclusion in responses
//app.disable('x-powered-by');

// enable key parts of Helmet security module
// see: https://goo.gl/rgg2ee
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.hidePoweredBy());
app.use(helmet.frameguard());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy());

// aggressively disable client-side caching
// TODO: does this make sense?
//   - since this is an API server, it should - caching of anything is bad
//   - only impact is current static App sourcing
app.use(helmet.noCache());



// =============================================================================
// SERVER ROUTES - HANDLER FUNCTIONS AND MIDDLEWARE CONNECTIONS

// APP Client - static content (load everything from this directory as the root)
// TODO: remove this when CORS is working right
app.use('/', express.static(__dirname + '/client'));


// GET endpoints
// Client
app.use('/api/v2/', root);
app.use('/api/v2/terms', cors(corsAppOptions), terms);
app.use('/api/v2/about', cors(corsAppOptions), about);
app.use('/api/v2/topic-list', cors(corsAppOptions), topicList);
app.use('/api/v2/issue-list', cors(corsAppOptions), issueList);
app.use('/api/v2/next-question', cors(corsAppOptions), nextQuestion);
app.use('/api/v2/prev-question', cors(corsAppOptions), prevQuestion);
app.use('/api/v2/progress', cors(corsAppOptions), progress);

// Dashboard
app.use('/api/v2/dashboard/stats', cors(corsDashOptions), dashboard_stats);
app.use('/api/v2/dashboard/topic-list', cors(corsDashOptions), dashboard_topic_list);
app.use('/api/v2/dashboard/concern-list', cors(corsDashOptions), dashboard_concern_list);
app.use('/api/v2/dashboard/question-list', cors(corsDashOptions), dashboard_question_list);
app.use('/api/v2/dashboard/help', cors(corsDashOptions), dashboard_help);
app.use('/api/v2/dashboard/faq', cors(corsDashOptions), dashboard_faq);
app.use('/api/v2/dashboard/access', cors(corsDashOptions), access);


// POST endpoints
// Client
app.use('/api/v2/authenticate', cors(corsAppOptions), authenticate);
app.use('/api/v2/affiliation', cors(corsAppOptions), affiliation);
app.use('/api/v2/add-answer', cors(corsAppOptions), addAnswer);
app.use('/api/v2/add-attachment', cors(corsAppOptions), addAttachment);
app.use('/api/v2/lookup-concern', cors(corsAppOptions), lookupConcern);
app.use('/api/v2/update-concern', cors(corsAppOptions), updateConcern);

// Dashboard
app.use('/api/v2/dashboard/topic-lookup', cors(corsDashOptions), dashboard_topic_lookup);
app.use('/api/v2/dashboard/concern-lookup', cors(corsDashOptions), dashboard_concern_lookup);
app.use('/api/v2/dashboard/followup-lookup', cors(corsDashOptions), dashboard_followup_lookup);
app.use('/api/v2/dashboard/followup-submit', cors(corsDashOptions), dashboard_followup_submit);
app.use('/api/v2/dashboard/followup-response-submit', cors(corsDashOptions), dashboard_followup_response_submit);
app.use('/api/v2/dashboard/concern-status', cors(corsDashOptions), dashboard_concern_status);
app.use('/api/v2/dashboard/attachment-lookup', cors(corsDashOptions), dashboard_attachment_lookup);

app.use('/api/v2/dashboard/filter', cors(corsDashOptions), dashboard_filter);
app.use('/api/v2/dashboard/report-stream', cors(corsDashOptions), report_stream);



// =============================================================================
// APPLICATION SERVER - ERROR HANDLER OUTPUT

// catch 404 and forward to error handler
app.use(function errFourZeroFour(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// server error handler
app.use(function errorHandler(err, req, res, next) {
    // set default server-error ID (500) unless otherwise set
    res.status(err.status || 500);
    // only show the error content (stacktrace) if in development mode
    var errContent = {};
    if (app.get('env') === 'development') {
        // allow error stacktrace to be shown
        errContent = err;
    }
    // generate output as JSON
    res.json({
        message: err.message,
        error: errContent
    });
});


module.exports = app;
