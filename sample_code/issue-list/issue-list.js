// per: 2.0.0-beta.8 upgrade changelog
import {Component, OnInit} from '@angular/core';
import {Modal, NavController, NavParams} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {AnswerService} from '../../providers/answer-service/answer-service';
import {QuestionSlidePage} from '../question-slide/question-slide';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, AnswerService],
  templateUrl: 'build/pages/issue-list/issue-list.html'
})
export class IssueListPage {
  static get parameters() {
    return [[NavController], [NavParams], [QuestionsService], [AnswerService]];
  }

  constructor(nav, navParams, questionsService, answerService) {
    this.nav = nav;
    this.navParams = navParams;
    this.navigatedFromPage = navParams.get('page');
    this.selectedItem = navParams.get('item');
    this.issueList = navParams.get('issueList');    
    this.questionsService = questionsService;
    this.answerService = answerService;

    this.groupedAnswers = this.groupBy(this.issueList.answers, function(item) {
      return [item.category];
    });
  }

  ngOnInit() {
    
  }

  // handle faux Back button
  backTapped() {
    // go back to previous page - "topic-list"
    // step 1 - trigger GET action on that page
    this.questionsService.topicList
            .subscribe(
              data => { console.log("placeholder /topic-list call"); },
              err => console.error(err),
              () => {
                        // step 2 - navigate to "topic-list" page
                        this.nav.pop();
                    }
            );  
  }

  // handle groups of issue items
  groupBy( array , f ) {
    let groups = {};
    array.forEach( function( o ) {
      let group = JSON.stringify( f(o) );
      groups[group] = groups[group] || [];
      groups[group].push( o );  
    });

    return Object.keys(groups).map( function( group ) {
      return groups[group];
    })
  }

  // handle answer selection in list
  itemTapped(event, item) {

    let params = {
      q_uuid: this.issueList.uuId,
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

          // process each item in list
          _.each(this.issueList.answers, (
            (item) => {
              item.value.selected = false;
            }
          ));
          // select the specified answer item
          item.value.selected = true;

          // navigate to /next-question page
          this.questionsService.nextQuestion
            .subscribe(
              data => this.firstQuestion = data,
              err => console.error(err),
              () => {
                // init the page with the first question data (response from /next-question GET)
                this.nav.push(QuestionSlidePage, {
                  item: item,
                  page: this,
                  firstQuestion: this.firstQuestion
                });
              }
            );
        }
      )
  }
}
