import { NgIf } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { GameScreenComponent } from './component/game-screen/game-screen.component';
import { MainScreenComponent } from "./component/main-screen/main-screen.component";
import { addAnimation, Animations } from './srv/Helper';

@Component({
  selector: 'app-root',
  imports: [NgIf, GameScreenComponent, MainScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'blackjack';
  status: 'GAME' | 'MAIN' = 'MAIN';

  constructor(private el: ElementRef) { }

  startButtonHandler() {
    const mainScreen = (this.el.nativeElement as Element).getElementsByClassName('main-screen-container')[0];
    addAnimation(mainScreen, Animations['fade out'], () => {
      this.status = 'GAME';
    });
  }
}
