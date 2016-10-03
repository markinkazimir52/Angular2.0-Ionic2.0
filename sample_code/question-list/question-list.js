// per: 2.0.0-beta.8 upgrade changelog
//import {Alert, Page, NavController, NavParams} from 'ionic-angular';
import {Component} from '@angular/core';
import {AlertController, Modal, NavController, ViewController, NavParams} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {PeopleService} from '../../providers/people-service/people-service';
import {ShareService} from '../../providers/share-service/share-service';

import {QuestionCardPage} from '../question-card/question-card';
// removed since not extant yet
import {SubmitConcernPage} from '../submit-concern/submit-concern';
import {HomePage} from '../home/home';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, PeopleService, ShareService],
  templateUrl: 'build/pages/question-list/question-list.html',
})

export class QuestionListPage {
  static get parameters() {
    return [[NavController], [NavParams], [QuestionsService], [PeopleService], [ShareService], [AlertController]];
  }

  constructor(nav, navParams, questionsService, peopleService, shareService, alertCtrl) {
    this.nav = nav;
    this.navParams = navParams;
    this.navigatedFromPage = navParams.get('page');
    this.selectedItem = navParams.get('item');
    this.questions = navParams.get('questions');
    this.questionIndex = _.findIndex(this.questions, {'headline': 'Please elaborate'});
    this.question = this.questions[this.questionIndex];    
    this.isAnswered = [];
    this.shareService = shareService;
    this.alertCtrl = alertCtrl;

    this.calcProgress();
  }

  calcProgress() {
    /* This is to get progress bar value and completed button option temporarily.
       You need to update this code with real data     */
    switch (this.question.acceptedAnswerList.length) {
      case 1:
        this.question.progress = 22;
        break;
      case 2:
        this.question.progress = 37;
        break;
      case 3:
        this.question.progress = 52;
        break;
      case 4:
        this.question.progress = 62;
        break;
      case 5:
        this.question.progress = 72;
        break;
      case 6:
        this.question.progress = 82;
        break;
      case 7:
        this.question.progress = 88;
        break;
      case 8:
        this.question.progress = 92;
        break;
      case 9:
        this.question.progress = 96;
        break;
      case 10:
        this.question.progress = 100;
        break;
      default:
        // default is 1% so it will always show something on the progress bar
        this.question.progress = 1;
    }

  }

  helpTapped(event) {
    let alert = this.alertCtrl.create({
        title: 'Need help?',
        message: this.question.about.description,
        buttons: ['Okay']
    });
    alert.present();
  }

  itemTapped(event, item) {
    // this.question.acceptedAnswerList.push(item);
    this.nav.push(QuestionCardPage, {
      item: item,
      page: this,
      questions: this.questions
    });
  }

  saveTapped(event) {
    let bodyText = '';
    let navTarget = null;
    let whatItem = this.question.suggestedAnswerList[_.findIndex(this.question.suggestedAnswerList, {'headline': 'What happened?'})];
    let whatQuestion = this.questions[_.findIndex(this.questions, {'headline': 'What happened?'})];
    let whatTextAnswer = whatQuestion.acceptedAnswerList[_.findIndex(whatQuestion.acceptedAnswerList, whatQuestion.acceptedAnswerList.hasTextArea)];

    if (whatTextAnswer === whatQuestion.placeholder) {
      let alert = this.alertCtrl.create({
        title: 'Making progress',
        body: 'Please let us know what happened so we can assist.',
        buttons: ['Okay']
      });
      setTimeout(
        () => {
          // alert.present();
      }, 1000);
      this.itemTapped(new Event('submitEmpty'), whatItem);
    } else {
      this.nav.push(SubmitConcernPage, {
        item: whatItem,
        page: this,
        questions: this.questions,
        index: this.questionIndex,
        people: this.people
      });
    }
  }

  nextTapped(event) {
    let whatItem = this.question.suggestedAnswerList[_.findIndex(this.question.suggestedAnswerList, {'headline': 'What happened?'})];
    this.itemTapped(new Event('submitEmpty'), whatItem);
  }

  trashTapped(event) {
    console.log("User requesting to clear entire Concern...");
    let confirm = this.alertCtrl.create({
      title: 'Cancel your report?',
      message: 'Are you sure you want to cancel and start over?  This cannot be undone.',
      cssClass: 'trash-alert',
      buttons: [{
        text: 'Keep answering',
        handler: () => {
          console.log('Cancelled');
      }}, {
        text: 'Yes, I\'m sure',
        handler:
          () => {
            console.log('Clear action confirmed by user - removing ALL answers.');
            // TODO Delete everything related to this concern.
            // clear the topic selected
            this.shareService.clearTopic();
            this.nav.setRoot(HomePage);
          }
      }]
    });
    confirm.present();
  }  
}
