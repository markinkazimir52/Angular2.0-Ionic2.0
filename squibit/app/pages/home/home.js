// per: 2.0.0-beta.8 upgrade changelog
//import {Modal, Page, NavController, NavParams} from 'ionic-angular';
import {Component} from '@angular/core';
import {Modal, NavController, NavParams} from 'ionic-angular';

// per: 2.0.0-beta.8 upgrade changelog
//import {Inject, Injectable, OnInit} from 'angular2/core';
import {Inject, Injectable, OnInit} from '@angular/core';
import {QuestionsService} from '../../providers/questions-service/questions-service';
import {PeopleService} from '../../providers/people-service/people-service';
import {ShareService} from '../../providers/share-service/share-service';

import {AboutSquibitPage} from '../about-squibit/about-squibit';
import {TopicListPage} from '../topic-list/topic-list';
import {SelectConcernPage} from '../select-concern/select-concern';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, PeopleService],
  templateUrl: 'build/pages/home/home.html',
})
//@Injectable()
export class HomePage {
  static get parameters() {
    return [[NavController], [NavParams], [QuestionsService], [PeopleService], [ShareService]];
  }

  constructor(nav, navParams, questionsService, peopleService, shareService) {
    this.nav = nav;
    this.navParams = navParams;
    // If we navigated to this page, we will have a page available as a nav param
    this.navigatedFromPage = navParams.get('page');
    this.questionsService = questionsService;
    this.peopleService = peopleService;
    this.shareService = shareService;
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

  navToAboutModal(event, page = this) {
    let aboutModal = Modal.create(AboutSquibitPage, page);
    this.nav.present(aboutModal);
  }

  navToTopicListPage(event) {
    let rightNow = new Date();
    let nowMins = "00";
    let nowHours = "00";
    let nowLabel = "AM";
    if (rightNow.getMinutes() < 10) {
        nowMins = "0" + rightNow.getMinutes();
    } else {
            nowMins = rightNow.getMinutes();
        }
    if (rightNow.getHours() > 12) {
        nowHours = (rightNow.getHours() % 12);
        nowLabel = "PM";
    } else {
        nowHours = rightNow.getHours();
    }
    //this.startTime = new Date().toISOString();
    this.startTime = (rightNow.getMonth() + 1) + "/" + rightNow.getDate() + "/" + rightNow.getFullYear() + " at " + nowHours + ":" + nowMins + " " + nowLabel;
    console.log("start time: " + this.startTime);
    this.shareService.setStartTime(this.startTime);

    this.nav.push(TopicListPage, {
      page: this,
      questions: this.questions,
      people: this.people
    }, this.questionsService, this.peopleService);
  }

  navToUpdateConcernModal(event, page = this) {
    let updateModal = Modal.create(SelectConcernPage, page);
    this.nav.present(updateModal);
  }

  navToSelectConcern() {
    this.nav.push(SelectConcernPage, {
      page: this
    });
  }
}
