//import {Injectable} from 'angular2/core';
//import {Http} from 'angular2/http';
import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

let apiUrl = 'mock-api/people.json';

@Injectable()
export class PeopleService {
  static get parameters() {
    return [[Http]];
  }

  constructor(http) {
    this.data = http.get(apiUrl)
      .map(response => response.json())
      .catch(this.handleError);
  }

  findAll() {
    return this.data;
  }

  handleError(error) {
    console.error(error);
    return Observable.throw(error.json().error || 'Server error');
  }
}
