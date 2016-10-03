// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {AlertController, NavController, NavParams, ViewController} from 'ionic-angular';

import {QuestionsService} from '../../providers/questions-service/questions-service';
import {ShareService} from '../../providers/share-service/share-service';
import {ConcernService} from '../../providers/concern-service/concern-service';
import {AuthenticateService} from '../../providers/authenticate-service/authenticate-service';

import {ConcernReceivedPage} from '../concern-received/concern-received';
import {QuestionSlidePage} from '../question-slide/question-slide';
import {HomePage} from '../../pages/home/home';
import * as _ from 'lodash';

@Component({
  templateUrl: 'build/pages/submit-concern/submit-concern.html',
  providers: [AuthenticateService, QuestionsService, ConcernService],
})
export class SubmitConcernPage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController], [AuthenticateService], [ShareService], [ConcernService], [AlertController]];
  }

  constructor(viewCtrl, navParams, nav, authenticateService, shareService, concernService, alertCtrl) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    this.lastQuestion = navParams.get('question');
    this.concernService = concernService;
    this.shareService = shareService;
    this.answeredTopic = this.shareService.getTopic();
    this.anonymous = false;
    this.affiliation = "";
    this.name = "";
    this.email = "";
    this.phone = "";
    this.alertCtrl = alertCtrl;
    this.authenticateService = authenticateService;
    
    // storage variable for JSON of /affiliation data
    this.affiliationData = {
      affiliation: "",
      anonymity: false,
      email: "",
      name: "",
      phone: ""
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

    
    // storage variable for ID Pairings
    // default: none
    this.storedTipIDs = [];
  }
  
  
  ngOnInit() {
    // load all existing TipIDs for initial population of dropdown
    this.getLtsTipIDs();
    
    /*
    this.concernService.data
      .subscribe(
        data => this.concerns = data
      );
    */
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  // handle faux Back button
  backTapped() {
    // go back to previous page - "question-slide"
    // provide the last question to the page as it's "first" to view - that will match Question pointer
    this.nav.push(QuestionSlidePage, {
      page: this,
      firstQuestion: this.lastQuestion
    });
  }
  
  
  // store user-readable Tip ID into longterm storage
  ltsStoreNewTipID(tipID) {
    console.log("Saving new ID: " + tipID);
    
    // fetch existing long-term storage ID Pairing asset as object array
    this.getLtsTipIDs();
    // add new ID pairing to listing
    this.storedTipIDs.push(tipID);
    // save updated ID pairing collection to long-term storage
    this.setLtsTipIDs(this.storedTipIDs);
    
    console.log("...done!");
  }
  
  // get any stored Tip IDs from long term storage
  getLtsTipIDs() {
    console.log("checking for stored Tip IDs");
    // test to see if local storage variable for TipIDs exists
    if ((localStorage.length > 0) && ("ltsTipIDsV2" in localStorage)) {
        // long-term storage variable for Tip IDs exists
        // so parse the stored JSON and load it into working variable for use by Angular
        this.storedTipIDs = JSON.parse(localStorage.getItem('ltsTipIDsV2'));
        console.log("loaded " + this.storedTipIDs.length + " stored IDs...");
    } else {
        // note lack of existing ID Pairs
        console.log("no stored IDs found.");
    }
  }
  
  // save an array of ID Pairs to long-term storage (localstorage)
  setLtsTipIDs(allIDs) {
    console.log("Updating master ID Pairing collection in long-term storage");
    // test to see if local storage variable for TipIDs exists
    if ((localStorage.length > 0) && ("ltsTipIDsV2" in localStorage)) {
        // long-term storage variable for ID Pairings exists, so remove it
        localStorage.removeItem('ltsTipIDsV2');
    }
    // save new ID Pairing variable to long-term storage (localStorage)
    localStorage.setItem('ltsTipIDsV2', JSON.stringify(allIDs));
    // confirm that push to long-term storage worked
    if ('ltsTipIDsV2' in localStorage) {
        console.log("LTS Update completed.");
    } else {
        console.log("Update of localStorage appears to be unsuccessful - Tip ID pairings may not have been saved.");
    }
    // clear in-memory copy of IP pairings array
    this.storedTipIDs = [];
  }
  
  /*
  // create the user-readable Tip ID
  generateTipID() {
    // generate a 6-character long randomized alphanumeric Tip ID
    let tid = Math.random().toString(36).substr(2, 6);
    console.log("Generated user-friendly Tip ID: " + tid);
    // return value to caller
    return (tid);
  }
  */
  
  navToConcernReceived() {
    // make sure that an Affiliation value was selected
    if (this.affiliation != "" && ((this.anonymous == false && this.name != "") || this.anonymous == true)) {
        // user has provided a value for affiliation

        // load POST data object properly
        if (this.anonymous) {
          // anonymity desired
          this.affiliationData = {
            affiliation: this.affiliation,
            anonymity: this.anonymous,
            email: "",
            name: "",
            phone: ""
          }  
        } else {
          // share personal information (if provided)
          this.affiliationData = {
            affiliation: this.affiliation,
            anonymity: this.anonymous,
            email: this.email,
            name: this.name,
            phone: this.phone
          }
        }
        
        // perform POST to /affiliation
        this.concernService.postConcern(this.affiliationData)
          .subscribe(
            data => {
                // process the received data - TipID passing & LTS storage
                this.receivedConcernData(data);
            },
            err => console.error(err),
            () => {
                // clear existing session
                // clear the existing session on the server - action completed
                this.authenticateService.clearAuth()
                    .subscribe(
                      data => {
                        this.data = data;
                      },
                      err => console.error(err),
                      () => {
                          // proceed to next page - Concern Received
                          this.nav.push(ConcernReceivedPage, {
                            page: this,
                            tip_id: this.tip_id
                          });
                      }
                    );
            }
          );
    } else {
        // is affiliation missing?
        if (this.affiliation == "") {
            // no affiliation provided
            // user has not selected an affiliation, so make them do so
            let alert = this.alertCtrl.create({
                title: 'What is your role?',
                message: 'We need to know how you are affiliated with this organization.',
                buttons: ['Okay']
            });
            alert.present();
        } else {
            // not enough personal details - user is not anonymous but no name provided
            // user has not selected an affiliation, so make them do so
            let alert = this.alertCtrl.create({
                title: 'Who are you?',
                message: 'Please provide your contact information to continue.  If you would prefer to be anonymous, please slide the toggle button on this screen to "on" and submit again.',
                buttons: ['Okay']
            });
            alert.present();
        }
    }
  }

  receivedConcernData(result) {
    // save the received TipID for use later
    this.tip_id = result.detail.tip_id;
    console.log("received Tip ID: " + this.tip_id);
    // update Tip ID in long-term storage
    this.ltsStoreNewTipID(this.tip_id);
  }

  // generate Help pop-up alert
  helpTapped(event) {
    let alert = this.alertCtrl.create({
        title: 'Need help?',
        message: 'Do you want to submit this report anonymously? Set the slider to \'yes\' or \'no\' depending on your preference.  Below that please enter your company affiliation, along with some basic contact info that will stay private if you choose to remain anonymous.',
        buttons: ['Okay']
      });
      alert.present();
  }
}
