import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

// core API endpoint
//let apiUpdateRootURL = 'https://squibit-test.firebaseio.com/data/';   // <-- testing server
let apiUpdateRootURL = 'https://squibit-b16d0.firebaseio.com/data/';    // <-- demo server

// authentication parameter
//let apiAuthParam = 'auth=Cz2g0u0LZ1UwGcYOpgHlGbVdGjX7XUzxsVieoJvz';   // <-- testing server
let apiAuthParam = 'auth=tLqDVJ2km9oFKDbnZywWceXn86ag7JwQQfyvpFkM';     // demo server
// search and data object parameters
let apiShallowParam = 'shallow=true';
let apiKeySearchParam = 'orderBy="$key"';
let apiKeySearchValueParam = 'equalTo=';
let apiFetchLastOnlyParam = 'limitToLast=1';
let apiConcernObj = 'report';
let apiRequestObj = 'request';
let apiResponseObj = 'response';
let apiUpdateObj = 'updates';
let apiEndpointRef = '.json';



@Injectable()
export class UpdateService {
  static get parameters() {
    return [[Http]];
  }

  constructor(http) {
    // make HTTP accessible within service
    this.http = http;
  }

  // look up a specified Concern (via Firebase ID), if it exists
  // HTTP vert: GET
  // target: report.json
  lookupConcernByFirebaseID(concernFirebaseID) {
    // possible firebaseID provided - check to see if firebase ID exists in database
    // build query
    let apiQuery = '';
    // add object reference via URL
    apiQuery += apiUpdateRootURL + apiConcernObj + apiEndpointRef;
    // add search parameters
    apiQuery += "?" + apiAuthParam;
    apiQuery += "&" + apiKeySearchParam;
    apiQuery += "&" + apiKeySearchValueParam + '"' + concernFirebaseID + '"';
    
    // run query
    console.log("API query: " + apiQuery);
    let firebaseIDSearch = this.http.get(apiQuery)
                               .map(response => response.json())
                               .catch(this.handleError);
    // return output to user
    return firebaseIDSearch;
  }
  
  // look up last update for a specific concern, if it exists
  // HTTP verb: GET
  // target: report/<firebaseID>/updates.json
  lookupLastConcernUpdate(concernFirebaseID) {
    // possible firebaseID provided - check to see if firebase ID exists in database
    // build query
    let apiQuery = '';
    apiQuery += apiUpdateRootURL + apiConcernObj;
    apiQuery += '/' + concernFirebaseID + '/';
    apiQuery += apiUpdateObj + apiEndpointRef;
    // add parameters
    apiQuery += "?" + apiAuthParam;
    apiQuery += "&" + apiKeySearchParam;
    apiQuery += "&" + apiFetchLastOnlyParam;
    
    // run query
    console.log("API query: " + apiQuery);
    let firebaseUpdateSearch = this.http.get(apiQuery)
                                   .map(response => response.json())
                                   .catch(this.handleError);
    // return output to user
    return firebaseUpdateSearch;
  }
  
  // create a new unsolicited user update
  // HTTP verb: POST
  // target: report/<firebaseID>/updates.json
  createUnsolicitedUpdate(concernFirebaseID, userResponseObj) {
    // build query
    let apiQuery = '';
    apiQuery += apiUpdateRootURL + apiConcernObj;
    apiQuery += '/' + concernFirebaseID + '/';
    apiQuery += apiUpdateObj + apiEndpointRef;
    // add parameters
    apiQuery += "?" + apiAuthParam;
    
    // build body and headers
    let body = JSON.stringify({"response": userResponseObj});
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    let options = new RequestOptions({ headers: headers });
    
    // run query including body
    console.log("API query: " + apiQuery);
    let firebaseUnsolicitedUpdate = this.http.post(apiQuery, body, options)
                                        .map(response => response.json())
                                        .catch(this.handleError);
    // return output to user
    return firebaseUnsolicitedUpdate;
  }
  
  // create a new unsolicited user update
  // HTTP verb: PATCH
  // target: report/<firebaseID>/updates/<firebaseID>.json
  answerSolicitedUpdate(concernFirebaseID, updateFirebaseID, userResponseObj) {
    // build query
    let apiQuery = '';
    apiQuery += apiUpdateRootURL + apiConcernObj;
    apiQuery += '/' + concernFirebaseID + '/';
    apiQuery += apiUpdateObj;
    apiQuery += '/' + updateFirebaseID + apiEndpointRef;
    // add parameters
    apiQuery += "?" + apiAuthParam;
    
    // make "response" status object
    //let respObj = {apiResponseObj: userResponseObj};
		let respObj = {"response": false};
		respObj.response = userResponseObj;
    
    // build body and headers
    let body = JSON.stringify(respObj);
		console.log("body: " + body);
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    let options = new RequestOptions({ headers: headers });
    
    // run query including body
    console.log("API query: " + apiQuery);
    let firebaseUnsolicitedUpdate = this.http.patch(apiQuery, body, options)
                                        .map(response => response.json())
                                        .catch(this.handleError);
    // return output to user
    return firebaseUnsolicitedUpdate;
  }
  
  // update "Viewed" 
  // HTTP verb: PATCH
  // target: report/<firebaseID>/updates/<firebaseID>/request.json
  setExistingUpdateRequestViewedStatus(concernFirebaseID, updateFirebaseID) {
    // build query
    let apiQuery = '';
    apiQuery += apiUpdateRootURL + apiConcernObj;
    apiQuery += '/' + concernFirebaseID + '/';
    apiQuery += apiUpdateObj;
    apiQuery += '/' + updateFirebaseID;
    apiQuery += '/' + apiRequestObj + apiEndpointRef;
    // add parameters
    apiQuery += "?" + apiAuthParam;
    
    // make viewed status object
    let viewedObj = {"viewed": true};
    
    // build body and headers
    let body = JSON.stringify(viewedObj);
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    let options = new RequestOptions({ headers: headers });
    
    // run query including body
    console.log("API query: " + apiQuery);
    let firebaseUnsolicitedUpdate = this.http.patch(apiQuery, body, options)
                                        .map(response => response.json())
                                        .catch(this.handleError);
    // return output to user
    return firebaseUnsolicitedUpdate;
  }
  
  // error handler
  handleError(error) {
    console.error(error);
    return Observable.throw(error.json().error || 'Server error');
  }
}
