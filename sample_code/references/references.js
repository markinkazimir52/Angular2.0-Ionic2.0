// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

import {HomePage} from '../../pages/home/home';
import {SupportService} from '../../providers/support-service/support-service';
import * as _ from 'lodash';

@Component({
  providers: [SupportService],
  templateUrl: 'build/pages/references/references.html',
})
export class ReferencePage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController], [SupportService]];
  }

  constructor(viewCtrl, navParams, nav, supportService) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    this.supportService = supportService;  
  }

  ngOnInit() {
    this.supportService.data
      .subscribe(
        data => this.referenceHTML = data.reference
      );
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  goBack(event) {
    this.nav.setRoot(HomePage);
  }
}

@Component({
  template: '<ion-nav [root]="rootView"></ion-nav>'
})
export class BasicPage {
  static get parameters() {
    return [[ViewController]];
  }

  constructor(viewCtrl) {
    this.viewCtrl = viewCtrl;
    this.rootView = HomePage;
  }
	// per: 2.0.0-beta.8 upgrade changelog
	//onPageWillLeave() {
	ionViewWillLeave() {  
	  this.viewCtrl.dismiss();
  }
}
