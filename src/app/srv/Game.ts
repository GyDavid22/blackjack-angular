import { Deck, Hand } from "./Cards";
import { EventNotifyer } from "./Event";
import { sleep } from './Helper';

export type PLAYERS = 'PLAYER' | 'BANK';

export enum RoundResult {
    BLACKJACK_USER,
    BLACKJACK_BANK,
    BLACKJACK_DRAW,
    USER_WIN,
    BANK_WIN,
    DRAW
}

export class Game {
    deck: Deck;
    hands: Record<PLAYERS, Hand>;
    busyState: EventNotifyer<BusyState>;
    roundResult: EventNotifyer<RoundResult>;
    private isRoundInitialized;
    private isGameInitialized;
    private _currentlyRunning: number = 0;
    private get currentlyRunning(): number {
        return this._currentlyRunning;
    }
    private set currentlyRunning(val: number) {
        if (this._currentlyRunning !== 0 && val === 0) {
            this.busyState.notify(BusyState.FREE);
        } else if (this._currentlyRunning === 0 && val !== 0) {
            this.busyState.notify(BusyState.BUSY);
        }
        this._currentlyRunning = val;
    }

    constructor() {
        this.deck = new Deck();
        this.hands = {
            'PLAYER': new Hand(),
            'BANK': new Hand()
        };
        this.isRoundInitialized = this.isGameInitialized = false;
        this.busyState = new EventNotifyer<BusyState>();
        this.roundResult = new EventNotifyer<RoundResult>();
        (async () => {
            this.currentlyRunning++;
            await this.initGame();
            await this.initRound();
            this.currentlyRunning--;
        })();
    }

    private async initGame() {
        this.currentlyRunning++;

        if (this.isGameInitialized) {
            throw new InvalidStateError();
        }

        await this.deck.newDeck(1);
        this.isGameInitialized = true;

        this.currentlyRunning--;
    }

    private async initRound() {
        this.currentlyRunning++;

        if (this.isRoundInitialized || !this.isGameInitialized) {
            throw new InvalidStateError();
        }

        this.hands.BANK.put(await this.deck.draw(2));
        this.hands.PLAYER.put(await this.deck.draw(2));

        const bankValue = this.hands.BANK.getValue();
        const playerValue = this.hands.PLAYER.getValue();
        if (playerValue === 21 && bankValue !== 21) {
            await this.roundOver(RoundResult.BLACKJACK_USER);
        } else if (bankValue === 21 && playerValue !== 21) {
            await this.roundOver(RoundResult.BLACKJACK_BANK);
        } else if (playerValue === 21 && bankValue === 21) {
            await this.roundOver(RoundResult.BLACKJACK_DRAW);
        }

        this.isRoundInitialized = true;

        this.currentlyRunning--;
    }

    async hit() {
        this.currentlyRunning++;

        if (!this.isRoundInitialized) {
            throw new InvalidStateError();
        }

        this.hands.PLAYER.put(await this.deck.draw(1));
        const playerValue = this.hands.PLAYER.getValue();
        if (playerValue > 21) {
            await this.roundOver(RoundResult.BANK_WIN);
        } else if (playerValue === 21) {
            await this.stand();
        }

        this.currentlyRunning--;
    }

    async stand() {
        this.currentlyRunning++;

        if (!this.isRoundInitialized) {
            throw new InvalidStateError();
        }

        while (this.hands.BANK.getValue() < 17) {
            await sleep(1000);
            this.hands.BANK.put(await this.deck.draw(1));
        }
        const bankValue = this.hands.BANK.getValue();
        const playerValue = this.hands.PLAYER.getValue();
        if (bankValue > 21) {
            await this.roundOver(RoundResult.USER_WIN);
        } else if (playerValue === bankValue) {
            await this.roundOver(RoundResult.DRAW);
        } else if (bankValue > playerValue) {
            await this.roundOver(RoundResult.BANK_WIN);
        } else {
            await this.roundOver(RoundResult.USER_WIN);
        }

        this.currentlyRunning--;
    }

    private async roundOver(result: RoundResult) {
        this.currentlyRunning++;

        if (!this.isRoundInitialized) {
            throw new InvalidStateError();
        }

        this.roundResult.notify(result);

        await sleep(2000);
        await this.deck.returnCards([...this.hands['PLAYER'].empty(), ...this.hands['BANK'].empty()]);

        this.isRoundInitialized = false;

        this.currentlyRunning--;
    }
}

export enum BusyState {
    BUSY, FREE
}

class InvalidStateError extends Error { }
