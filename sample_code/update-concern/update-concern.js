// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Modal, NavController, NavParams, ViewController} from 'ionic-angular';
import {UpdateService} from '../../providers/update-service/update-service';
import {HomePage} from '../../pages/home/home';
import {ConcernReceivedPage} from '../../pages/concern-received/concern-received';
import {UpdateReceivedPage} from '../../pages/update-received/update-received';
import {AlertController} from 'ionic-angular';
import * as _ from 'lodash';

@Component({
  templateUrl: 'build/pages/update-concern/update-concern.html',
  providers: [UpdateService],
})
export class UpdateConcernPage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController], [UpdateService], [AlertController]];
  }

  constructor(viewCtrl, navParams, nav, updateService, alertCtrl) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    this.alertCtrl = alertCtrl;
    // load the JSON string of the ID Pair selected by the user
    this.requestedID = navParams.get('tipId');
    
    // access the Update Concern API service methods
    this.updateService = updateService;
    
    this.quote = {
      title: 'Update an Existing Concern',
      description: 'You can send us additional information about your existing concern here.'
    }

    // storage variable for Tip ID of this request
    this.updateTipID = this.requestedID;
    
    // existing update storage variables
    this.updateRequestExists = false;
    this.updateFirebaseID = false;
    
    // set default information to display
    this.updateName = "Generic Co.";
    this.rightNow = new Date();
    this.updateDate = this.rightNow.toDateString();
    this.updateBody = "Thank you for your inquiry. No new information has been requested about this concern.\r\rIf you have any new information to add, please enter it below and it will be added to the existing report.";
    
    // storage variable for user update input
    // default: empty
    this.updateInput = '';
    
    // faux-semaphore to avoid missing update status
    this.updateLoadComplete = false;
  }

  // tasks to run on initial lookup
  ngOnInit() {
  /*
    // confirm that the specified Tip ID is not linked to a placeholder Firebase ID
    if (this.requestedIDPair.firebase_id != "placeholder") {
        // look up any existing Tip Updates for specified Firebase ID
        console.log("looking for the most recent update");
        this.updateService.lookupLastConcernUpdate(this.requestedIDPair.firebase_id)
            .subscribe(
              data => this.handleConcernUpdateDisplay(data)
            );
    } else {
        // got a placeholder event - don't do anything with Firebase
        console.log("using placeholder Firebase ID - not doing HTTP activity");
        this.updateLoadComplete = true;
    }
  */
  }
  
  // handler - update display and storage variables with Update info, if needed
  handleConcernUpdateDisplay(data) {
    // determine if an update exists
    if (data == null) {
        console.log("no update exists");
        // no update exists - no changes needed to the default display
        this.updateRequestExists = false;
    } else {
        console.log("update exists");
        // store the Firebase ID of the existing update
        this.updateFirebaseID = Object.keys(data)[0];
        console.log("update ID: " + this.updateFirebaseID);
        console.log("raw contents: " + JSON.stringify(data[this.updateFirebaseID]));
        // determine if existing object is a "response" or "request"
        if ("request" in data[this.updateFirebaseID]) {
            console.log("found a request in existing update");
            // check if request was already answered by user response
            if ("response" in data[this.updateFirebaseID]) {
                // request has been answered by user previously
                console.log("request has been previously answered by user");
                // clear current firebase ID since a new response is required
                this.updateFirebaseID = false;
            } else {
                // this is an unsolicited request from the responder
                console.log("request is still un-answered");
                // update with "request" exists
                this.updateRequestExists = true;
                // existing update is a request from dashboard so populate display
                this.updateName = data[this.updateFirebaseID].request.name;
                this.updateDate = data[this.updateFirebaseID].request.date;
                this.updateBody = data[this.updateFirebaseID].request.msg;
                // mark the existing response as "viewed"
                console.log("setting viewed flag on this request");
                this.updateService.setExistingUpdateRequestViewedStatus(this.requestedIDPair.firebase_id, this.updateFirebaseID).subscribe();
            }
        } else {
            // existing update is a previous user-generated "response"
            // so clear the Firebase ID of the update - won't be needed
            this.updateFirebaseID = false;
            console.log("last update was an unsolicited response");
        }
    }
    // unlock update functions
    this.updateLoadComplete = true;
  }
  
  // handler - add new unsolicited response
  handleAddUnsolicitedResponse(data) {
  
  }
  
  // handler - add a "response" to the existing "request"
  handleAddResponseToRequest(data) {
    
  }
  
  // click handler for "done" button
  doneButtonClicked(event) {
    /*
    // make sure update information was fully loaded
    if (this.updateLoadComplete) {
        // determine if any content provided in text area
        if (this.updateInput.length > 0) {
            // user input was provided so send that to database
            // build solicited response object
            let sendTime = new Date();
            let sendData = {
                "date": sendTime.getMonth() + "/" + sendTime.getDate() + "/" + sendTime.getFullYear() + " at " + sendTime.getHours() + ":" + sendTime.getMinutes(),
                "msg": this.updateInput
            }
            // determine if answer is response to earlier request, or unsolicited
            if (this.updateRequestExists && this.updateFirebaseID) {
                // send solicited response (if not placeholder firebase ID)
                if (this.requestedIDPair.firebase_id != "placeholder") {
                    // real request - run HTTP activity
                    this.updateService.answerSolicitedUpdate(this.requestedIDPair.firebase_id, this.updateFirebaseID, sendData)
                        .subscribe(
                            data => this.handleAddResponseToRequest(data)
                        );
                }
            } else {
                // send unsolicited response (if not placeholder firebase ID)
                if (this.requestedIDPair.firebase_id != "placeholder") {
                    // real request - run HTTP activity
                    this.updateService.createUnsolicitedUpdate(this.requestedIDPair.firebase_id, sendData)
                        .subscribe(
                            data => this.handleAddUnsolicitedResponse(data)
                        );
                }
            }
            // navigate to Concern Received
            // this.navToConcernReceived();
            this.navToUpdateReceived();
        } else {
            // // no user input provided so this is just a "viewing" interaction
            // // thank the user
            this.navToUpdateReceived();
        }
    }
    */
    
    // no user input provided so this is just a "viewing" interaction
    // thank the user
    this.navToUpdateReceived();
  }
  
  dismiss() {
    this.viewCtrl.dismiss();
  }

  helpTapped(event) {
    let alert = this.alertCtrl.create({
        title: 'Need help?',
        message: 'Use this screen to see if any follow-up information has been requested after your report was submitted. Use the text box below to respond to any additional questions or to add more information to a previously submitted report (even if it wasn\'t requested).',
        buttons: ['Okay']
    });

    alert.present();
  }

  navToUpdateReceived() {
    this.nav.push(UpdateReceivedPage, {
        page: this,
        tip_id: this.updateTipID
    });
  }
}

