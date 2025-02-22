import { NgFor } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { BusyState, CoverState, Game, RoundResult } from '../../srv/Game';
import { sleep } from '../../srv/Helper';

@Component({
  selector: 'app-game-screen',
  imports: [NgFor],
  templateUrl: './game-screen.component.html',
  styleUrl: './game-screen.component.css'
})
export class GameScreenComponent implements OnDestroy {
  game: Game;
  buttonsDisabled: boolean;
  backOfCard: string = 'https://deckofcardsapi.com/static/img/back.png';
  showFirst: boolean;

  constructor() {
    this.game = new Game(1000);
    this.buttonsDisabled = false;
    this.showFirst = false;
    this.game.busyState.subscribe(this.disabledHandler);
    this.game.uncoverFirst.subscribe(this.uncoverHander);
    this.game.roundResult.subscribe(this.roundOverHandler);
  }

  ngOnDestroy(): void {
    this.game.busyState.unsubscribe(this.disabledHandler);
    this.game.uncoverFirst.unsubscribe(this.uncoverHander);
    this.game.roundResult.unsubscribe(this.roundOverHandler);
  }

  private disabledHandler = (state: BusyState) => {
    switch (state) {
      case BusyState.BUSY:
        this.buttonsDisabled = true;
        break;
      case BusyState.FREE:
        this.buttonsDisabled = false;
        break;
      default:
        break;
    }
  };

  private uncoverHander = (state: CoverState) => {
    switch (state) {
      case CoverState.UNCOVER_FIRST:
        this.showFirst = true;
        break;
      case CoverState.COVER_FIRST:
        this.showFirst = false;
        break;
      default:
        break;
    }
  };

  private roundOverHandler = async (state: RoundResult) => {
    await sleep(2000);
    this.game.initRound();
  };
}
