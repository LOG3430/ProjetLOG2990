import { Timer } from '@app/classes/timer/timer';
import { BONUS_MULTIPLIER, EDIT_TIME_LIMIT_S } from './player.constants';

export class Player {
    id: string;
    name: string;
    selectedChoiceIndexes: number[];
    longAnswer: string;
    hasLockedAnswers: boolean;
    hasInteracted: boolean;
    isMuted: boolean;
    answerTime: Date;
    lastQuestionResult: number;
    lastQuestionIsBonus: boolean;
    private points: number;
    private bonusTimes: number;
    private lastEditTimer: Timer;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.points = 0;
        this.bonusTimes = 0;
        this.selectedChoiceIndexes = [];
        this.longAnswer = '';
        this.hasLockedAnswers = false;
        this.lastQuestionIsBonus = false;
        this.lastQuestionResult = 0;
        this.hasInteracted = false;

        this.lastEditTimer = new Timer();
    }

    getPoints() {
        return this.points;
    }

    getBonusTimes() {
        return this.bonusTimes;
    }

    resetForNewQuestion() {
        this.selectedChoiceIndexes = [];
        this.longAnswer = '';
        this.hasLockedAnswers = false;
        this.lastQuestionResult = 0;
        this.lastQuestionIsBonus = false;
        this.hasInteracted = false;
    }

    lockAnswers() {
        if (this.hasLockedAnswers) {
            return;
        }
        this.hasLockedAnswers = true;
        this.answerTime = new Date();
    }

    updateScore(points: number) {
        this.points += points;
        this.lastQuestionResult = points;
    }

    updateScoreForBonus(points: number) {
        this.bonusTimes++;
        points *= BONUS_MULTIPLIER;

        this.points += points;
        this.lastQuestionResult += points;
        this.lastQuestionIsBonus = true;
    }

    updateLongAnswer(answer: string, isEditingUpdateCallback: () => void) {
        if (this.hasLockedAnswers) {
            return;
        }
        this.hasInteracted = true;
        isEditingUpdateCallback();

        this.longAnswer = answer;
        this.resetTimer();
        this.lastEditTimer.start(
            EDIT_TIME_LIMIT_S,
            () => {
                this.hasInteracted = false;
                isEditingUpdateCallback();
            },
            // Empty function so the timer does not notify the client every second
            /* eslint-disable-next-line  @typescript-eslint/no-empty-function */
            () => {},
        );
    }

    getIsEditingLongAnswer() {
        return this.hasInteracted;
    }

    resetTimer() {
        this.lastEditTimer.reset();
    }
}
