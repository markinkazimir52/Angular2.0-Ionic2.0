// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';

@Component({
  templateUrl: 'build/pages/question-grid/question-grid.html',
})
export class QuestionGridPage {
  static get parameters() {
    return [[NavController]];
  }

  constructor(nav) {
    this.nav = nav;
  }
}
