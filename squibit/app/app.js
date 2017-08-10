// bugfix on initial setup of system
//import 'zone.js';
//import 'reflect-metadata';

// per: 2.0.0-beta.8 upgrade changelog
//import {App, IonicApp, MenuController, Platform} from 'ionic-angular';
import {Component} from '@angular/core';
import {App} from 'ionic-angular';
import {ionicBootstrap} from 'ionic-angular';
import {MenuController, Platform} from 'ionic-angular';

// per: 2.0.0-beta.7 upgrade changelog
import {ViewChild} from '@angular/core';

import {AboutSquibitPage} from './pages/about-squibit/about-squibit';
import {HomePage} from './pages/home/home';
// removed since page is not yet extant
import {PrivacyPolicyPage} from './pages/privacy-policy/privacy-policy';
import {UpdateConcernPage} from './pages/update-concern/update-concern';
import {SubmitConcernPage} from './pages/submit-concern/submit-concern';
import {ConcernReceivedPage} from './pages/concern-received/concern-received';
import {SelectConcernPage} from './pages/select-concern/select-concern';
import {ShareService} from './providers/share-service/share-service';

@Component({
  templateUrl: 'build/app.html',
	queries: {
		nav: new ViewChild('content')
	},
  providers: [ShareService]
})
class MyApp {
  static get parameters() {
    return [[App], [MenuController], [Platform]];
  }

  constructor(app, menu, platform) {
    this.app = app;
    this.menu = menu;
    this.platform = platform;

    // Initialize the app
    this.initializeApp();

    // Create a list of pages that can be navigated to from the left menu
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'About squibit!', component: AboutSquibitPage },
			// removed since page is not yet extant
      { title: 'Privacy policy', component: PrivacyPolicyPage },
      { title: 'Select Concern', component: SelectConcernPage }
    ];

    // make HomePage the root (or first) page
    this.rootPage = HomePage;
  }

  initializeApp() {
    this.platform.ready()
      .then(() => {
      /**
       * The platform is now ready. Note: if this callback fails to fire, follow
       * the Troubleshooting guide for a number of possible solutions:
       *
       * Okay, so the platform is ready and our plugins are available.
       * Here you can do any higher level native things you might need.
       *
       * First, let\'s hide the keyboard accessory bar (only works natively) since
       * that\'s a better default:
       */
//      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
//        cordova.plugins.Keyboard.setAccessoryBarVisible(true);
//        cordova.plugins.Keyboard.disableScroll(true);
//      }
       /*
       * For example, we might change the StatusBar color. This one below is
       * good for dark backgrounds and light text:
       */
       if (window.StatusBar) {
         StatusBar.setDefaultStyle();
       }
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
		// per: 2.0.0-beta.7 upgrade changelog    
		//let nav = this.app.getComponent('nav');
    this.nav.setRoot(page.component);
  }
}

// per: 2.0.0-beta.8 upgrade changelog
//
// Pass the main app component as the first argument
// Pass any providers for your app in the second argument
// Set any config for your app as the third argument:
// http://ionicframework.com/docs/v2/api/config/Config/
ionicBootstrap(MyApp, [], {});
