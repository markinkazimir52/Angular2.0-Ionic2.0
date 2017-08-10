// per: 2.0.0-beta.8 upgrade changelog
//import {Alert, Page, Platform, NavController, NavParams} from 'ionic-angular';
import {Component} from '@angular/core';
import {Alert, Modal, Platform, NavController, ViewController, NavParams} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {PeopleService} from '../../providers/people-service/people-service';
import {HomePage} from '../../pages/home/home';
import {QuestionGridPage} from '../../pages/question-grid/question-grid';
import { EllipsisPipe } from '../../plugins/ellipsis.pipe';
import {Camera, DatePicker, Geolocation} from 'ionic-native';
import * as _ from 'lodash';

@Component({
  templateUrl: 'build/pages/question-card/question-card.html',
  providers: [QuestionsService, PeopleService],
  pipes: [EllipsisPipe],
})
export class QuestionCardPage {
  static get parameters() {
    return [[NavController], [NavParams], [Platform], [QuestionsService], [PeopleService]];
  }

  constructor(nav, navParams, platform, questionsService, peopleService) {   
    this.nav = nav;
    this.navParams = navParams;
    this.platform = platform;
    // If we navigated to this page, we will have a page available as a nav param
    this.navigatedFromPage = navParams.get('page');
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');
    // If we navigated to this page, we will have a questions list available as a nav param
    this.questions = navParams.get('questions');
    this.questionIndex = _.findIndex(this.questions, {'headline': this.selectedItem.headline});
    this.question = this.questions[this.questionIndex];
    // this.answeredItems = this.question.acceptedAnswerList;
    this.answeredItems = [];
    // adjust current time for timezone offset
    this.myDate = this.getFixedDateString();
    //this.myDate = new Date().toISOString();  
    this.setPageType(this.question);
    this.getAnswer(this.question);

    this.options = {
      enableHighAccuracy: true,
      timeout: 1000,
      maximumAge: 0
    };
  }

  // return the ISO string of a timezone-adjusted now()
  getFixedDateString() {
    // note: getTimezoneOffset returns minutes difference (based on browser settings)
    let tempDate = new Date();
    tempDate.setHours(tempDate.getHours() - (tempDate.getTimezoneOffset() / 60));
    return tempDate.toISOString();
  }
  
  setPageType(question) {
    for(let i in question.suggestedAnswerList) {
      if(question.suggestedAnswerList[i].uiHelper.hasTextArea)
        this.page_type = 'text';
      else if(question.suggestedAnswerList[i].uiHelper.hasDate || question.suggestedAnswerList[i].uiHelper.hasTime)
        this.page_type = 'date_time';
      else
        this.page_type = 'multi_choice';        
    }
  }

  getAnswer(question) {
    if(question.acceptedAnswerList.length == 0) {
      for(let index in question.suggestedAnswerList) {
        question.suggestedAnswerList[index].isClicked = false;
      }
    }

    for(let i in question.acceptedAnswerList) {
      if(question.acceptedAnswerList[i].textarea)
        this.note = question.acceptedAnswerList[i].textarea;
      else if (question.acceptedAnswerList[i].myDate)
        this.myDate = question.acceptedAnswerList[i].myDate;
      else{       
        for(let j in question.suggestedAnswerList) {
          if(question.acceptedAnswerList[i].id == question.suggestedAnswerList[j].id){            
            question.suggestedAnswerList[j].isClicked = true;            
          }
        }
      }
    }
  }

  pickImage(item) {
    this.platform.ready().then(
      () => {
        let options = {
          quality: 50,
          destinationType: Camera.FILE_URI,
          sourceType: Camera.CAMERA,
          allowEdit: false,
          encodingType: Camera.JPEG,
          correctOrientation: true,
          saveToPhotoAlbum: false,
          cameraDirection: Camera.BACK
        };
        Camera.getPicture(
          (imageData) => {
            let base64Image = 'data:image/jpeg;base64,' + imageData;
            let alertText = 'Image acquired as\n';
            alertText += base64Image;
            setTimeout(
              () => {
                alert(alertText);
            }, 1000);
            item.images.push(base64Image);
          },
          (error) => {
            setTimeout(
              () => {
                alert('Picking image failed: ' + error);
            });
        }, options);
    });
  }

  pickGeoPoint(item) {
    this.platform.ready().then(
      () => {
        let options = {
          timeout: 10000,
          enableHighAccuracy: true
        };
        Geolocation.getCurrentPosition(
          (positionData) => {
            let geopoint = {
              lat: positionData.coords.latitude,
              lng: positionData.coords.longitude
            };
            let alertText = 'Location acquired as\n';
            alertText += geopoint.coords.latitude + ' lat\n';
            alertText += geopoint.coords.longitude + ' long';
            setTimeout(
              () => {
                alert(alertText);
            }, 1000);
            item.geopoint = geopoint;
          },
          (error) => {
            setTimeout(
              () => {
                alert('Picking geopoint failed: ' + error);
            });
        }, options);
    });
  }

  pickDateTime(item, mode = 'date') {
    this.platform.ready().then(
      () => {
        let options = {
          date: new Date(),
          mode: mode,
          minDate: new Date() - 10000,
          allowOldDate: true,
          allowFutureDates: false,
          doneButtonLabel: 'Done',
          doneButtonColor: '#387ef5',
          cancelButtonLabel: 'Cancel',
          cancelButtonColor: '#f4f4f4'
        };
        DatePicker.show(
          (temporalData) => {
            let dateTime = temporalData;
            let alertText = 'Date/time acquired as\n';
            alertText += dateTime;
            setTimeout(
              () => {
                alert(alertText);
            }, 1000);
            if (mode === 'date') {
              this.date = dateTime;
            } else if (mode === 'time') {
              this.time = dateTime;
            } else {
              setTimeout(
                () => {
                  alert('Picking geopoint failed');
              });
            }
          },
          (error) => {
            setTimeout(
              () => {
                alert('Picking geopoint failed: ' + error);
            });
        }, options);
    });
  }

  helpTapped(event) {
    let alert = Alert.create({
        title: 'Need help?',
        message: this.question.about.description,
        buttons: ['Okay']
    });
    this.nav.present(alert);
  }

  itemTapped(event, item) {
    if(this.page_type == 'text'){
      if ( item.uiHelper.hasAudio ) {
        let audio_alert = Alert.create({
          title: 'Add audio',
          message: 'We\'re sorry, but audio submission is not available on your device at this time.',
          buttons: ['OK']
        });

        this.nav.present(audio_alert);
      }else if ( item.uiHelper.hasVideo ) {
     
        let video_alert = Alert.create({
          title: 'Add video',
          message: 'We\'re sorry, but video submission is not available on your device at this time.',
          buttons: ['OK']
        });

        this.nav.present(video_alert);
      }

    }else {
        if(this.question.isSingleChoice){
          this.answeredItems = [];
          _.each(this.question.suggestedAnswerList, (
            (item) => {
              item.isClicked = false;
              if(item.optionalInputText)
                item.optionalInputText = '';
            }
          ))
        }

        if(item.isClicked){
          item.isClicked = false;
        }
        else{
          item.isClicked = true;
        }
       
        if (item.hasOptionalInput) {
          console.log("User prompted to enter additional text for answer.");
          let alert = Alert.create({
            title: 'Add Additional Text',
            message: 'Please provide additional details here.',
            inputs: [
              {
                name: 'optionalInput',
                placeholder: '(Optional)'
              },
            ],
            buttons: [{
              text: 'No Thanks',
              handler: data => {
                console.log("Declined");
              }
            }, {
              text: 'Save',
              handler: data => {
                console.log("User provided optional data: "+ data);
                item.optionalInputText = data.optionalInput;
              }
            }]
          });

          if(item.isClicked)
            this.nav.present(alert);
          else{
            if(item.optionalInputText)
              item.optionalInputText = '';
          }

        }

        if(item.isClicked){
          this.answeredItems = _.toArray(_.omitBy(this.answeredItems, {'name': item.name}));
          this.answeredItems.push(item);

          if(item.uiHelper.hasGeoPoint) {
            this.getLocation(item);
          }
        }else {
          this.answeredItems = _.toArray(_.omitBy(this.answeredItems, {'name': item.name}));
        }
    }
  }

  saveTapped(event, moveType) {
    this.question.acceptedAnswerList = [];
    
    if(this.page_type == 'text') {

      if(!this.note || this.note == ''){
        let alert = Alert.create({
          title: 'One moment...',
          message: 'Please include some information for this question, thanks!',
          buttons: ['OK']
        });

        this.nav.present(alert);
      }else{
        this.textareaObj = _.toArray(_.pickBy(this.question.suggestedAnswerList, {'name': 'Type your notes here...'}))[0];
        this.textareaObj.textarea = this.note;
        this.question.acceptedAnswerList.push(this.textareaObj);

        this.moveToNext(moveType);
        this.setAnsweredQuestion('add');
      }
    }else if (this.page_type == 'date_time'){

      this.dateObj = _.toArray(_.pickBy(this.question.suggestedAnswerList, {'name': 'Date:'}))[0];
      this.dateObj.date = this.myDate;
      this.question.acceptedAnswerList.push(this.dateObj);

      this.moveToNext(moveType);
      this.setAnsweredQuestion('add');
    }else {

      // if(this.answeredItems.length == 0){
      //   this.trashTapped();
      // }else {
        _.each(this.answeredItems, (
          (item) => {
            this.question.acceptedAnswerList.push(item);
          }
        ));
        
        this.moveToNext(moveType);
        this.setAnsweredQuestion('add');
      // }
    }
  }

  moveToNext(type) {
    if(type == 'prev')
      // "save" button tapped - return to Grid page
      this.nav.pop();
    else{
      if(this.questionIndex < 11){
        this.questionIndex++;
        this.question = this.questions[this.questionIndex];
        this.setPageType(this.question);
        this.answeredItems = [];
        this.note = '';
      } else if (this.questionIndex == 11) {
        // app is at end of question list
        // so return to Grid page
        this.nav.pop();
      }
    }
  }

  trashTapped(event) {
    console.log("User prompted to clear their answers to current question");
    let confirm = Alert.create({
      title: 'Clear your answer?',
      message: 'Are you sure you want to clear the answers you provided for this question?',
      cssClass: 'trash-alert',
      buttons: [{
        text: 'Cancel',
        role: 'cancel',
        handler:
          () => {console.log('Cancelled');}
        }, {
        text: 'Yes, I\'m sure',
        handler:
          () => {
            console.log('Clear action confirmed by user - removing answers.');
            // TODO Delete everything related to this concern.
            this.answeredItems = [];
            this.note = "";
            this.myDate = this.getFixedDateString();

            _.each(this.question.suggestedAnswerList, (
              (item) => {
                item.isClicked = false;
                item.optionalInputText = "";
              }
            ));

            this.question.acceptedAnswerList = [];
            this.setAnsweredQuestion('remove');
            
            confirm.dismiss().then(() => {
                this.nav.pop();
            });
          }
      }]
    });

    this.nav.present(confirm);
  }

  setAnsweredQuestion(type) {
    this.baseQuestionIndex = _.findIndex(this.questions, {'headline': 'Please elaborate'});
    this.baseQuestion = this.questions[this.baseQuestionIndex];
    if(type == 'add'){
      this.baseQuestion.acceptedAnswerList = _.toArray(_.omitBy(this.baseQuestion.acceptedAnswerList, {'headline': this.question.headline}));
      this.baseQuestion.acceptedAnswerList.push(this.question);
    }else {
      this.baseQuestion.acceptedAnswerList = _.toArray(_.omitBy(this.baseQuestion.acceptedAnswerList, {'headline': this.question.headline}));
    }

    this.calcProgress(this.baseQuestion);
    
    for(let index = 0; index < this.baseQuestion.suggestedAnswerList.length; index ++) {
      for( let i = 0; i < this.questions.length; i++) {
        if( this.baseQuestion.suggestedAnswerList[index].headline == this.questions[i].headline ){          

          if(this.questions[i].acceptedAnswerList.length > 0)
            this.baseQuestion.suggestedAnswerList[index].isAnswered = true;
          else
            this.baseQuestion.suggestedAnswerList[index].isAnswered = false;
        }
      }
    }
  }

  calcProgress(question) {
    switch (question.acceptedAnswerList.length) {
      case 1:
        question.progress = 20;
        break;
      case 2:
        question.progress = 30
        break;
      case 3:
        question.progress = 40;
        break;
      case 4:
        question.progress = 50;
        break;
      case 5:
        question.progress = 60;
        break;
      case 6:
        question.progress = 75;
        break;
      case 7:
        question.progress = 85;
        break;
      case 8:
        question.progress = 90;
        break;
      case 9:
        question.progress = 95;
        break;
      case 10:
        question.progress = 100;
        break;
      default:
        question.progress = 3;
    }
  }

  getLocation(item) {
    console.log("geolocation requested");
    navigator.geolocation.getCurrentPosition(
 
        (position) => {
            console.log("geolocation access allowed by browser");
            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;
            
            this.question.geopoint = {
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
            
            let alert = Alert.create({
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
                      item.isClicked = false;
                    }
                  },{
                    text: 'Okay',
                    handler: data => {
                      item.isClicked = false;

                      this.otherIndex = _.findIndex(this.question.suggestedAnswerList, {'name': 'Other'});
                      this.question.suggestedAnswerList[this.otherIndex].isClicked = true;
                      this.question.suggestedAnswerList[this.otherIndex].optionalInputText = data.optionalInput;
                    }
                }]
            });
            this.nav.present(alert);

            console.log("GPS error: " + errorMessage);
            this.question.geopoint = {
              lat: 0,
              lng: 0
            }
        }, this.options
   
    );
  }  
  
  handleUpload(event, item) {
    let file = event.target.files[0];

    let reader = new FileReader();
    reader.onload = (e) => {
      file.src = e.target.result;
      this.question.attach = file.src;

      if(item.uiHelper.hasImages)
        this.uploadImage = true;
      else if(item.uiHelper.hasFile)
        this.uploadFile = true;
    };

    reader.readAsDataURL(file);
  }
}


