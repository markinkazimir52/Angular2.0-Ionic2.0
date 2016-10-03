// per: 2.0.0-beta.8 upgrade changelog
//import {Modal, Page, NavController, NavParams, Backdrop} from 'ionic-angular';
import {Component, OnInit} from '@angular/core';
import {Modal, NavController, NavParams} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {AnswerService} from '../../providers/answer-service/answer-service';

import {AboutSquibitPage} from "../about-squibit/about-squibit";
import {UpdateConcernPage} from "../update-concern/update-concern";
import {IssueListPage} from '../issue-list/issue-list';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, AnswerService],
  templateUrl: 'build/pages/topic-list/topic-list.html',
})
export class TopicListPage {
  static get parameters() {
    return [[NavController], [NavParams], [QuestionsService], [AnswerService]];
  }

  constructor(nav, navParams, questionsService, answerService) {
    this.nav = nav;
    this.navParams = navParams;
    this.navigatedFromPage = navParams.get('page');
    this.topicList = navParams.get('topicList');

    this.questionsService = questionsService;
    this.answerService = answerService;
  }

  navToUpdateConcernModal(event, page = this) {
    let updateModal = Modal.create(UpdateConcernPage, page);
    this.nav.present(updateModal);
  }

  navToAboutModal(event, page = this) {
    let aboutModal = Modal.create(AboutSquibitPage, page);
    this.nav.present(aboutModal);
  }

  itemTapped(event, item) {

    let params = {
      q_uuid: this.topicList.uuId,
      user_answers: [
        {
          a_uuid: item.uuId,
          selected: true
        }
      ]
    }

    this.answerService.addAnswer(params)
      .subscribe(
        data => this.data = data,
        err => console.error(err),
        () => {

          _.each(this.topicList.answers, (
            (item) => {
              item.value.selected = false;
            }
          ));
          item.value.selected = true;
          
          this.questionsService.issueList
            .subscribe(
              data => this.issueList = data,
              err => console.error(err),
              () => {

                this.nav.push(IssueListPage, {
                  item: item,
                  page: this,
                  issueList: this.issueList
                });

              }
            );          
        }
      )

  }
}
