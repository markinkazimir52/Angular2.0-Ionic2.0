// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Alert, NavController, NavParams, ViewController} from 'ionic-angular';
import {Inject, Injectable, OnInit} from '@angular/core';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {PeopleService} from '../../providers/people-service/people-service';
import {HomePage} from '../../pages/home/home';
import {TopicListPage} from '../topic-list/topic-list';
import {SelectConcernPage} from '../../pages/select-concern/select-concern';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, PeopleService],
  templateUrl: 'build/pages/concern-received/concern-received.html',
})
export class ConcernReceivedPage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController], [QuestionsService], [PeopleService]];
  }

  constructor(viewCtrl, navParams, nav, questionsService, peopleService) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    this.tip_id = navParams.get('tip_id');
    this.questionsService = questionsService;
    this.peopleService = peopleService;
    
    // stored human-readable Tip ID from Concern submission
    this.tip_id = navParams.get('tip_id');
    

    this.quote = {
      title: 'Concern Received!',
      description: 'We appreciate your help in building A Better Workplace Neighborhood.'
    }
  }

  ngOnInit() {
    this.questionsService.data
      .subscribe(
        data => this.questions = data
      );
    this.peopleService.data
      .subscribe(
        data => this.people = data
      );
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  helpTapped(event) {
    let alert = Alert.create({
        title: 'Need help?',
        message: 'Your report has been submitted! Record your squibit ID for future reference; you\'ll need it to access any previously submitted reports.',
        buttons: ['Okay']
      });

      this.nav.present(alert);
  }

  navToTopicListPage(event) {
    this.nav.push(TopicListPage, {
      page: this,
      questions: this.questions,
      people: this.people
    }, this.questionsService, this.peopleService);
  }

  navToSelectConcern() {
    this.nav.push(SelectConcernPage, {
      page: this
    }); 
  }
}
