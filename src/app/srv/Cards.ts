const BASE_URL = 'https://deckofcardsapi.com/api/deck';

interface IDeckMetadata {
    success: boolean;
    deck_id: string;
    shuffled: boolean;
    remaining: number;
}

interface ICardPickMetadata {
    success: boolean;
    deck_id: string;
    cards: ICard[];
    remaining: number;
}

interface ICard {
    code: string;
    image: string;
    images: {
        svg: string;
        png: string;
    };
    value: string;
    suit: string;
}

export class Deck {
    private deck?: IDeckMetadata;

    async newDeck(count: number = 1) {
        this.deck = await fetch(`${BASE_URL}/new/shuffle/?deck_count=${count}`)
            .then(async (r) => await (r.json() as Promise<IDeckMetadata>))
            .catch(() => { throw new NetworkError(); });
    }

    async draw(count: number): Promise<ICard[]> {
        if (!this.deck) {
            throw new DeckNotInitialized();
        }

        const result = await fetch(`${BASE_URL}/${this.deck.deck_id}/draw/?count=${count}`)
            .then(async (r) => await (r.json() as Promise<ICardPickMetadata>))
            .catch(() => { throw new NetworkError(); });

        if (this.deck.remaining === result.remaining) {
            throw new NetworkError(); // Probably we got the same response more times, happened during testing
        }
        this.deck.remaining = result.remaining;

        if (this.deck.remaining === 0) {
            await fetch(`${BASE_URL}/${this.deck.deck_id}/pile/used/return/`)
                .catch(() => { throw new NetworkError(); });
            await fetch(`${BASE_URL}/${this.deck.deck_id}/shuffle/`)
                .catch(() => { throw new NetworkError(); });
            const needed = count - result.cards.length;
            if (needed) {
                result.cards.push(...(await this.draw(needed)));
            }
        }

        return result.cards;
    }

    async returnCards(cards: ICard[]) {
        if (!this.deck) {
            throw new DeckNotInitialized();
        }

        const queryParam = cards.map((c) => c.code).join(',');
        await fetch(`${BASE_URL}/${this.deck.deck_id}/pile/used/add/?cards=${queryParam}`);
    }
}

class DeckNotInitialized extends Error { }
class NetworkError extends Error { }

export class Hand {
    private cards: ICard[] = [];

    put(cards: ICard[]) {
        this.cards.push(...cards);
    }

    getValue(skipFirst: boolean = false) {
        let value = 0;
        let aces = 0;
        for (let i = 0; i < this.cards.length; i++) {
            if (skipFirst && i === 0) {
                continue;
            }

            const current = this.cards[i];
            if (current.value === 'KING' || current.value === 'QUEEN' || current.value === 'JACK') {
                value += 10;
            } else if (current.value === 'ACE') {
                value += 11;
                aces++;
            } else {
                value += Number.parseInt(current.value);
            }
        }

        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    empty(): ICard[] {
        return this.cards.slice();
    }
}