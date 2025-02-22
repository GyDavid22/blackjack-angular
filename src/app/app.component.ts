import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { GameScreenComponent } from './component/game-screen/game-screen.component';
import { MainScreenComponent } from "./component/main-screen/main-screen.component";

@Component({
  selector: 'app-root',
  imports: [NgIf, GameScreenComponent, MainScreenComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'blackjack';
  status: 'GAME' | 'MAIN' = 'MAIN';

  startButtonHandler() {
    this.status = 'GAME';
  }
}
