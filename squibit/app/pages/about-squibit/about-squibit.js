// per: 2.0.0-beta.8 upgrade changelog
//import {Page, NavController, NavParams, ViewController} from 'ionic-angular';
import {Component} from '@angular/core';
import {NavController, NavParams, ViewController} from 'ionic-angular';

import {HomePage} from '../../pages/home/home';
import {SupportService} from '../../providers/support-service/support-service';
import * as _ from 'lodash';

@Component({
  providers: [SupportService],
  templateUrl: 'build/pages/about-squibit/about-squibit.html',
})
export class AboutSquibitPage {
  static get parameters() {
    return [[ViewController], [NavParams], [NavController], [SupportService]];
  }

  constructor(viewCtrl, navParams, nav, supportService) {
    this.viewCtrl = viewCtrl;
    this.navParams = navParams;
    this.nav = nav;
    this.navigatedFromPage = navParams.get('page');
    this.supportService = supportService;  
       
    var quotes = [
      {
        header: 'squibit! mobile',
        items: [
          {note: 'Once upon a midnight dreary, while I pondered, weak and weary. Over many a quaint and curious volume of forgotten lore? While I nodded, nearly napping, suddenly there came a tapping; As of some one gently rapping, rapping at my chamber door! \'Tis some visiter, I muttered, tapping at my chamber door? Only this, and nothing more. Ah, distinctly I remember it was in the bleak December; And each separate dying ember wrought its ghost upon the floor. Eagerly I wished the morrow; —vainly I had sought to borrow?'},
          {note: 'Ihr naht euch wieder, schwankende Gestalten; Die früh sich einst dem trüben Blick gezeigt! Versuch’ ich wohl euch diesmal fest zu halten? Fühl’ ich mein Herz noch jenem Wahn geneigt! Ihr drängt euch zu! Nun gut, so mögt ihr walten? Wie ihr aus Dunst und Nebel um mich steigt; Mein Busen fühlt sich jugendlich erschüttert? Vom Zauberhauch der euren Zug umwittert! Ihr bringt mit euch die Bilder froher Tage!'}
        ]
      }
    ];
    this.quote = quotes[0];
  }

  ngOnInit() {
    this.supportService.data
      .subscribe(
        data => this.aboutHTML = data.about
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
