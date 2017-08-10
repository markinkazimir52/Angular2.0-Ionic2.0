###
### CONFIGURATION FILE SPECIFICATION - FOR BACKEND API SERVER
###
### NOTES:
###       - all elements in this file may be processed by JSON.parse()
###         so any strings should be quoted as follows:
###            KEY='"value"'
###         which will be parsed properly.
###       
###       - acceptable types in configuration variables:
###            strings, ints, arrays, objects, arrays of objects, booleans
###

# configuration name (string)
CONFIG_NAME=

# debug trigger (string, NOT REQUIRED)
# (should take the form: DEBUG=arbor:* for npm 'debug' module to fire)
# (debug module is like console.log() but better & turns off if no DEBUG=arbor:* def)



### ---------------------------------------------------------------------------
### SERVER CONFIGURATION

# server port - unique value for API server (int)
SRV_PORT=

# session setup - cookie encryption secret (string)
SRV_SESSION_SECRET=

# session setup - cookie name
SRV_SESSION_NAME=



### ---------------------------------------------------------------------------
### DATABASE & DATA SORUCE CONFIG

# AWS SDK setup - (strings)
AWS_ACCESS_KEY=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# default data source for question objects
API_DEFAULT_DATASOURCE=



### ---------------------------------------------------------------------------
### MOBILE APPLICATION CONFIG

# CORS setup - accepted origins (array or boolean)
APP_CORS_ORIGINS=



### ---------------------------------------------------------------------------
### DASHBOARD CONFIG

# CORS setup - accepted origins (array or boolean)
DASH_CORS_ORIGINS=



### DONE
### read-by: 'dotenv-safe'