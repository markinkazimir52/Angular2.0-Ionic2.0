// per: 2.0.0-beta.8 upgrade changelog
//import {Alert, Page, NavController, NavParams} from 'ionic-angular';
import {Component, OnInit, ViewChild, ElementRef, Renderer} from '@angular/core';
import {AlertController, Modal, NavController, ViewController, NavParams, Slides} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {AnswerService} from '../../providers/answer-service/answer-service';
import {AttachmentService} from '../../providers/attachment-service/attachment-service';
import {ProgressService} from '../../providers/progress-service/progress-service';
import {AuthenticateService} from '../../providers/authenticate-service/authenticate-service';

// removed since not extant yet
import {SubmitConcernPage} from '../submit-concern/submit-concern';
import {HomePage} from '../home/home';
import { EllipsisPipe } from '../../plugins/ellipsis.pipe';
import * as _ from 'lodash';

@Component({
  providers: [QuestionsService, AnswerService, AttachmentService, ProgressService, AuthenticateService],
  templateUrl: 'build/pages/question-slide/question-slide.html',
  queries: {
    slider: new ViewChild('slides')
  },
  pipes: [EllipsisPipe]
})

export class QuestionSlidePage {
  static get parameters() {
    return [[NavController], [NavParams], [AlertController], [AuthenticateService], [QuestionsService], [AnswerService], [ProgressService], [AttachmentService]];
  }

  constructor(nav, navParams, alertCtrl, authenticateService, questionsService, answerService, progressService, attachmentService, slider) {
    this.nav = nav;
    this.navParams = navParams;
    this.navigatedFromPage = navParams.get('page');
    this.selectedItem = navParams.get('item');
    this.firstQuestion = navParams.get('firstQuestion');
    this.questionsService = questionsService;
    this.answerService = answerService;
    this.attachmentService = attachmentService;
    this.questions = [this.firstQuestion, ''];
    this.questionList = [];
    this.isAnswered = [];
    this.alertCtrl = alertCtrl;
    this.uploadedImage = false;
    this.uploadedFile = false;
    this.authenticateService = authenticateService;
    
    this.progressService = progressService;
    // initial "init" value - 0% (for debugging)
    this.progress = 0;

    this.slider = slider;    

    // GPS geolocation options
    this.options = {
      enableHighAccuracy: true,
      timeout: 3000,
      maximumAge: 0
    };

    // Test updating slide
    this.question = this.firstQuestion;
  }

  ngOnInit() {
    // update progress bar on init
    this.updateProgressBar();
  }

  
  // handle faux Back button
  backTapped() {
    // go back to previous page - "issue-list"
    // step 1 - trigger GET action on that page
    this.questionsService.issueList
            .subscribe(
              data => { console.log("return to /issue-list page"); },
              err => console.error(err),
              () => {
                        // step 2 - navigate to "issue-list" page
                        this.nav.pop();
                    }
            );  
  }

  updateProgressBar() {
    this.progressService.progress.subscribe(
        data => {
            console.log(" current progress: " + data.detail.progress + "%");
            this.progress = data.detail.progress;
        },
        err => console.error(err),
        () => {}
    );
  }

  slideCards($e) {
    // Next slide
    if($e.direction == 2){
      // save 
      let answeredQuestion = this.question;
      this.isNext = true;

      if(answeredQuestion.metadata.answersType == 'Multiple' || answeredQuestion.metadata.answersType == 'Single') {
          // using item.isClicked because it is 1 level down - can be easily sorted out
          let answeredItems = _.toArray(_.pickBy(answeredQuestion.answers, function(value, key) {
            return value.value.selected == true;
          }));
          let user_answers = [];

          // loop through each question, saving detail notes as needed
          _.each(answeredItems, (
            (item) => {
              let detail_txt = '';

              if(item.geopoint)
                detail_txt = 'lat:'+item.geopoint.lat+',lon:'+item.geopoint.lng;
              else if(item.optionalInput.remark)
                detail_txt = item.optionalInput.remark;
              else
                detail_txt = '';

              user_answers.push({
                a_uuid: item.uuId,
                selected: true,
                detail_txt: detail_txt
              });
            }
          ));

          // build answer transmit object (okay if data contents are empty)
          let params = {
            q_uuid: answeredQuestion.uuId,
            user_answers: user_answers
          };

          // send answer to the server
          this.answerService.addAnswer(params)
            .subscribe(
              data => this.data = data,
              err => console.error(err),
              () => {
                // get next question
                this.questionsService.nextQuestion
                  .subscribe(
                    data => {
                      this.nextQuestion = data
                      // handle any missing attachment data
                      if (typeof(this.nextQuestion.attachments) === 'undefined') {
                        console.log("attachment data missing - adding empty placeholder");
                        // add an empty object
                        this.nextQuestion.attachments = {
                            acceptedTypes: [],
                            uploadedData: []
                        };
                      }
                      // handle any navigation data
                      if (typeof(this.nextQuestion.navigate) === 'undefined') {
                        console.log("navigate flag missing - adding placeholder");
                        this.nextQuestion.navigate = false;
                        this.nextQuestion.navigateFlow = 'normal';
                      }
                    },
                    err => console.error(err),
                    () => {
                        // check if navigation request is needed
                        if ((this.nextQuestion.navigate == true) && (this.nextQuestion.navigateFlow == 'forward')) {
                            // got navigation request on a /next-question API call --> no more questions available
                            // so navigate to "submit-concern" page
                            console.log("no more questions - completing concern");
                            this.nav.push(SubmitConcernPage, {
                                page: this,
                                question: this.question
                            });
                        } else {
                            // another question received - show /next-question data
                            console.log("more questions possible - displaying now");
                            setTimeout(
                              () => {
                                // update progress bar
                                this.updateProgressBar();
                                // update question setting
                                this.question = this.nextQuestion;
                                this.isNext = false;
                            }, 500);
                        }
                    }
                  );
              }
            )
      } else if (answeredQuestion.metadata.answersType == 'DateTime') {
        // handle DateTime answers for a DateTime question
        let user_answers = [];

        // fetch and store answer data from Date and Time pickers
        if(this.myTime) {
          user_answers.push({
            a_uuid: answeredQuestion.answers[1].uuId,
            selected: true,
            detail_txt: this.myTime
          })
        }
        if(this.myDate) {
          user_answers.push({
            a_uuid: answeredQuestion.answers[0].uuId,
            selected: true,
            detail_txt: this.myDate
          }) 
        }

        // build answer transmit object (okay if data contents are empty)
        let params = {
          q_uuid: answeredQuestion.uuId,
          user_answers: user_answers
        };

        // send answer to the server
        this.answerService.addAnswer(params)
          .subscribe(
            data => this.data = data,
            err => console.error(err),
            () => {
              // request next question from server
              this.questionsService.nextQuestion
                .subscribe(
                  data => {
                    this.nextQuestion = data
                    // handle any missing attachment data
                    if (typeof(this.nextQuestion.attachments) === 'undefined') {
                      // add an empty object
                      this.nextQuestion.attachments = {
                          acceptedTypes: [],
                          uploadedData: []
                      };
                    }
                    // handle any navigation data
                    if (typeof(this.nextQuestion.navigate) === 'undefined') {
                      console.log("navigate flag missing - adding placeholder");
                      this.nextQuestion.navigate = false;
                      this.nextQuestion.navigateFlow = 'normal';
                    }
                  },
                  err => console.error(err),
                  () => {
                        if ((this.nextQuestion.navigate == true) && (this.nextQuestion.navigateFlow == 'forward')) {
                            // got 204 on a /next-question API call --> no more questions available
                            // so navigate to "submit-concern" page
                            console.log("no more questions - completing concern");
                            this.nav.push(SubmitConcernPage, {
                                page: this,
                                question: this.question
                            });
                        } else {
                            // another question received - show /next-question data
                            console.log("more questions possible - displaying now");
                            setTimeout(
                              () => {
                                this.question = this.nextQuestion;
                                this.isNext = false;
                            }, 500);
                        }
                  }
                );
            }
          )
      } else {
        // console.log(answeredQuestion.answers);
        let user_answers = [];
        let answerGiven = false;
        
        // determine if an answer was provided for this (Prose) question
        if(answeredQuestion.answers[0].value.remark) {
          // update answer flag
          answerGiven = true;
          // save answer to local array
          user_answers.push({
            a_uuid: answeredQuestion.answers[0].uuId,
            selected: true,
            detail_txt: answeredQuestion.answers[0].value.remark
          });
        }
        
        // create array for API transaction - okay if empty data passed
        let params = {
            q_uuid: answeredQuestion.uuId,
            user_answers: user_answers
        };

        // handle request to save a question that is required, but no answer is provided
        if ((answeredQuestion.metadata.required == true) && (!(answerGiven))) {
            // handle if no answers were provided
            console.log("Request to skip/save-as-blank a required question...");
            // show pop-up alert
            let requiredInputNotice = this.alertCtrl.create({
                title: 'One moment, please...',
                message: 'We need your answer to this question to respond to this concern.',
                buttons: ['Okay']
            });
            requiredInputNotice.present();
        } else {
            // send answer to the server
            this.answerService.addAnswer(params)
            .subscribe(
              data => this.data = data,
              err => console.error(err),
              () => {
                // request the next question to display
                this.questionsService.nextQuestion
                  .subscribe(
                    data => {
                      this.nextQuestion = data
                      // handle any missing attachment data
                      if (typeof(this.nextQuestion.attachments) === 'undefined') {
                        // add an empty object
                        this.nextQuestion.attachments = {
                            acceptedTypes: [],
                            uploadedData: []
                        };
                      }
                      // handle any navigation data
                      if (typeof(this.nextQuestion.navigate) === 'undefined') {
                        console.log("navigate flag missing - adding placeholder");
                        this.nextQuestion.navigate = false;
                        this.nextQuestion.navigateFlow = 'normal';
                      }
                    },
                    err => console.error(err),
                    () => {
                        // console.log("doing this");
                        if ((this.nextQuestion.navigate == true) && (this.nextQuestion.navigateFlow == 'forward')) {
                            console.log("no more questions - completing concern");
                            // got 204 on a /next-question API call --> no more questions available
                            // so navigate to "submit-concern" page
                            // next action on completion - navigate to "submit concern" page
                            this.nav.push(SubmitConcernPage, {
                                page: this,
                                question: this.question
                            });
                        } else {
                            // another question received - show /next-question data
                            console.log("more questions possible - displaying now");
                            setTimeout(
                              () => {
                                // update progress bar
                                this.updateProgressBar();
                                // update question setting
                                this.question = this.nextQuestion;
                                this.isNext = false;
                            }, 500);
                        }
                    }
                  );
              }
            ); 
        }
      }
    }
    // Prev Slide
    else if($e.direction == 4){
      // save state
      this.isPrev = true;
      // request previous question data (if it exists)
      this.questionsService.prevQuestion
        .subscribe(
          data => {
            this.prevQuestion = data
            // handle any missing attachment data
            if (typeof(this.prevQuestion.attachments) === 'undefined') {
                // add an empty object
                this.prevQuestion.attachments = {
                    acceptedTypes: [],
                    uploadedData: []
                };
            }
            // handle any navigation data
            if (typeof(this.prevQuestion.navigate) === 'undefined') {
              console.log("navigate flag missing - adding placeholder");
              this.prevQuestion.navigate = false;
              this.prevQuestion.navigateFlow = 'normal';
            }
          },
          err => console.error(err),
          () => {
            if ((this.prevQuestion.navigate == true) && (this.prevQuestion.navigateFlow == 'backward')) {
                console.log("no more prior questions - returning to earlier page");
                // got 204 on a /prev-question API call --> no more questions available
                // so navigate to "issue-list" page
                // step 1 - trigger GET action on that page
                this.questionsService.issueList
                    .subscribe(
                      data => { console.log("return to /issue-list page"); },
                      err => console.error(err),
                      () => {
                                // step 2 - navigate to "issue-list" page
                                this.nav.pop();
                            }
                    );
            } else {
                // got a 200 on /prev-question API call
                // another question received - show /prev-question data
                console.log("prior questions exist - displaying now");
                setTimeout(
                  () => {
                    // update progress bar
                    this.updateProgressBar();
                    // update question setting
                    this.question = this.prevQuestion;
                    this.isPrev = false;
                }, 500);
            }
          }
        );
    }
  }

/*
  slideNext(event) {
    let currentIndex = this.slider.getActiveIndex();
    let prevIndex = this.slider.getPreviousIndex();

//     console.log("active index: " + currentIndex);
//     console.log("prev index: " + prevIndex);
console.log(this.slider);

    // Next slide
    if(currentIndex - prevIndex > 0) {
      let answeredQuestion = this.questions[prevIndex];

      if(answeredQuestion.metadata.answersType == 'Multiple' || answeredQuestion.metadata.answersType == 'Single') {
          // using item.isClicked because it is 1 level down - can be easily sorted out
          let answeredItems = _.toArray(_.pickBy(answeredQuestion.answers, function(value, key) {
            return value.value.selected == true;
          }));
          let user_answers = [];

          // loop through each question, saving detail notes as needed
          _.each(answeredItems, (
            (item) => {
              let detail_txt = '';

              if(item.geopoint)
                detail_txt = 'lat:'+item.geopoint.lat+',lon:'+item.geopoint.lng;
              else if(item.optionalInput.remark)
                detail_txt = item.optionalInput.remark;
              else
                detail_txt = '';

              user_answers.push({
                a_uuid: item.uuId,
                selected: true,
                detail_txt: detail_txt
              });
            }
          ));

          let params = {
            q_uuid: answeredQuestion.uuId,
            user_answers: user_answers
          };

          this.answerService.addAnswer(params)
            .subscribe(
              data => this.data = data,
              err => console.error(err),
              () => {
                this.questionsService.nextQuestion
                  .subscribe(
                    data => {
                      this.nextQuestion = data
                    },
                    err => console.error(err),
                    () => {
                        // console.log("doing this");
                        if (this.nextQuestion.httpStatus == 204) {
                            let alert = this.alertCtrl.create({ title: 'navigate', message: 'forward to submit-concern' });
                            alert.present();
                        } else {
                            // this.questions[currentIndex] = this.nextQuestion;
                            // this.questions[currentIndex+1] = '';
                            
                            this.questions = [];
                        console.log(this.nextQuestion);
                            this.questions[0] = '';
                            this.questions[1] = this.nextQuestion;
                            this.questions[2] = '';
                            this.slider.slider.removeSlide(1);
console.log(this.questions);
console.log(this.slider.length());
                            this.slider.slideTo(1, 0);
                        }

                    }
                  );
              }
            )
      }else if (answeredQuestion.metadata.answersType == 'DateTime') {
        // console.log(answeredQuestion.answers);
        let user_answers = [];

        if(this.myTime) {
          user_answers.push({
            a_uuid: answeredQuestion.answers[1].uuId,
            selected: true,
            detail_txt: this.myTime
          })
        }

        if(this.myDate) {
          user_answers.push({
            a_uuid: answeredQuestion.answers[0].uuId,
            selected: true,
            detail_txt: this.myDate
          }) 
        }

        let params = {
          q_uuid: answeredQuestion.uuId,
          user_answers: user_answers
        };

        this.answerService.addAnswer(params)
          .subscribe(
            data => this.data = data,
            err => console.error(err),
            () => {
              this.questionsService.nextQuestion
                .subscribe(
                  data => {
                    this.nextQuestion = data
                  },
                  err => console.error(err),
                  () => {
                        // console.log("doing this");
                        if (this.nextQuestion.httpStatus == 204) {
                            // got 204 on a /next-question API call --> no more questions available
                            // so navigate to "submit-concern" page
                        } else {
                            // this.questions[currentIndex] = this.nextQuestion;
                            // this.questions[currentIndex+1] = '';
                        
                            console.log(this.nextQuestion);
                            this.questions[0] = '';
                            this.questions[1] = this.nextQuestion;
                            this.questions[2] = '';
                            console.log(this.questions);
                            this.slider.slider.removeSlide(1);
                            this.slider.slideTo(1, 0);
                        }
                  }
                );
            }
          )
      } else {
        // console.log(answeredQuestion.answers);
        let user_answers = [];
        if(answeredQuestion.answers[0].value.remark) {
          user_answers.push({
            a_uuid: answeredQuestion.answers[0].uuId,
            selected: true,
            detail_txt: answeredQuestion.answers[0].value.remark
          });
        }
        
        let params = {
          q_uuid: answeredQuestion.uuId,
          user_answers: user_answers
        };

        this.answerService.addAnswer(params)
          .subscribe(
            data => this.data = data,
            err => console.error(err),
            () => {
              this.questionsService.nextQuestion
                .subscribe(
                  data => {
                    this.nextQuestion = data
                  },
                  err => console.error(err),
                  () => {
                      // console.log("doing this");
                      if (this.nextQuestion.httpStatus == 204) {
                          // got 204 on a /next-question API call --> no more questions available
                          // so navigate to "submit-concern" page
                      } else {
                          console.log(this.nextQuestion);
                          this.questions[0] = '';
                          this.questions[1] = this.nextQuestion;
                          this.questions[2] = '';
                          console.log(this.questions);                          
                          // this.slider.slider.removeSlide(1);
                          this.slider.slideTo(1, 0);
                      }
                  }
                );
            }
          )         
      }
    }
    // Prev Slide
    else{
      this.questionsService.prevQuestion
        .subscribe(
          data => {
            this.prevQuestion = data
          },
          err => console.error(err),
          () => {
            // console.log("doing this");
            if (this.nextQuestion.httpStatus == 204) {
                // got 204 on a /prev-question API call --> no more questions available
                // so navigate to "issue-list" page
            } else {
                // this.questions[currentIndex] = this.prevQuestion;
                // this.questions[currentIndex+1] = '';
           
                console.log(this.prevQuestion);
                console.log(this.slider);
                this.questions[0] = '';
                this.questions[1] = this.prevQuestion;
                this.questions[2] = '';
                
                this.slider.getSlider().update();
                
                this.slider.slideNext(0);

                // console.log(this.questions);
                
            }
          }
        );
    }
    // console.log("next-question: " + JSON.stringify(this.nextQuestion, null, 2));  
    // handle progress bar every time
    this.updateProgressBar();
  }
*/
  
  helpTapped(event) {
    // load the current question's dataset
    let answeredQuestion = this.question;
    // build alert popup 
    let alert = this.alertCtrl.create({
        title: 'Need help?',
        message: answeredQuestion.display.help,
        buttons: ['Okay']
    });
    alert.present();
  }

  // handle clicks on specific answers (items) on page
  itemTapped(event, item) {
    if (!(item.value.selected)) {
        // select the item
        if(this.question.metadata.answersType == 'Single') {
          _.each(this.question.answers, (
            (item) => {
              item.value.selected = false;
            }
          ))
        }

        item.value.selected = true;
        // determine if an optional input is available
        if (item.optionalInput.available) {
            // perform different actions based on datasource
            switch (item.optionalInput.dataSource) {
                // prompt inputs
                case 'prompt':
                    // optional Prompt available for answer - show it
                    let alert = this.alertCtrl.create({
                        title: item.optionalInput.display,
                        message: 'Please provide additional details here.',
                        inputs: [
                            {
                                name: 'optionalInput',
                                placeholder: '(Optional)'
                            },
                        ],
                        buttons: [
                        {
                            text: 'No Thanks',
                            handler: data => {
                                console.log("Declined");
                            }
                        },
                        {
                            text: 'Save',
                            handler: data => {
                                console.log("User provided optional data: "+ data);
                                item.optionalInput.remark = data.optionalInput;
                            }
                        }]
                    });
                    alert.present();
                    break;
                case 'gps':
                    // handle GPS geolocation request
                    this.getLocation(item);
                    console.log(item);
                    break;
            }
        }
    } else {
        // de-select the item
        item.value.selected = false;
        // remove any optional text
        item.optionalInput.remark = "";
    }
  }

  // handles the "Done" button to navigate to "submit my concern" screen
  // desired actions:
  //  - check if current answer exists
  //    - if so: save it
  //  - navigate to "submit-concern" page
  saveTapped(event) {
    // save the current answers from the current screen
    // note: have not swiped left (this is the upper-right button click) so get current index
    //let currentIndex = this.slider.getActiveIndex();
    //let answeredQuestion = this.questions[currentIndex];
    let answeredQuestion = this.question;
    let user_answers = [];
    
    // console.log(answeredQuestion.answers);
    
    /*
    // don't know what type of question was shown last
    if(answeredQuestion.metadata.answersType == 'Multiple' || answeredQuestion.metadata.answersType == 'Single') {
        // handle single/multichoice questions
        let answeredItems = _.toArray(_.pickBy(answeredQuestion.answers, {'isClicked': true}));
        // loop through each answer provided
        _.each(answeredItems, (
            (item) => {
                user_answers.push({
                    a_uuid: item.uuId,
                    selected: true,
                    detail_txt: (item.optionalInput.remark || "")
            });
            }
        ));
    } else if (answeredQuestion.metadata.answersType == 'DateTime') {
        // handle Date+Time Picker inputs (if entered)
        if(this.myTime) {
            user_answers.push({
                a_uuid: answeredQuestion.answers[1].uuId,
                selected: true,
                detail_txt: this.myTime
            });
        }
        if(this.myDate) {
            user_answers.push({
                a_uuid: answeredQuestion.answers[0].uuId,
                selected: true,
                detail_txt: this.myDate
            });
        }
    } else {
        // handle text inputs ("Prose" type)
        if(this.note) {
            user_answers.push({
                a_uuid: answeredQuestion.answers[0].uuId,
                selected: true,
                detail_txt: this.note
            });
        }
    }
    */
    
    // generate answer JSON data object to send
    // note: okay to send an empty array of answers - API can skip this
    let params = {
        q_uuid: answeredQuestion.uuId,
        user_answers: user_answers
    };
    
    
    // save answer via call to AnswerService
    this.answerService.addAnswer(params)
            .subscribe(
              data => this.data = data,
              err => console.error(err),
              () => {
                // next action on completion - navigate to "submit concern" page
                this.nav.push(SubmitConcernPage, {
                    page: this,
                    question: this.question
                });
              }
            );
  }


  trashTapped(event) {
    console.log("User requesting to clear entire Concern...");
    let confirm = this.alertCtrl.create({
      title: 'Cancel your report?',
      message: 'Are you sure you want to cancel and start over?  This cannot be undone.',
      cssClass: 'trash-alert',
      buttons: [{
        text: 'No',
        handler: () => {
          console.log('Cancelled');
      }}, {
        text: 'Yes',
        handler:
          () => {
            console.log('Clear action confirmed by user - removing ALL answers.');
            // clear the topic selected by re-authenticating with server
            this.authenticateService.clearAuth()
              .subscribe(
                data => this.data = data,
                err => console.error(err),
                () => {
                    // go to Home screen (root page)
                    this.nav.setRoot(HomePage);
                }
              );
          }
      }]
    });
    confirm.present();
  }

  handleUpload(event, type) {
    let file = event.target.files[0];

    let params = {
      attachment: file,
      type: type
    };

    this.attachmentService.addAttachment(params)
      .subscribe(
        data => {
          this.attach = data;
          
          if(type == 'image')
            this.uploadedImage = true;
          
          if(type == 'file')
            this.uploadedFile = true;
        },
        err => console.error(err),
        () => {
          console.log(this.attach);
        }
      )
  }

  getLocation(item) {
    console.log("geolocation requested");
    navigator.geolocation.getCurrentPosition(
 
        (position) => {
            console.log("geolocation access allowed by browser");
            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;
            
            item.geopoint = {
              lat: latitude,
              lng: longitude
            }
            
            console.log("position data: lat=" + latitude + ", lon=" + longitude);
        },
   
        (error) => {
            let errorMessage = 'Unknown error';
            switch(error.code) {
              case 1:
                errorMessage = 'Permission denied';
                break;
              case 2:
                errorMessage = 'Position unavailable';
                break;
              case 3:
                errorMessage = 'Timeout';
                break;
            }

            let alert = this.alertCtrl.create({
                title: 'GPS currently unavailable',
                message: "We're having trouble getting your current location by GPS. Can you describe your current location below?",
                inputs: [
                  {
                    name: 'optionalInput',
                    placeholder: '(Optional)'
                  },
                ],
                buttons: [{
                    text: 'Cancel',
                    role: 'cancel',
                    handler: data => {
                      // de-select the GPS answer
                      item.value.selected = false;
                    }
                  },{
                    text: 'Okay',
                    handler: data => {
                      // de-select the GPS answer
                      item.value.selected = false;

                      // get current question's data
                      //let currentIndex = this.slider.getActiveIndex();
                      //let answeredQuestion = this.questions[currentIndex];
                      let answeredQuestion = this.question;
                      // find the index of the "other" answer
                      let otherIndex = _.findIndex(answeredQuestion.answers, {'choice': 'Other'});
                      // select that answer and apply the optional text
                      answeredQuestion.answers[otherIndex].value.selected = true;
                      answeredQuestion.answers[otherIndex].optionalInput.remark = data.optionalInput;

                      console.log("filled in: " + JSON.stringify(answeredQuestion.answers[otherIndex], null, 2));
                      
                      //this.otherIndex = _.findIndex(this.question.suggestedAnswerList, {'name': 'Other'});
                      //this.question.suggestedAnswerList[this.otherIndex].isClicked = true;
                      //this.question.suggestedAnswerList[this.otherIndex].optionalInputText = data.optionalInput;
                    }
                }]
            });
            alert.present();

            console.log("GPS error: " + errorMessage);
            item.geopoint = {
              lat: 0,
              lng: 0
            }
        }, this.options
   
    );
  }  
}
