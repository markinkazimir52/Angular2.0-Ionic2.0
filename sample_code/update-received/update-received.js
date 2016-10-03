// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {AlertController, NavController, NavParams, ViewController} from 'ionic-angular';
import {Inject, Injectable, OnInit} from '@angular/core';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {PeopleService} from '../../providers/people-service/people-service';
import {HomePage} from '../../pages/home/home';
import {TopicListPage} from '../topic-list/topic-list';
import {SelectConcernPage} from '../../pages/select-concern/select-concern';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, PeopleService],
  templateUrl: 'build/pages/update-received/update-received.html',
})
export class UpdateReceivedPage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController], [QuestionsService], [PeopleService], [AlertController]];
  }

  constructor(viewCtrl, navParams, nav, questionsService, peopleService, alertCtrl) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    this.questionsService = questionsService;
    this.peopleService = peopleService;
    this.alertCtrl = alertCtrl;
    
    // stored human-readable Tip ID from Concern submission
    this.tip_id = navParams.get('tip_id');
    

    this.quote = {
      title: 'Update Received!',
      description: 'We appreciate your help in building A Better Workplace Neighborhood.'
    }
  }

  ngOnInit() {
  /*
    this.questionsService.data
      .subscribe(
        data => this.questions = data
      );
    this.peopleService.data
      .subscribe(
        data => this.people = data
      );
  */
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  helpTapped(event) {
    let alert = this.alertCtrl.create({
        title: 'Need help?',
        message: 'Your report has been submitted! Record your squibit ID for future reference; you\'ll need it to access any previously submitted reports.',
        buttons: ['Okay']
      });

      alert.present();
  }

  navToHomePage(event) {
    this.nav.push(HomePage, {
      page: this
    });
  }

  navToSelectConcern() {
    this.nav.push(SelectConcernPage, {
      page: this
    }); 
  }
}
