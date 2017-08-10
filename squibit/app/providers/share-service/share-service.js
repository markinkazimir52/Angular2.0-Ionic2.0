//import {Injectable} from 'angular2/core';
//import {Http} from 'angular2/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class ShareService {

	constructor() {
		this.answeredTopic = "";
		this.startTime = "";
	}

	setTopic(answeredTopic) {
		this.answeredTopic = answeredTopic;
	}

	getTopic() {	
		return this.answeredTopic;
	}

    clearTopic() {
        this.answeredTopic = "";
    }
    
	setStartTime(startTime) {
		this.startTime = startTime;
	}

	getStartTime() {
		return this.startTime;
	}
}