//import {Injectable} from 'angular2/core';
//import {Http} from 'angular2/http';
import {Injectable} from '@angular/core';
import {Http, Headers, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

//let apiUrl = 'https://squibit-test.firebaseio.com/data/report.json?auth=Cz2g0u0LZ1UwGcYOpgHlGbVdGjX7XUzxsVieoJvz';    // <-- testing server
let apiUrl = 'https://squibit-b16d0.firebaseio.com/data/report.json?auth=tLqDVJ2km9oFKDbnZywWceXn86ag7JwQQfyvpFkM';     // <-- demo server

@Injectable()
export class ConcernService {
  static get parameters() {
    return [[Http]];
  }

  constructor(http) {
    this.http = http;
    this.data = http.get(apiUrl)
      .map(response => response.json())
      .catch(this.handleError);
  }

  findAll() {
    return this.data;
  }

  postConcern(data) {
    let body = JSON.stringify(data);
    let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    let options = new RequestOptions({ headers: headers });
    return this.http.post(apiUrl, body, options)
        .map(res => res.json())
        .catch(this.handleError);
  }

  handleError(error) {
    console.error(error);
    return Observable.throw(error.json().error || 'Server error');
  }
}
