// Game class handles a lot of logic that can't be separated to ensure clarity and maintainability
/* eslint-disable max-lines */

import { Player } from '@app/classes/player/player';
import { Timer } from '@app/classes/timer/timer';
import { LONG_ANSWER_DURATION, PANIC_MODE_TICK, PANIC_MODE_TIME_QCM, PANIC_MODE_TIME_QRL } from '@app/services/game/game.service.constants';
import { ValidationService } from '@app/services/validation/validation.service';
import { GameState } from '@common/enums/game-state.enum';
import { HistoryInfo } from '@common/http/historyInfo.dto';
import { Qcm, Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { BonusTimesInfo } from '@common/websockets/bonus-times.dto';
import { PlayerScore } from '@common/websockets/player-score.dto';
import { TotalGrades, TotalIsEditing, TotalResult, TotalSelectedChoices } from '@common/websockets/total-result.dto';
import { MEDIUM_GRADE, PERFECT_GRADE, WORST_GRADE } from './grade.const';

export class Game {
    timer: Timer;
    state: GameState;
    isRoomLocked: boolean;
    nStartPlayers: number;
    startDateTime: Date;
    isGamePaused: boolean;
    isPanicOn: boolean;
    private quiz: Quiz;
    private currentQuestionIndex: number;
    private players: Player[];
    private bannedNames: string[];
    private isTest: boolean;
    private isRandom: boolean;
    private totalSelectedChoicesHistory: TotalResult[];
    private organizerId: string;
    private organizerHasLeft: boolean;
    private grades: number[];

    // To accommodate the specific requirements of this class we disable the eslint rule that enforces a maximum number of parameters
    // eslint-disable-next-line max-params
    constructor(quiz: Quiz, organizerId: string, isTest: boolean, isRandom: boolean) {
        this.state = GameState.WaitingRoom;
        this.currentQuestionIndex = 0;
        this.players = [];
        this.quiz = quiz;
        this.timer = new Timer();
        this.isTest = isTest;
        this.isRandom = isRandom;
        this.bannedNames = ['organisateur'];
        this.totalSelectedChoicesHistory = [];
        this.organizerId = organizerId;
        this.isRoomLocked = false;
        this.organizerHasLeft = false;
        this.grades = [];
        this.isGamePaused = false;
        this.isPanicOn = false;
    }

    getHistoryInfo(): HistoryInfo {
        const winner = this.getPlayersOrderedByScore()[0];
        return {
            title: this.quiz.title,
            startDateTime: this.startDateTime,
            highScore: winner.getPoints(),
            winner: winner.name,
            nPlayersStart: this.nStartPlayers,
        };
    }

    getPlayers() {
        return this.players;
    }

    getPlayerNames() {
        return this.players.map((player) => player.name);
    }

    getQuizTitle() {
        return this.quiz.title;
    }

    addPlayer(id: string, name: string) {
        const player = new Player(id, name);
        this.players.push(player);
    }

    orderPlayersAlphabetically() {
        this.players.sort((a, b) => a.name.localeCompare(b.name, 'fr-CA', { sensitivity: 'base' }));
    }

    removePlayer(id: string): Player[] {
        if (this.organizerId === id) {
            this.organizerHasLeft = true;
        }
        this.players = this.players.filter((player) => player.id !== id);
        return this.players;
    }

    updateSelectedChoices(playerId: string, selectedChoiceIndexes: number[]): number[] {
        const playerTargeted = this.players.find((player) => player.id === playerId);
        playerTargeted.selectedChoiceIndexes = selectedChoiceIndexes;
        return playerTargeted.selectedChoiceIndexes;
    }

    updateLongAnswer(playerId: string, longAnswer: string, isEditingUpdateCallback: () => void) {
        const playerTargeted = this.players.find((player) => player.id === playerId);
        playerTargeted.updateLongAnswer(longAnswer, isEditingUpdateCallback);
    }

    getSelectedChoicesTotal(): TotalSelectedChoices {
        const total: TotalSelectedChoices = this.getEmptyTotalSelectedChoices();
        if (this.getCurrentQuestion().type !== QuestionType.MULTIPLE_CHOICE) {
            return total;
        }

        this.players.forEach((player) => {
            player.selectedChoiceIndexes.forEach((index) => {
                total[`choice${index}`]++;
            });
        });
        return total;
    }

    getLongAnswerTotal() {
        const total: TotalResult = this.getEmptyTotalLongAnswers();
        if (this.getCurrentQuestion().type !== QuestionType.LONG_ANSWER) {
            return total;
        }

        this.grades.forEach((grade) => {
            switch (grade) {
                case WORST_GRADE:
                    total.grade0++;
                    break;
                case MEDIUM_GRADE:
                    total.grade50++;
                    break;
                case PERFECT_GRADE:
                    total.grade100++;
                    break;
            }
        });
        return total;
    }

    getEditingLongAnswerTotal() {
        const total = this.getEmptyTotalEditingLongAnswer();

        this.players.forEach((player) => {
            if (player.getIsEditingLongAnswer()) {
                total.isEditing++;
            } else {
                total.isNotEditing++;
            }
        });

        return total;
    }

    addTotalSelectedChoicesToHistory() {
        this.totalSelectedChoicesHistory.push(this.getSelectedChoicesTotal());
    }

    addTotalLongAnswersToHistory() {
        this.totalSelectedChoicesHistory.push(this.getLongAnswerTotal());
    }

    getEmptyTotalSelectedChoices(): TotalSelectedChoices {
        const total: TotalSelectedChoices = { choice0: 0, choice1: 0 };
        const length = (this.getCurrentQuestion() as Qcm).choices.length;
        for (let i = 2; i < length; i++) {
            total[`choice${i}`] = 0;
        }
        return total;
    }

    getEmptyTotalLongAnswers(): TotalGrades {
        return { grade0: 0, grade50: 0, grade100: 0 };
    }

    getEmptyTotalEditingLongAnswer(): TotalIsEditing {
        return { isEditing: 0, isNotEditing: 0 };
    }

    isLastQuestion(): boolean {
        return this.currentQuestionIndex === this.quiz.questions.length - 1;
    }

    lockAnswers(playerId: string) {
        this.players.find((player) => player.id === playerId).lockAnswers();
    }

    lockAllRemainingPlayersAnswers() {
        this.players.forEach((player) => {
            if (!player.hasLockedAnswers) {
                player.lockAnswers();
            }
        });
    }

    banName(name: string) {
        this.bannedNames.push(name);
    }

    isNameBanned(name: string): boolean {
        return this.bannedNames.map((playerName) => playerName.toLowerCase().trim()).includes(name.toLowerCase().trim());
    }

    isNameAlreadyTaken(name: string): boolean {
        return this.getPlayerNames()
            .map((playerName) => playerName.toLowerCase().trim())
            .includes(name.toLowerCase().trim());
    }

    pauseGame() {
        if (this.state !== GameState.Answering) {
            return;
        }
        if (this.isGamePaused) {
            this.timer.pause();
        } else {
            this.timer.resume();
        }
    }

    canStartPanicMode(time: number): boolean {
        return (
            (this.getCurrentQuestion().type === QuestionType.LONG_ANSWER && time > PANIC_MODE_TIME_QRL) ||
            (this.getCurrentQuestion().type === QuestionType.MULTIPLE_CHOICE && time > PANIC_MODE_TIME_QCM)
        );
    }

    startPanicMode() {
        if (this.isPanicOn) {
            return;
        }
        this.isPanicOn = true;
        this.timer.pause();
        this.timer.setTick(PANIC_MODE_TICK);
        if (!this.isGamePaused) {
            this.timer.resume();
        }
    }

    getIsTest(): boolean {
        return this.isTest;
    }

    getIsRandom(): boolean {
        return this.isRandom;
    }

    getDuration() {
        if (this.isQcm()) {
            return this.quiz.duration;
        } else {
            return LONG_ANSWER_DURATION;
        }
    }

    getOrganizerId(): string {
        return this.organizerId;
    }

    getOrganizerHasLeft(): boolean {
        return this.organizerHasLeft;
    }

    getQuiz(): Quiz {
        return this.quiz;
    }

    getCurrentQuestion(): Question {
        return this.quiz.questions[this.currentQuestionIndex];
    }

    isQcm(): boolean {
        return this.getCurrentQuestion().type === QuestionType.MULTIPLE_CHOICE;
    }

    getPlayersScores(): PlayerScore[] {
        return this.players.map((player) => ({
            name: player.name,
            score: player.getPoints(),
        }));
    }

    getPlayerBonusTimes(): BonusTimesInfo[] {
        return this.players.map((player) => ({
            name: player.name,
            bonusTimes: player.getBonusTimes(),
        }));
    }

    getCurrentQuestionWithoutAnswers(): Question {
        const question = this.getCurrentQuestion();
        if (question.type !== QuestionType.MULTIPLE_CHOICE) {
            return question;
        }
        const choices = (question as Qcm).choices.map((choice) => {
            return { text: choice.text, isCorrect: false };
        });
        return { ...question, choices };
    }

    getTotalResultHistory(): TotalResult[] {
        return this.totalSelectedChoicesHistory;
    }

    nextQuestion() {
        this.isPanicOn = false;
        if (this.isQcm()) {
            this.addTotalSelectedChoicesToHistory();
        } else {
            this.addTotalLongAnswersToHistory();
        }
        if (this.isLastQuestion()) {
            return;
        }
        this.resetGameForNewQuestion();
        this.currentQuestionIndex++;
    }

    resetGameForNewQuestion() {
        this.resetAllPlayersForNewQuestion();
        this.grades = [];
    }

    getAnswers(): number[] {
        const answers = [];
        if (this.getCurrentQuestion().type === QuestionType.MULTIPLE_CHOICE) {
            (this.getCurrentQuestion() as Qcm).choices.forEach((choice, i) => {
                if (choice.isCorrect) answers.push(i);
            });
        }
        return answers;
    }

    getIsGamePaused(): boolean {
        return this.isGamePaused;
    }

    updatePlayersScore() {
        if (this.getCurrentQuestion().type === QuestionType.LONG_ANSWER) {
            if (this.isTest) {
                this.grades = [1];
            }
            this.updateScoreForPlayersQrl();
        } else {
            this.updateScoreForPlayersWithValidAnswersQcm();
            this.updateScoreForFirstPlayerQcm();
        }
    }

    getPlayersOrderedByScore() {
        const players = this.getPlayersOrderedAlphabetically();
        return players.concat().sort((a, b) => b.getPoints() - a.getPoints());
    }

    getPlayersOrderedAlphabetically() {
        return this.players.concat().sort((a, b) => a.name.localeCompare(b.name, 'fr-CA', { sensitivity: 'base' }));
    }

    isAllChoicesLocked(): boolean {
        return this.players.every((player) => player.hasLockedAnswers);
    }

    areGradingsFinished(): boolean {
        return this.grades.length >= this.players.length;
    }

    addGrade(grade: number) {
        this.grades.push(grade);
    }

    getNextPlayerToGrade(): Player {
        return this.players[this.grades.length];
    }

    getGradeIndex(): number {
        return this.grades.length + 1;
    }

    endAllPlayersTimers() {
        this.players.forEach((player) => player.resetTimer());
    }

    removeOrganizer() {
        this.organizerId = '';
    }

    private updateScoreForFirstPlayerQcm() {
        if (this.players.length < 2) {
            return;
        }

        const firstPlayer = this.findFirstPlayerWithValidAnswer();
        if (firstPlayer) {
            firstPlayer.updateScoreForBonus(this.getCurrentQuestion().points);
        }
    }

    private updateScoreForPlayersWithValidAnswersQcm() {
        this.findPlayersWithValidAnswers().forEach((player) => {
            player.updateScore(this.getCurrentQuestion().points);
        });
    }

    private updateScoreForPlayerQrl(player: Player, multiplier: number) {
        player.updateScore(this.getCurrentQuestion().points * multiplier);
    }

    private updateScoreForPlayersQrl() {
        this.players.forEach((player, i) => {
            this.updateScoreForPlayerQrl(player, this.grades[i]);
        });
    }

    private resetAllPlayersForNewQuestion() {
        this.players.forEach((player) => {
            player.resetForNewQuestion();
        });
    }

    private findPlayersWithValidAnswers(): Player[] {
        if (this.getCurrentQuestion().type !== QuestionType.MULTIPLE_CHOICE) {
            return [];
        }
        return this.players.filter((player) => {
            return ValidationService.validateAnswer((this.getCurrentQuestion() as Qcm).choices, player.selectedChoiceIndexes);
        });
    }

    private findFirstPlayerWithValidAnswer(): Player {
        const playersWithValidAnswers = this.findPlayersWithValidAnswers();

        const firstAnswerTime = Math.min(...playersWithValidAnswers.map((player) => player.answerTime.getTime()));
        const firstPlayers = playersWithValidAnswers.filter((player) => player.answerTime.getTime() === firstAnswerTime);

        return firstPlayers.length === 1 ? firstPlayers[0] : null;
    }
}