// per: 2.0.0-beta.8 upgrade changelog
//import {Modal, Page, NavController, NavParams} from 'ionic-angular';
import {Component} from '@angular/core';
import {Modal, NavController, NavParams} from 'ionic-angular';

// per: 2.0.0-beta.8 upgrade changelog
//import {Inject, Injectable, OnInit} from 'angular2/core';
import {Inject, Injectable, OnInit} from '@angular/core';
import {QuestionsService} from '../../providers/questions-service/questions-service';
import {AuthenticateService} from '../../providers/authenticate-service/authenticate-service';
import {AboutSquibitPage} from '../about-squibit/about-squibit';
import {TopicListPage} from '../topic-list/topic-list';
import {SelectConcernPage} from '../select-concern/select-concern';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, AuthenticateService],
  templateUrl: 'build/pages/home/home.html',
})
//@Injectable()
export class HomePage {
  static get parameters() {
    return [[NavController], [NavParams], [QuestionsService], [AuthenticateService]];
  }

  constructor(nav, navParams, questionsService, authenticateService) {
    this.nav = nav;
    this.navParams = navParams;
    // If we navigated to this page, we will have a page available as a nav param
    this.navigatedFromPage = navParams.get('page');
    this.questionsService = questionsService;
    this.authenticateService = authenticateService;
  }

  navToAboutModal(event, page = this) {
    let aboutModal = Modal.create(AboutSquibitPage, page);
    this.nav.present(aboutModal);
  }

  navToTopicListPage(event) {
    this.authenticateService.authenticate()
      .subscribe(
        data => this.data = data,
        err => console.error(err),
        () => {

          this.questionsService.topicList
            .subscribe(
              data => this.topicList = data,
              err => console.error(err),
              () => {
        
                this.nav.push(TopicListPage, {
                  page: this,
                  topicList: this.topicList,
                }, this.questionsService);
        
              }
            );
        
        }
      );
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
