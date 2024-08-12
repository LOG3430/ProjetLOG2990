import { MS_IN_SECOND } from './timer.constants';

export class Timer {
    private tickDuration = MS_IN_SECOND;

    private timeRemaining: number;
    private timeoutId: NodeJS.Timeout | null;

    private paused = false;

    private endCallback: () => void;
    private notifyPlayersCallback: (number) => void;

    start(duration: number, endCallback: () => void, secondUpdateCallback: (number) => void) {
        this.reset();
        this.endCallback = endCallback;
        this.notifyPlayersCallback = secondUpdateCallback;

        this.timeRemaining = duration + 1;
        this.paused = false;

        this.updateTimerCallback();
    }

    pause() {
        if (!this.timeoutId || this.paused) {
            return;
        }

        this.paused = true;
        this.timeRemaining++;
        clearTimeout(this.timeoutId);
    }

    resume() {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        this.updateTimerCallback();
    }

    reset() {
        this.timeRemaining = 0;
        this.setTick(MS_IN_SECOND);

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    setTick(tickDuration: number) {
        this.tickDuration = tickDuration;
    }

    private updateTimerCallback() {
        this.timeRemaining--;
        this.notifyPlayersCallback(this.timeRemaining);

        if (this.timeRemaining <= 0) {
            this.reset();
            this.endCallback();
            return;
        }

        this.timeoutId = setTimeout(() => this.updateTimerCallback(), this.tickDuration);
    }
}
