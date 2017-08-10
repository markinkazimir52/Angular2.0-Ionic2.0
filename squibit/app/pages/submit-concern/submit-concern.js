// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Alert, NavController, NavParams, ViewController} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {ShareService} from '../../providers/share-service/share-service';
import {ConcernService} from '../../providers/concern-service/concern-service';

import {ConcernReceivedPage} from '../concern-received/concern-received';
import {HomePage} from '../../pages/home/home';
import * as _ from 'lodash';

@Component({
  templateUrl: 'build/pages/submit-concern/submit-concern.html',
  providers: [QuestionsService, ConcernService],
})
export class SubmitConcernPage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController], [ShareService], [ConcernService]];
  }

  constructor(viewCtrl, navParams, nav, shareService, concernService) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    this.questions = navParams.get('questions');
    this.concernService = concernService;    
    this.shareService = shareService;
    this.answeredTopic = this.shareService.getTopic();
    this.anonymous = false;
    this.affiliation = "";
    this.name = "";
    this.email = "";
    this.phone = "";

    this.answeredQuestions = [];
    this.concern = {
        "questions": [
          {
            "answer" : "",
            "detail" : "",
            "question" : 1
          }
        ],
        "attachments": [],
        "submit": {
          "affiliation" : "",
          "anonymous" : false,
          "email" : "",
          "name" : "",
          "phone" : "",
          "tip_id" : ""
        },
        "times": {
          "start" : "",
          "submitted" : ""
        },
        "type": "",
        "updates": []
    }
    
    // styling for the stored Tip ID alert pop-up
    this.alertOptions = {
        title: "Your Affiliation",
        subTitle: "How are you affiliated with the company?"
    }

    this.quote = {
      title: 'Submit your Concern',
      description: 'You\'re almost there, thank you! We just need some final details before submitting your concern.'
    }

    this.baseQuestionIndex = _.findIndex(this.questions, {'headline': 'Please elaborate'});
    this.baseQuestion = this.questions[this.baseQuestionIndex];
    for(let index = 0; index < this.baseQuestion.suggestedAnswerList.length; index ++) {
      for( let i = 0; i < this.questions.length; i++) {
        if( this.baseQuestion.suggestedAnswerList[index].headline == this.questions[i].headline ){          

          if(this.questions[i].acceptedAnswerList.length > 0)
            this.answeredQuestions.push(this.questions[i]);
        }
      }
    }
    
    // storage variable for ID Pairings
    // default: none
    this.storedTipIDPairs = [];

	// create unique Tip ID for this new Concern
    this.tip_id = this.generateTipID();
    console.log(this.tip_id);
  }
    
  ngOnInit() {
    this.concernService.data
      .subscribe(
        data => this.concerns = data
      );
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  // create the user-readable Tip ID
  generateTipID() {
    // generate a 6-character long randomized alphanumeric Tip ID
    let tid = Math.random().toString(36).substr(2, 6);
    console.log("Generated user-friendly Tip ID: " + tid);
    // return value to caller
    return (tid);
  }
  
  // store user-readable Tip ID linked to unique Firebase ID
  ltsStoreNewTipID(tipID, firebaseID) {
    console.log("Saving new ID pairing: " + tipID + " --> " + firebaseID);
    // create a new ID pair object for the specified IDs
    let newIDPair = {"tip_id": tipID, "firebase_id": firebaseID};
    // fetch existing long-term storage ID Pairing asset as object array
    this.getLtsTipIDs();
    // add new ID pairing to listing
    this.storedTipIDPairs.push(newIDPair);
    // save updated ID pairing collection to long-term storage
    this.setLtsTipIDs(this.storedTipIDPairs);
    console.log("Save complete.");
  }
  
  // get any stored Tip IDs from long term storage
  getLtsTipIDs() {
    console.log("checking for stored Tip IDs");
    // test to see if local storage variable for TipIDs exists
    if ((localStorage.length > 0) && ("ltsTipIDs" in localStorage)) {
        // long-term storage variable for Tip IDs exists
        // so parse the stored JSON and load it into working variable for use by Angular
        this.storedTipIDPairs = JSON.parse(localStorage.getItem('ltsTipIDs'));
        console.log("loaded " + this.storedTipIDPairs.length + " stored Tip IDs...");
    } else {
        // note lack of existing ID Pairs
        console.log("no stored ID pairs found.");
    }
  }
  
  // save an array of ID Pairs to long-term storage (localstorage)
  setLtsTipIDs(allIDPairs) {
    console.log("Updating master ID Pairing collection in long-term storage");
    // test to see if local storage variable for TipIDs exists
    if ((localStorage.length > 0) && ("ltsTipIDs" in localStorage)) {
        // long-term storage variable for ID Pairings exists, so remove it
        localStorage.removeItem('ltsTipIDs');
    }
    // save new ID Pairing variable to long-term storage (localStorage)
    localStorage.setItem('ltsTipIDs', JSON.stringify(allIDPairs));
    // confirm that push to long-term storage worked
    if ('ltsTipIDs' in localStorage) {
        console.log("LTS Update completed.");
    } else {
        console.log("Update of localStorage appears to be unsuccessful - Tip ID pairings may not have been saved.");
    }
    // clear in-memory copy of IP pairings array
    this.storedTipIDPairs = [];
  }
  
  navToConcernReceived() {
    // make sure that an Affiliation value was selected
    if (this.affiliation != "" && ((this.anonymous == false && this.name != "") || this.anonymous == true)) {
        // user has provided a value for affiliation
      
        // Type of Concern Object
        if(this.answeredTopic == 'Integrity')
          this.answeredTopic = 'Ethics';
        else if (this.answeredTopic == 'Not Sure')
          this.answeredTopic = 'Other';

        this.answeredTopic = _.upperCase(this.answeredTopic);
        this.concern.type = this.answeredTopic;

        // Times of Concern Object.
        let rightNow = new Date();
        let nowMins = "00";
        let nowHours = "00";
        let nowLabel = "AM";
        this.startTime = this.shareService.getStartTime();
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
        
        this.submitTime = (rightNow.getMonth() + 1) + "/" + rightNow.getDate() + "/" + rightNow.getFullYear() + " at " + nowHours + ":" + nowMins + " " + nowLabel;

        this.concern.times = {
          start: this.startTime,
          submitted: this.submitTime
        }

        // Submit of Concern Object.
        if(this.anonymous){
          // anonymity desired
          this.submit = {
            affiliation: this.affiliation,
            anonymous: this.anonymous,
            email: "",
            name: "",
            phone: "",
            tip_id: this.tip_id
          }  
        }else {
          // share personal information (if provided)
          this.submit = {
            affiliation: this.affiliation,
            anonymous: this.anonymous,
            email: this.email,
            name: this.name,
            phone: this.phone,
            tip_id: this.tip_id
          }
        }

        this.concern.submit = this.submit;

        // Questions of Concern Object.
        this.submitQuestions = [];
        _.each(this.answeredQuestions, (
          (item) => {
            item.index = _.findIndex(this.baseQuestion.suggestedAnswerList, function(suggestedItem) { return suggestedItem.name == item.name }) + 1;

            _.each(item.acceptedAnswerList, (
              (answerItem) => {

            if(answerItem.uiHelper.hasTextArea)
              answerItem.value = answerItem.textarea;
            else if (answerItem.uiHelper.hasDate){
              answerItem.date = new Date(answerItem.date);
              let year = answerItem.date.getFullYear();
              let month = answerItem.date.getMonth() + 1;
              if(month < 10)
                month = '0' + month;
              let date = answerItem.date.getDate();
              let hours = answerItem.date.getHours();
              let mins = answerItem.date.getMinutes();
              if (mins < 10) {
                mins = '0' + mins;
              }

              answerItem.value = month + '/' + date + '/' + year;
              answerItem.detail = hours+':'+mins;
            }
            else if (answerItem.uiHelper.hasGeoPoint){
                if (!((item.geopoint.lat == 0) || (item.geopoint.lng == 0))) {
                    answerItem.detail = 'lat:'+ item.geopoint.lat + ',lon:' + item.geopoint.lng + ',accuracy:10';
                }
            }
            else if (answerItem.hasOptionalInput)
              answerItem.detail = answerItem.optionalInputText;

                if(!answerItem.detail)
                  answerItem.detail = "";

                if(item.attach){
                  answerItem.detail = true;
                  this.concern.attachments.push(item.attach);
                }

                if(!answerItem.value)
                  answerItem.value = answerItem.name;

                this.submitQuestions.push({
                  answer: answerItem.value,
                  detail: answerItem.detail,
                  question: item.index
                })
              }
            ))
          }
        ))

        this.concern.questions = this.submitQuestions;
       
        // setTimeout(() => {
              // console.log(this.concerns);
        // });

        this.concernService.postConcern(this.concern)
          .subscribe(
            data => this.receivedConcernData(data)
          );
        // clear the stored topic
        this.shareService.clearTopic();
        // proceed to next page - Concern Received
        this.nav.push(ConcernReceivedPage, {
          page: this,
          tip_id: this.tip_id
        });
    } else {
        // is affiliation missing?
        if (this.affiliation == "") {
            // no affiliation provided
            // user has not selected an affiliation, so make them do so
            let alert = Alert.create({
                title: 'What is your role?',
                message: 'We need to know how you are affiliated with this organization.',
                buttons: ['Okay']
            });
            this.nav.present(alert);
        } else {
            // not enough personal details - user is not anonymous but no name provided
            // user has not selected an affiliation, so make them do so
            let alert = Alert.create({
                title: 'Who are you?',
                message: 'Please provide your contact information to continue.  If you would prefer to be anonymous, please slide the toggle button on this screen to "on" and submit again.',
                buttons: ['Okay']
            });
            this.nav.present(alert);
        }
    }
  }

  receivedConcernData(result) {
    this.receivedConcern = result;
    // update ID Pairings in long-term storage
    this.ltsStoreNewTipID(this.tip_id, (this.receivedConcern.name));
  }

  // generate Help pop-up alert
  helpTapped(event) {
    let alert = Alert.create({
        title: 'Need help?',
        message: 'Do you want to submit this report anonymously? Set the slider to \'yes\' or \'no\' depending on your preference.  Below that please enter your company affiliation, along with some basic contact info that will stay private if you choose to remain anonymous.',
        buttons: ['Okay']
      });
      this.nav.present(alert);
  }
}
