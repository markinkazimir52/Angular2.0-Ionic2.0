// per: 2.0.0-beta.8 upgrade changelog
//import {Modal, Page, NavController, NavParams, Backdrop} from 'ionic-angular';
import {Component} from '@angular/core';
import {Modal, NavController, NavParams, Backdrop} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {PeopleService} from '../../providers/people-service/people-service';
import {ShareService} from '../../providers/share-service/share-service';

import {AboutSquibitPage} from "../about-squibit/about-squibit";
import {UpdateConcernPage} from "../update-concern/update-concern";
import {QuestionListPage} from '../question-list/question-list';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, PeopleService],
  templateUrl: 'build/pages/topic-list/topic-list.html',
})
export class TopicListPage {
  static get parameters() {
    return [[NavController], [NavParams], [QuestionsService], [PeopleService], [ShareService]];
  }

  constructor(nav, navParams, questionsService, peopleService, shareService) {
    this.nav = nav;
    this.navParams = navParams;
    this.navigatedFromPage = navParams.get('page');
    this.selectedItem = navParams.get('item');
    this.questions = navParams.get('questions');
    this.people = navParams.get('people');
    this.questionsService = questionsService;
    this.peopleService = peopleService;
    this.questionIndex = _.findIndex(this.questions, {'headline': 'Concerned about?'});
    this.question = this.questions[this.questionIndex];
    this.shareService = shareService;
    this.answeredTopic = this.shareService.getTopic();
  }

  presentInfoBackdrop() {
    this.nav.loaded().then(() => {
      this.backdrop.retain();
      timeout(function() {
        this.backdrop.release();
      }, 1000);
    });
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
    this.question.acceptedAnswerList.push(item);

    this.shareService.setTopic(item.name);
    setTimeout(() => {
        this.answeredTopic = this.shareService.getTopic();
    }, 1000);

    this.nav.push(QuestionListPage, {
      item: item,
      page: this,
      questions: this.questions
    });

    // this.nav.push(QuestionListPage, {
    //   item: item,
    //   page: this,
    //   questions: this.questions
    // });
  }
}
