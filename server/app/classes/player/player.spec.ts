import { Timer } from '@app/classes/timer/timer';
import { Player } from './player';
import { BONUS_MULTIPLIER, EDIT_TIME_LIMIT_S } from './player.constants';

// any used for tests
/* eslint-disable  @typescript-eslint/no-magic-numbers */

describe('Player', () => {
    let player: Player;

    beforeEach(() => {
        player = new Player('1', 'John');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize player properties correctly', () => {
            expect(player.id).toEqual('1');
            expect(player.name).toEqual('John');
            expect(player.selectedChoiceIndexes).toEqual([]);
            expect(player.hasLockedAnswers).toEqual(false);
            expect(player.lastQuestionResult).toEqual(0);
            expect(player.lastQuestionIsBonus).toEqual(false);
            expect(player['points']).toEqual(0);
            expect(player['bonusTimes']).toEqual(0);
        });
    });

    describe('getPoints', () => {
        it('should return player points', () => {
            player['points'] = 10;
            expect(player.getPoints()).toEqual(10);
        });
    });

    describe('getBonusTimes', () => {
        it('should return player bonus times', () => {
            player['bonusTimes'] = 10;
            expect(player.getBonusTimes()).toEqual(10);
        });
    });

    describe('resetForNewQuestion', () => {
        it('should reset player for a new question', () => {
            player.selectedChoiceIndexes = [0];
            player.hasLockedAnswers = true;
            player.lastQuestionResult = 10;
            player.lastQuestionIsBonus = true;

            player.resetForNewQuestion();

            expect(player.selectedChoiceIndexes).toEqual([]);
            expect(player.hasLockedAnswers).toEqual(false);
            expect(player.lastQuestionResult).toEqual(0);
            expect(player.lastQuestionIsBonus).toEqual(false);
        });
    });

    describe('lockAnswers', () => {
        it('should lock answers and set answer time', () => {
            player.lockAnswers();

            expect(player.hasLockedAnswers).toEqual(true);
            expect(player.answerTime).toBeDefined();
        });

        it('should not lock answers if already locked', () => {
            player.hasLockedAnswers = true;
            const initialAnswerTime = player.answerTime;

            player.lockAnswers();

            expect(player.hasLockedAnswers).toEqual(true);
            expect(player.answerTime).toEqual(initialAnswerTime);
        });
    });

    describe('updateScore', () => {
        it('should update player score', () => {
            player.updateScore(10);

            expect(player['points']).toEqual(10);
            expect(player.lastQuestionResult).toEqual(10);
            expect(player.lastQuestionIsBonus).toEqual(false);
        });

        it('should update player score with bonus points', () => {
            player.updateScoreForBonus(10);

            expect(player['points']).toEqual(10 * BONUS_MULTIPLIER);
            expect(player.lastQuestionResult).toEqual(10 * BONUS_MULTIPLIER);
            expect(player.lastQuestionIsBonus).toEqual(true);
            expect(player['bonusTimes']).toEqual(1);
        });

        it('should stack question and bonus points when answer is right with bonus', () => {
            player.updateScore(10);
            player.updateScoreForBonus(10);

            expect(player['points']).toEqual(10 + 10 * BONUS_MULTIPLIER);
            expect(player.lastQuestionResult).toEqual(10 + 10 * BONUS_MULTIPLIER);
            expect(player.lastQuestionIsBonus).toEqual(true);
            expect(player['bonusTimes']).toEqual(1);
        });
    });

    describe('updateScoreForBonus', () => {
        it('should update player score with bonus points', () => {
            player['bonusTimes'] = 0;
            player['points'] = 0;
            player.lastQuestionResult = 0;
            player.updateScoreForBonus(10);

            expect(player['bonusTimes']).toEqual(1);
            expect(player['points']).toEqual(10 * BONUS_MULTIPLIER);
            expect(player.lastQuestionResult).toEqual(10 * BONUS_MULTIPLIER);
            expect(player.lastQuestionIsBonus).toEqual(true);
        });
    });

    describe('updateLongAnswer', () => {
        let isEditingUpdateCallback;
        let mockStartTimer;
        let mockResetTimer;

        beforeEach(() => {
            mockStartTimer = jest.fn();
            mockResetTimer = jest.fn();
            isEditingUpdateCallback = jest.fn();
            player.resetTimer = mockResetTimer;
            player['lastEditTimer'] = { start: mockStartTimer } as Timer;
            player.hasLockedAnswers = false;
        });

        it('should update long answer and handle interactions when answers are not locked', () => {
            player.updateLongAnswer('new answer', isEditingUpdateCallback);

            expect(player.longAnswer).toBe('new answer');
            expect(player.hasInteracted).toBe(true);
            expect(isEditingUpdateCallback).toHaveBeenCalled();
            expect(player.resetTimer).toHaveBeenCalled();
            expect(mockStartTimer).toHaveBeenCalledWith(EDIT_TIME_LIMIT_S, expect.any(Function), expect.any(Function));

            const onTimerEnd = mockStartTimer.mock.calls[0][1];
            onTimerEnd();

            expect(player.hasInteracted).toBe(false);
            expect(isEditingUpdateCallback).toHaveBeenCalledTimes(2);
        });

        it('should not update long answer or handle interactions when answers are locked', () => {
            player.hasLockedAnswers = true;

            player.updateLongAnswer('new answer', isEditingUpdateCallback);

            expect(player.longAnswer).not.toBe('new answer');
            expect(player.hasInteracted).toBe(false);
            expect(player.resetTimer).not.toHaveBeenCalled();
            expect(isEditingUpdateCallback).not.toHaveBeenCalled();
            expect(mockStartTimer).not.toHaveBeenCalled();
        });
    });

    describe('getIsEditingLongAnswer', () => {
        it('should return true when player is interacting', () => {
            player.hasInteracted = true;
            expect(player.getIsEditingLongAnswer()).toBe(true);
        });

        it('should return false when player is not interacting', () => {
            player.hasInteracted = false;
            expect(player.getIsEditingLongAnswer()).toBe(false);
        });
    });

    describe('resetTimer', () => {
        it('should call the reset method on the lastEditTimer', () => {
            const mockResetTimer = jest.fn();
            player['lastEditTimer'] = { reset: mockResetTimer } as unknown as Timer;

            player.resetTimer();

            expect(mockResetTimer).toHaveBeenCalled();
        });
    });
});
