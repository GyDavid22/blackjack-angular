export class EventNotifyer<T> {
    private observers: ((param: T) => void)[] = [];

    subscribe(call: (param: T) => void) {
        this.observers.push(call);
    }

    unsubscribe(call: (param: T) => void) {
        this.observers.splice(this.observers.indexOf(call), 1);
    }

    notify(param: T) {
        for (const call of this.observers) {
            call(param);
        }
    }
}