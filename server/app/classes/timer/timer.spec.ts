import { Timer } from './timer';

// any and magic numbers used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-magic-numbers */

jest.useFakeTimers();

describe('Timer', () => {
    let timer: Timer;

    beforeEach(() => {
        timer = new Timer();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe('start', () => {
        it('should start the timer and call update callback', () => {
            const endCallback = jest.fn();
            const secondUpdateCallback = jest.fn();

            timer.start(10, endCallback, secondUpdateCallback);

            expect(secondUpdateCallback).toHaveBeenCalledTimes(1);
            expect(secondUpdateCallback).toHaveBeenCalledWith(10);

            jest.advanceTimersByTime(5000);

            expect(secondUpdateCallback).toHaveBeenCalledTimes(6); // Called every second
            expect(secondUpdateCallback).toHaveBeenLastCalledWith(5);

            jest.advanceTimersByTime(5000);

            expect(secondUpdateCallback).toHaveBeenCalledTimes(11); // Called every second
            expect(secondUpdateCallback).toHaveBeenLastCalledWith(0);
            expect(endCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('pause', () => {
        it('should pause the timer', () => {
            const endCallback = jest.fn();
            const secondUpdateCallback = jest.fn();

            timer.start(10, endCallback, secondUpdateCallback);
            jest.advanceTimersByTime(2000);

            timer.pause();
            jest.advanceTimersByTime(5000);

            expect(secondUpdateCallback).toHaveBeenCalledTimes(3);
            expect(secondUpdateCallback).toHaveBeenLastCalledWith(8);

            timer.resume();
            jest.advanceTimersByTime(5000);

            expect(secondUpdateCallback).toHaveBeenCalledTimes(9);
            expect(secondUpdateCallback).toHaveBeenLastCalledWith(3);
        });

        it('should do nothing if no timer is running', () => {
            timer['timeoutId'] = null;
            timer['paused'] = false;
            timer.pause();

            expect(timer['paused']).toBe(false);
        });

        it('should do nothing if timer is paused', () => {
            /* eslint-disable  @typescript-eslint/no-empty-function */
            timer['timeoutId'] = setTimeout(() => {}, 0);
            timer['paused'] = true;
            timer.pause();

            expect(timer['timeoutId']).not.toBeNull();
        });

        it('should not resume if not paused', () => {
            timer['paused'] = false;
            const updateTimerCallbackSpy = jest.spyOn(timer as any, 'updateTimerCallback');

            timer.resume();

            expect(updateTimerCallbackSpy).not.toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        it('should reset the timer', () => {
            const endCallback = jest.fn();
            const secondUpdateCallback = jest.fn();

            timer.start(10, endCallback, secondUpdateCallback);
            timer.reset();

            jest.advanceTimersByTime(5000);

            expect(secondUpdateCallback).toHaveBeenCalledTimes(1);
            expect(endCallback).not.toHaveBeenCalled();
        });
    });

    describe('updateTimerCallback', () => {
        it('should update time remaining and call callbacks', () => {
            const notifyPlayersCallbackMock = jest.fn();

            timer['timeRemaining'] = 5;
            timer['notifyPlayersCallback'] = notifyPlayersCallbackMock;

            timer['updateTimerCallback']();

            expect(notifyPlayersCallbackMock).toHaveBeenCalledWith(4);
            expect(notifyPlayersCallbackMock).toHaveBeenCalledTimes(1);
            expect(timer['timeRemaining']).toBe(4);
        });

        it('should call endCallback if no time remaining', () => {
            const endCallbackMock = jest.fn();
            const resetMock = jest.fn();
            const notifyPlayersCallbackMock = jest.fn();

            timer['timeRemaining'] = 0;
            timer['endCallback'] = endCallbackMock;
            timer['reset'] = resetMock;
            timer['notifyPlayersCallback'] = notifyPlayersCallbackMock;

            timer['updateTimerCallback']();

            expect(endCallbackMock).toHaveBeenCalledTimes(1);
            expect(resetMock).toHaveBeenCalledTimes(1);
        });
    });
});
