// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Modal, NavController, NavParams, ViewController} from 'ionic-angular';
//import {Storage, LocalStorage} from 'ionic-angular';
import {Http, Headers, HTTP_PROVIDERS, URLSearchParams} from '@angular/http';
import {Alert} from 'ionic-angular';
import {UpdateConcernPage} from '../update-concern/update-concern';
import {HomePage} from '../../pages/home/home';
import * as _ from 'lodash';

@Component({
  templateUrl: 'build/pages/select-concern/select-concern.html',
})
export class SelectConcernPage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController]];
  }

  constructor(viewCtrl, navParams, nav) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    
    // styling for the stored Tip ID alert pop-up
    this.alertOptions = {
        title: "Prior Tip IDs",
        subTitle: "If you do not see your Tip ID listed here, please type it in "
    }
    
    // variable for storing the Tip ID-Firebase ID array
    // default: empty array (none found)
    this.storedTipIDPairs = [];
    
    // variable for storing the *selected* Tip ID to use
    // default: empty
    this.selectedTipIDPair = '';
    
    // variable for storing the user input Tip ID
    this.inputTipID = '';
    
    // set the display contents for the page's dark-blue info region
    this.quote = {
      title: 'Select an Existing Concern',
      description: 'See requests for more information and provide additional details on your previous concern.'
    }
    
    // fetch stored Tip ID array on initial page load
    // TODO: check this is correct plate to call function on page load
    this.getLtsTipIDs();
  }
  
  dismiss() {
    this.viewCtrl.dismiss();
  }

  // handle input on the stored Tip ID dropdown
  storedTipIDSelection($event) {
    console.log("User selected a Tip ID from existing list");
    // save that value as 
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
    }
  }
  
  // search for user-typed Tip ID value in long term storage array
  lookupLtsTipIDs(userInputTipID) {
    var that = this;
    // debug info
    console.log("Searching for Tip ID pair matching input ID: " + userInputTipID);
    // search for provided Tip ID in LTS array (if found)
    if (this.storedTipIDPairs.length > 0) {
        // LTS Tip ID content exists so search for matching value
        this.storedTipIDPairs.forEach(function(idPair, userTipID) {
            // check if ID-Pair has matching Tip ID to user input
            if (userTipID == idPair.tip_id) {
                // got a match so store the ID Pair
                console.log("Found Tip ID pair match");
                that.setSelectedTipIDPair(idPair);
            }
        });
    }
  }
  
  // handles search for proper Tip LTS object 
  userEnteredTipID() {
    var that = this;
    // debug info
    console.log("Searching for Tip ID pair matching input ID: " + this.inputTipID);
    // search for provided Tip ID in LTS array (if found)
    if (this.storedTipIDPairs.length > 0) {
        // LTS Tip ID content exists so search for matching value
        this.storedTipIDPairs.forEach(function(idPair) {
            // check if ID-Pair has matching Tip ID to user input
            if (that.inputTipID == idPair.tip_id) {
                // got a match so store the ID Pair
                console.log("Found Tip ID pair match");
                that.setSelectedTipIDPair(idPair);
            }
        });
        
    }
  }
  
  // set the Tip ID pair for use by other code on the page
  // needed because page variables not accessible in anonymous function
  setSelectedTipIDPair(pairObj) {
    // save as JSON-style string that can be parsed later
    this.selectedTipIDPair = JSON.stringify(pairObj);
    console.log("page ID pair: " + this.selectedTipIDPair);
  }
  
  // going back from this page should take the user to "Home" page
  goBack(event) {
    this.nav.setRoot(HomePage);
  }

  // move forward with selected concern
  navToUpdateConcern() {
    // check if a Tip ID was entered
    if (this.inputTipID == '') {
        // no tip ID entered so display a notice to user
        let alert = Alert.create({
            title: "Enter your Concern ID",
            message: "Please enter your Concern ID to view requests for information or add an update to your previous concern.",
            buttons: ['Okay']
        });
        this.nav.present(alert);
    } else {
        // look up Tip ID pair based on user input of Tip ID
        this.userEnteredTipID(this.inputTipID);
        // check if an ID pair was found for the provided Tip ID
        if (this.selectedTipIDPair == '') {
            // no ID pair was found searching this device's LTS storage
            console.log("no Tip ID was found - use a placeholder value");
            console.log("NOTE: this just throws away any user input provided next!");
            this.selectedTipIDPair = JSON.stringify({"tip_id": this.inputTipID, "firebase_id": "placeholder"});
        } else {
            // an ID Pair was found, so use it
            console.log("an ID Pair was found for the input Tip ID");
        }
        // note which tip ID was selected when continuing forward
        console.log("Selected Tip ID: " + (JSON.parse(this.selectedTipIDPair)).tip_id + " (" + (JSON.parse(this.selectedTipIDPair)).firebase_id + ")");
        // navigate to the success page
        this.nav.push(UpdateConcernPage, {
          page: this,
          selectedIDPair: this.selectedTipIDPair
        });
    }
  }

  // show the "Help" alert pop-up with static contents
  helpTapped(event) {
    let alert = Alert.create({
        title: 'Need help?',
        message: 'This is the page to re-open a previously submitted report. Please enter your corresponding squibit ID or select it from the \'stored ID\' dropdown.',
        buttons: ['Okay']
    });
    this.nav.present(alert);
  }
}
