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
    uncoverFirst: EventNotifyer<CoverState>;
    stats: IGameStats;
    private isRoundInitialized: boolean;
    private isGameInitialized: boolean;
    private isFirstRound: boolean;
    private standSleepMs: number;
    private _currentlyRunning: number = 0;
    private get currentlyRunning(): number {
        return this._currentlyRunning;
    }
    private set currentlyRunning(val: number) {
        if (this._currentlyRunning !== 0 && val === 0 && this.isRoundInitialized) {
            this.busyState.notify(BusyState.FREE);
        } else if (this._currentlyRunning === 0 && val !== 0) {
            this.busyState.notify(BusyState.BUSY);
        }
        this._currentlyRunning = val;
    }

    constructor(standSleepMs: number) {
        this.deck = new Deck();
        this.hands = {
            'PLAYER': new Hand(),
            'BANK': new Hand()
        };
        this.isRoundInitialized = this.isGameInitialized = false;
        this.busyState = new EventNotifyer<BusyState>();
        this.roundResult = new EventNotifyer<RoundResult>();
        this.uncoverFirst = new EventNotifyer<CoverState>();
        this.isFirstRound = true;
        this.standSleepMs = standSleepMs;
        this.stats = {
            playerWins: 0,
            dealerWins: 0,
            playerBlackjacks: 0,
            dealerBlackjacks: 0,
            pushes: 0
        };
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

    async initRound() {
        this.currentlyRunning++;

        if (this.isRoundInitialized || !this.isGameInitialized) {
            throw new InvalidStateError();
        }

        this.uncoverFirst.notify(CoverState.COVER_FIRST);

        if (this.isFirstRound) {
            this.isFirstRound = false;
        } else {
            await this.deck.returnCards([...this.hands['PLAYER'].empty(), ...this.hands['BANK'].empty()]);
        }

        this.hands.BANK.put(await this.deck.draw(2));
        this.hands.PLAYER.put(await this.deck.draw(2));

        this.isRoundInitialized = true;

        const bankValue = this.hands.BANK.getValue();
        const playerValue = this.hands.PLAYER.getValue();
        if (playerValue === 21 && bankValue !== 21) {
            await this.roundOver(RoundResult.BLACKJACK_USER);
        } else if (bankValue === 21 && playerValue !== 21) {
            this.uncoverFirst.notify(CoverState.UNCOVER_FIRST);
            await this.roundOver(RoundResult.BLACKJACK_BANK);
        } else if (playerValue === 21 && bankValue === 21) {
            this.uncoverFirst.notify(CoverState.UNCOVER_FIRST);
            await this.roundOver(RoundResult.BLACKJACK_DRAW);
        }

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

        this.uncoverFirst.notify(CoverState.UNCOVER_FIRST);

        let bankValue = this.hands.BANK.getValue();
        const playerValue = this.hands.PLAYER.getValue();
        while (bankValue < 17 && bankValue <= playerValue) {
            await sleep(this.standSleepMs);
            this.hands.BANK.put(await this.deck.draw(1));
            bankValue = this.hands.BANK.getValue();
        }
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

        switch (result) {
            case RoundResult.BLACKJACK_USER:
                this.stats.playerBlackjacks++;
                this.stats.playerWins++;
                break;
            case RoundResult.BLACKJACK_BANK:
                this.stats.dealerBlackjacks++;
                this.stats.dealerWins++;
                break;
            case RoundResult.BLACKJACK_DRAW:
                this.stats.pushes++;
                break;
            case RoundResult.USER_WIN:
                this.stats.playerWins++;
                break;
            case RoundResult.BANK_WIN:
                this.stats.dealerWins++;
                break;
            case RoundResult.DRAW:
                this.stats.pushes++;
                break;
            default:
                break;
        }

        this.roundResult.notify(result);
        this.isRoundInitialized = false;

        this.currentlyRunning--;
    }
}

export enum BusyState {
    BUSY, FREE
}

export enum CoverState {
    UNCOVER_FIRST, COVER_FIRST
}

interface IGameStats {
    playerWins: number,
    dealerWins: number,
    playerBlackjacks: number,
    dealerBlackjacks: number,
    pushes: number;
}

class InvalidStateError extends Error { }
