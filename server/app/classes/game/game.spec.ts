import { Player } from '@app/classes/player/player';
import { Timer } from '@app/classes/timer/timer';
import { LONG_ANSWER_DURATION, PANIC_MODE_TICK, PANIC_MODE_TIME_QCM, PANIC_MODE_TIME_QRL } from '@app/services/game/game.service.constants';
import { GameState } from '@common/enums/game-state.enum';
import { Qcm, Qrl, Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';
import { Game } from './game';

// any and magic numbers used for tests
/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  @typescript-eslint/no-magic-numbers */
/* eslint-disable  max-lines */

jest.mock('@app/classes/player/player');
jest.mock('@app/classes/timer/timer');

describe('Game', () => {
    let game: Game;
    let quiz: Quiz;
    let playerMock: Player;

    beforeEach(() => {
        quiz = {
            _id: 'quizId',
            title: 'Quiz 1',
            description: 'Description 1',
            visible: true,
            lastModification: new Date(),
            questions: [
                {
                    type: QuestionType.MULTIPLE_CHOICE,
                    text: 'Question 1',
                    choices: [
                        { text: 'A', isCorrect: true },
                        { text: 'B', isCorrect: false },
                        { text: 'C', isCorrect: false },
                        { text: 'D', isCorrect: false },
                    ],
                    points: 10,
                },
                {
                    type: QuestionType.MULTIPLE_CHOICE,
                    text: 'Question 2',
                    choices: [
                        { text: 'A', isCorrect: true },
                        { text: 'B', isCorrect: false },
                        { text: 'C', isCorrect: false },
                        { text: 'D', isCorrect: false },
                    ],
                    points: 10,
                },
                {
                    type: QuestionType.MULTIPLE_CHOICE,
                    text: 'Question 3',
                    choices: [
                        { text: 'A', isCorrect: true },
                        { text: 'B', isCorrect: false },
                        { text: 'C', isCorrect: false },
                        { text: 'D', isCorrect: false },
                    ],
                    points: 10,
                },
            ],
            duration: 60,
        } as Quiz;

        playerMock = {
            id: '1',
            selectedChoices: [],
            resetForNewQuestion: jest.fn(),
            updateScore: jest.fn(),
            updateScoreForBonus: jest.fn(),
            updateLongAnswer: jest.fn(),
            answerTime: new Date(),
        } as unknown as Player;

        game = new Game(quiz, 'organizerId', false, false);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize game state and properties correctly', () => {
            expect(game.state).toEqual(GameState.WaitingRoom);
            expect(game['currentQuestionIndex']).toEqual(0);
            expect(game['players']).toEqual([]);
            expect(game['quiz']).toEqual(quiz);
            expect(game.timer).toBeInstanceOf(Timer);
            expect(game['isTest']).toEqual(false);
            expect(game['bannedNames']).toEqual(['organisateur']);
            expect(game['totalSelectedChoicesHistory']).toEqual([]);
            expect(game['organizerId']).toEqual('organizerId');
            expect(game.isRoomLocked).toEqual(false);
        });
    });

    describe('getPlayers', () => {
        it('should return players', () => {
            const players = game.getPlayers();
            expect(players).toEqual(game['players']);
        });
    });

    describe('getPlayerNames', () => {
        it('should return the names of all players', () => {
            game['players'] = [{ name: 'John' } as Player, { name: 'Jane' } as Player];

            const playerNames = game.getPlayerNames();
            expect(playerNames).toEqual(['John', 'Jane']);
        });
    });

    describe('getQuizTitle', () => {
        it('should return the title of the quiz', () => {
            expect(game.getQuizTitle()).toEqual(quiz.title);
        });
    });

    describe('addPlayer', () => {
        it('should add a player', () => {
            game.addPlayer('1', 'John');
            expect(game['players'].length).toEqual(1);
        });
    });

    describe('orderPlayersAlphabetically', () => {
        it('should order players alphabetically', () => {
            game['players'] = [{ name: 'John' } as Player, { name: 'Jane' } as Player, { name: 'Alice' } as Player];

            game.orderPlayersAlphabetically();

            expect(game['players'][0].name).toEqual('Alice');
            expect(game['players'][1].name).toEqual('Jane');
            expect(game['players'][2].name).toEqual('John');
        });
    });

    describe('addTotalSelectedChoicesToHistory ', () => {
        it('should add the total selected choices to history', () => {
            game['totalSelectedChoicesHistory'] = [];
            const totalSelectedChoices = { choice0: 1, choice1: 2, choice2: 3, choice3: 4 };
            jest.spyOn(game, 'getSelectedChoicesTotal').mockReturnValue(totalSelectedChoices);

            game.addTotalSelectedChoicesToHistory();

            expect(game['totalSelectedChoicesHistory'].length).toEqual(1);
            expect(game['totalSelectedChoicesHistory'][0]).toEqual(totalSelectedChoices);
        });
    });

    describe('getEmptyTotalSelectedChoices', () => {
        it('should return a total selected choices object', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ choices: { length: 4 }, type: QuestionType.MULTIPLE_CHOICE } as Qcm);
            const totalSelectedChoices = game.getEmptyTotalSelectedChoices();
            expect(totalSelectedChoices).toEqual({ choice0: 0, choice1: 0, choice2: 0, choice3: 0 });
        });

        it('should return a object of length 2, even when choices are empty', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ choices: { length: 0 }, type: QuestionType.MULTIPLE_CHOICE } as Qcm);
            const totalSelectedChoices = game.getEmptyTotalSelectedChoices();
            expect(totalSelectedChoices).toEqual({ choice0: 0, choice1: 0 });
        });
    });

    describe('removePlayer', () => {
        it('should remove a player', () => {
            game['players'] = [{ id: '1' }, { id: '2' }] as unknown as Player[];

            game.removePlayer('1');

            expect(game.getPlayers().length).toEqual(1);
            expect(game.getPlayers()[0].id).toEqual('2');
        });

        it('should change organizerHasLeft to true if called with organizer id ', () => {
            game['organizerId'] = '1';

            game.removePlayer('1');

            expect(game['organizerHasLeft']).toEqual(true);
        });
    });

    describe('updateSelectedChoices', () => {
        it('should update selected choices for a player', () => {
            game['players'] = [{ id: '1', choices: [] }] as unknown as Player[];
            const choices: number[] = [0];

            game.updateSelectedChoices('1', choices);

            expect(game.getPlayers()[0].selectedChoiceIndexes).toEqual(choices);
        });
    });

    describe('getSelectedChoicesTotal', () => {
        it('should return the total selected choices', () => {
            game['players'] = [
                { selectedChoiceIndexes: [0] } as Player,
                { selectedChoiceIndexes: [1] } as Player,
                { selectedChoiceIndexes: [2] } as Player,
                { selectedChoiceIndexes: [0] } as Player,
            ];

            const total = game.getSelectedChoicesTotal();

            expect(total).toEqual({ choice0: 2, choice1: 1, choice2: 1, choice3: 0 });
        });

        it('should return a total with all grades set to 0 if current question is not a long answer type', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({
                type: QuestionType.LONG_ANSWER,
                choices: { choice0: 0, choice1: 1 },
            } as unknown as Question);
            expect(game.getSelectedChoicesTotal()).toEqual({ choice0: 0, choice1: 0 });
        });
    });

    describe('isLastQuestion', () => {
        it('should return true if it is the last question', () => {
            game['currentQuestionIndex'] = quiz.questions.length - 1;
            expect(game.isLastQuestion()).toBe(true);
        });

        it('should return false if it is not the last question', () => {
            game['currentQuestionIndex'] = quiz.questions.length - 2;
            expect(game.isLastQuestion()).toBe(false);
        });
    });

    describe('lockChoices', () => {
        it('should lock choices for the specified player', () => {
            const playerId = '1';
            game['players'] = [{ id: playerId, lockAnswers: jest.fn() }] as unknown as Player[];

            game.lockAnswers(playerId);

            expect(game['players'][0].lockAnswers).toHaveBeenCalled();
        });
    });

    describe('lockAllRemainingPlayersChoices', () => {
        it('should lock choices for all remaining players who have not locked choices yet', () => {
            game['players'] = [
                { id: '1', hasLockedAnswers: true, lockAnswers: jest.fn() },
                { id: '2', hasLockedAnswers: false, lockAnswers: jest.fn() },
                { id: '3', hasLockedAnswers: false, lockAnswers: jest.fn() },
            ] as unknown as Player[];

            game.lockAllRemainingPlayersAnswers();

            expect(game['players'][0].lockAnswers).not.toHaveBeenCalled();
            expect(game['players'][1].lockAnswers).toHaveBeenCalled();
            expect(game['players'][2].lockAnswers).toHaveBeenCalled();
        });
    });

    describe('banName', () => {
        it('should add a name to the banned names list in lower case', () => {
            const bannedName = 'bannedName';
            game.banName(bannedName);

            expect(game['bannedNames']).toContain(bannedName);
        });
    });

    describe('isNameBanned', () => {
        it('should return true if the name is banned', () => {
            game['bannedNames'] = ['bannedName'];

            expect(game.isNameBanned('bannedName')).toBe(true);
        });

        it('should return true if the name is banned in a different case', () => {
            game['bannedNames'] = ['bannedName'];

            expect(game.isNameBanned('BannedName')).toBe(true);
        });

        it('should return false if the name is not banned', () => {
            game['bannedNames'] = ['bannedName'];

            expect(game.isNameBanned('notBannedName')).toBe(false);
        });
    });

    describe('isNameAlreadyTaken', () => {
        it('should return true if the name is already taken', () => {
            game['players'] = [{ name: 'John' } as Player, { name: 'Jane' } as Player];

            expect(game.isNameAlreadyTaken('John')).toBe(true);
        });

        it('should return false if the name is not already taken', () => {
            game['players'] = [{ name: 'John' } as Player, { name: 'Jane' } as Player];

            expect(game.isNameAlreadyTaken('Alice')).toBe(false);
        });
    });

    describe('getIsTest', () => {
        it('should return the value of isTest property', () => {
            game['isTest'] = true;
            expect(game.getIsTest()).toBe(true);
        });
    });

    describe('getDuration', () => {
        it('should return the duration of the quiz', () => {
            jest.spyOn(game, 'isQcm').mockReturnValue(true);
            expect(game.getDuration()).toEqual(quiz.duration);
        });

        it('should return LONG_ANSWER_DURATION if not a QCM', () => {
            jest.spyOn(game, 'isQcm').mockReturnValue(false);
            expect(game.getDuration()).toEqual(LONG_ANSWER_DURATION);
        });
    });

    describe('getOrganizerId', () => {
        it('should return the organizer ID', () => {
            const organizerId = 'organizerId';
            game['organizerId'] = organizerId;

            expect(game.getOrganizerId()).toEqual(organizerId);
        });
    });

    describe('getOrganizerHasLeft', () => {
        it('should return true if organizer has left', () => {
            game['organizerHasLeft'] = true;
            expect(game.getOrganizerHasLeft()).toBe(true);
        });

        it('should return false if organizer has not left', () => {
            game['organizerHasLeft'] = false;
            expect(game.getOrganizerHasLeft()).toBe(false);
        });
    });

    describe('getQuiz', () => {
        it('should return the quiz', () => {
            expect(game.getQuiz()).toEqual(quiz);
        });
    });

    describe('getCurrentQuestion', () => {
        it('should return the current question', () => {
            game['currentQuestionIndex'] = 1;

            const currentQuestion = game.getCurrentQuestion();
            expect(currentQuestion).toEqual(quiz.questions[1]);
        });
    });

    describe('getPlayersScores', () => {
        it('should return the scores of all players', () => {
            game['players'] = [{ name: 'John', getPoints: () => 10 } as Player, { name: 'Jane', getPoints: () => 20 } as Player];

            const playersScores = game.getPlayersScores();
            expect(playersScores).toEqual([
                { name: 'John', score: 10 },
                { name: 'Jane', score: 20 },
            ]);
        });
    });

    describe('getPlayerBonusTimes', () => {
        it('should return the bonus times of all players', () => {
            game['players'] = [{ name: 'John', getBonusTimes: () => 10 } as Player, { name: 'Jane', getBonusTimes: () => 20 } as Player];

            const playerBonusTimes = game.getPlayerBonusTimes();
            expect(playerBonusTimes).toEqual([
                { name: 'John', bonusTimes: 10 },
                { name: 'Jane', bonusTimes: 20 },
            ]);
        });
    });

    describe('getCurrentQuestionWithoutAnswers', () => {
        it('should return the question if it is not multiple choice', () => {
            const question = { type: QuestionType.LONG_ANSWER } as Qrl;
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue(question);
            const currentQuestion = game.getCurrentQuestionWithoutAnswers();
            expect(currentQuestion).toEqual(question);
        });

        it('should return the current question without answers', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue(quiz.questions[0]);

            const currentQuestion = game.getCurrentQuestionWithoutAnswers();
            expect(currentQuestion).toEqual({
                ...quiz.questions[0],
                choices: [
                    { text: 'A', isCorrect: false },
                    { text: 'B', isCorrect: false },
                    { text: 'C', isCorrect: false },
                    { text: 'D', isCorrect: false },
                ],
            });
        });
    });

    describe('getTotalSelectedChoicesHistory', () => {
        it('should return the total selected choices history', () => {
            game['totalSelectedChoicesHistory'] = 'value' as any;
            expect(game.getTotalResultHistory()).toEqual('value');
        });
    });

    describe('nextQuestion', () => {
        it('should move to the next question', () => {
            game['currentQuestionIndex'] = 0;
            jest.spyOn(game as any, 'resetAllPlayersForNewQuestion');

            game.nextQuestion();

            expect(game['totalSelectedChoicesHistory'].length).toBe(1);
            expect(game['resetAllPlayersForNewQuestion']).toHaveBeenCalled();
            expect(game['currentQuestionIndex']).toEqual(1);
        });

        it('should not move to the next question if it is the last question', () => {
            game['currentQuestionIndex'] = quiz.questions.length - 1;

            game.nextQuestion();
            expect(game['currentQuestionIndex']).toEqual(quiz.questions.length - 1);
        });

        it('should add long answer question to history', () => {
            jest.spyOn(game, 'isQcm').mockReturnValue(false);
            jest.spyOn(game, 'addTotalLongAnswersToHistory');

            game.nextQuestion();
            expect(game.addTotalLongAnswersToHistory).toHaveBeenCalled();
        });
        it('should add Qcm answer to history', () => {
            jest.spyOn(game, 'isQcm').mockReturnValue(true);
            jest.spyOn(game, 'addTotalSelectedChoicesToHistory');

            game.nextQuestion();
            expect(game.addTotalSelectedChoicesToHistory).toHaveBeenCalled();
        });
    });

    describe('getAnswers', () => {
        it('should return index of correct answers for a multiple choice question', () => {
            game['currentQuestionIndex'] = 0;
            expect(game.getAnswers()).toEqual([0]);
        });

        it('should return an empty array if the current question is not multiple choice', () => {
            const longAnswerQuestion: any = {
                text: " Who's the GOAT, THE GOAT !",
                type: QuestionType.LONG_ANSWER,
                choices: [{ text: 'Messi', isCorrect: true }],
            };
            game['currentQuestionIndex'] = 3;

            quiz.questions.push(longAnswerQuestion as Question);
            expect(game.getAnswers()).toEqual([]);
        });
    });

    describe('updatePlayersScore', () => {
        it('should call updateScoreForPlayersWithValidAnswers and updateScoreForFirstPlayer methods', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({
                type: QuestionType.MULTIPLE_CHOICE,
            } as unknown as Qcm);

            const updateScoreForPlayersWithValidAnswersSpy = jest.spyOn(game as any, 'updateScoreForPlayersWithValidAnswersQcm');
            const updateScoreForFirstPlayerSpy = jest.spyOn(game as any, 'updateScoreForFirstPlayerQcm');

            game.updatePlayersScore();

            expect(updateScoreForPlayersWithValidAnswersSpy).toHaveBeenCalled();
            expect(updateScoreForFirstPlayerSpy).toHaveBeenCalled();
        });

        it('should not call update score methods if the question is not multiple choice', () => {
            const getCurrentQuestionSpy = jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({
                type: QuestionType.LONG_ANSWER,
            } as unknown as Qrl);

            const updateScoreForPlayersWithValidAnswersSpy = jest.spyOn(game as any, 'updateScoreForPlayersWithValidAnswersQcm');
            const updateScoreForFirstPlayerSpy = jest.spyOn(game as any, 'updateScoreForFirstPlayerQcm');

            game.updatePlayersScore();

            expect(getCurrentQuestionSpy).toHaveBeenCalled();

            expect(updateScoreForPlayersWithValidAnswersSpy).not.toHaveBeenCalled();
            expect(updateScoreForFirstPlayerSpy).not.toHaveBeenCalled();
        });

        it('should set grades to [1] if the question is LONG_ANSWER and isTest is true', () => {
            const getCurrentQuestionSpy = jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({
                type: QuestionType.LONG_ANSWER,
            } as unknown as Qrl);
            game['isTest'] = true;

            game.updatePlayersScore();

            expect(getCurrentQuestionSpy).toHaveBeenCalled();
            expect(game['grades']).toEqual([1]);
        });
    });

    describe('orderPlayersByScore', () => {
        it('should order players by score', () => {
            jest.spyOn(game, 'getPlayersOrderedAlphabetically');
            game['players'] = [
                { name: '', getPoints: () => 10 } as Player,
                { name: '', getPoints: () => 20 } as Player,
                { name: '', getPoints: () => 30 } as Player,
            ];

            const players = game.getPlayersOrderedByScore();

            expect(game.getPlayersOrderedAlphabetically).toHaveBeenCalled();
            expect(players[0].getPoints()).toEqual(30);
            expect(players[1].getPoints()).toEqual(20);
            expect(players[2].getPoints()).toEqual(10);
        });

        it('should order players by score and alphabetically if they have the same score', () => {
            game['players'] = [
                { name: 'John', getPoints: () => 10 } as Player,
                { name: 'Jane', getPoints: () => 20 } as Player,
                { name: 'Alice', getPoints: () => 20 } as Player,
            ];

            const players = game.getPlayersOrderedByScore();

            expect(players[0].name).toEqual('Alice');
            expect(players[1].name).toEqual('Jane');
            expect(players[2].name).toEqual('John');
        });

        it('should order limit scores', () => {
            jest.spyOn(game, 'getPlayersOrderedAlphabetically');
            game['players'] = [
                { name: '', getPoints: () => 1 } as Player,
                { name: '', getPoints: () => 32 } as Player,
                { name: '', getPoints: () => 5 } as Player,
            ];

            const players = game.getPlayersOrderedByScore();

            expect(game.getPlayersOrderedAlphabetically).toHaveBeenCalled();
            expect(players[0].getPoints()).toEqual(32);
            expect(players[1].getPoints()).toEqual(5);
            expect(players[2].getPoints()).toEqual(1);
        });
    });

    describe('getPlayersOrderedAlphabetically', () => {
        it('should order players alphabetically', () => {
            game['players'] = [{ name: 'John' } as Player, { name: 'Jane' } as Player, { name: 'Alice' } as Player];

            const players = game['getPlayersOrderedAlphabetically']();

            expect(players[0].name).toEqual('Alice');
            expect(players[1].name).toEqual('Jane');
            expect(players[2].name).toEqual('John');
        });
    });

    describe('isAllChoicesLocked', () => {
        it('should return true if all players have locked choices', () => {
            game['players'] = [{ hasLockedAnswers: true } as Player, { hasLockedAnswers: true } as Player];
            expect(game.isAllChoicesLocked()).toBe(true);
        });

        it('should return false if not all players have locked choices', () => {
            game['players'] = [{ hasLockedAnswers: true } as Player, { hasLockedAnswers: false } as Player];
            expect(game.isAllChoicesLocked()).toBe(false);
        });
    });

    describe('removeOrganizer', () => {
        it('should remove the organizer', () => {
            game['organizerId'] = 'organizerId';
            game.removeOrganizer();
            expect(game['organizerId']).toEqual('');
        });
    });

    describe('updateScoreForFirstPlayerQcm', () => {
        it('should call updateScoreForBonus for the first player with valid answer', () => {
            const findFirstPlayerWithValidAnswerSpy = jest.spyOn(game as any, 'findFirstPlayerWithValidAnswer').mockReturnValue(playerMock);
            game['players']['length'] = 2;
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ points: 10 } as any);

            game['updateScoreForFirstPlayerQcm']();

            expect(findFirstPlayerWithValidAnswerSpy).toHaveBeenCalled();
            expect(playerMock.updateScoreForBonus).toHaveBeenCalledWith(10);
        });

        it('should not call updateScoreForBonus if there is only one player', () => {
            game['players']['length'] = 1;
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ points: 10 } as any);

            game['updateScoreForFirstPlayerQcm']();

            expect(playerMock.updateScoreForBonus).not.toHaveBeenCalled();
        });

        it('should not call updateScoreForBonus if no player has valid answer', () => {
            const findFirstPlayerWithValidAnswerSpy = jest.spyOn(game as any, 'findFirstPlayerWithValidAnswer').mockReturnValue(null);
            game['players']['length'] = 2;

            game['updateScoreForFirstPlayerQcm']();

            expect(findFirstPlayerWithValidAnswerSpy).toHaveBeenCalled();
            expect(playerMock.updateScoreForBonus).not.toHaveBeenCalled();
        });
    });

    describe('updateScoreForPlayersWithValidAnswersQcm', () => {
        it('should call updateScore for each player with valid answer', () => {
            const findPlayersWithValidAnswersSpy = jest.spyOn(game as any, 'findPlayersWithValidAnswers').mockReturnValue([playerMock]);
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ points: 10 } as any);

            game['updateScoreForPlayersWithValidAnswersQcm']();

            expect(findPlayersWithValidAnswersSpy).toHaveBeenCalled();
            expect(playerMock.updateScore).toHaveBeenCalledWith(10);
        });

        it('should not call updateScore if no player has valid answer', () => {
            const findPlayersWithValidAnswersSpy = jest.spyOn(game as any, 'findPlayersWithValidAnswers').mockReturnValue([]);

            game['updateScoreForPlayersWithValidAnswersQcm']();

            expect(findPlayersWithValidAnswersSpy).toHaveBeenCalled();
            expect(playerMock.updateScore).not.toHaveBeenCalled();
        });
    });

    describe('resetAllPlayersForNewQuestion', () => {
        it('should call resetForNewQuestion for each player', () => {
            game['players'] = [playerMock, playerMock];
            game['resetAllPlayersForNewQuestion']();

            expect(playerMock.resetForNewQuestion).toHaveBeenCalledTimes(2);
        });
    });

    describe('findPlayersWithValidAnswers', () => {
        it('should return an empty array if the question type is not multiple choice', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({
                type: QuestionType.LONG_ANSWER,
            } as any);

            const result = game['findPlayersWithValidAnswers']();

            expect(result).toEqual([]);
        });

        it('should return players with valid answers', () => {
            game['players'] = [
                { selectedChoiceIndexes: [0] } as Player,
                { selectedChoiceIndexes: [1] } as Player,
                { selectedChoiceIndexes: [2] } as Player,
                { selectedChoiceIndexes: [0] } as Player,
            ];
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({
                type: QuestionType.MULTIPLE_CHOICE,
                choices: [
                    { text: 'A', isCorrect: true },
                    { text: 'B', isCorrect: false },
                    { text: 'C', isCorrect: false },
                ],
            } as any);

            const result = game['findPlayersWithValidAnswers']();

            expect(result.length).toEqual(2);
        });
    });

    describe('findFirstPlayerWithValidAnswer', () => {
        it('should return null if no players have valid answers', () => {
            jest.spyOn(game as any, 'findPlayersWithValidAnswers').mockReturnValue([]);

            const result = game['findFirstPlayerWithValidAnswer']();

            expect(result).toBeNull();
        });

        it('should return the first player with the earliest answer time among players with valid answers', () => {
            game['players'] = [
                { selectedChoiceIndexes: [0], answerTime: new Date('2024-03-05T12:00:00') } as Player,
                { selectedChoiceIndexes: [1], answerTime: new Date('2024-03-05T12:01:00') } as Player,
                { selectedChoiceIndexes: [2], answerTime: new Date('2024-03-05T12:02:00') } as Player,
            ];

            jest.spyOn(game as any, 'findPlayersWithValidAnswers').mockReturnValue(game['players']);

            const result = game['findFirstPlayerWithValidAnswer']();

            expect(result).toEqual(game['players'][0]);
        });

        it('should return null if there are multiple first players', () => {
            game['players'] = [
                { selectedChoiceIndexes: [0], answerTime: new Date('2024-03-05T12:01:00') } as Player,
                { selectedChoiceIndexes: [1], answerTime: new Date('2024-03-05T12:01:00') } as Player,
                { selectedChoiceIndexes: [2], answerTime: new Date('2024-03-05T12:02:00') } as Player,
            ];

            jest.spyOn(game as any, 'findPlayersWithValidAnswers').mockReturnValue(game['players']);

            const result = game['findFirstPlayerWithValidAnswer']();

            expect(result).toEqual(null);
        });
    });

    describe('addTotalLongAnswersToHistory', () => {
        it('should add the result of getLongAnswerTotal to totalSelectedChoicesHistory', () => {
            jest.spyOn(game as any, 'getLongAnswerTotal').mockReturnValue(10);
            game['totalSelectedChoicesHistory'] = [];

            game.addTotalLongAnswersToHistory();

            expect(game['totalSelectedChoicesHistory']).toContain(10);
            expect(game.getLongAnswerTotal).toHaveBeenCalled();
        });
    });

    describe('getLongAnswerTotal', () => {
        it('should return a total with all grades set to 0 if current question is not a long answer type', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ type: QuestionType.MULTIPLE_CHOICE } as Question);
            expect(game.getLongAnswerTotal()).toEqual({ grade0: 0, grade50: 0, grade100: 0 });
        });

        it('should correctly count each grade type from grades array', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ type: QuestionType.LONG_ANSWER } as Question);

            game['grades'] = [0, 0.5, 1, 0];

            const result = game.getLongAnswerTotal();

            expect(result.grade0).toEqual(2);
            expect(result.grade50).toEqual(1);
            expect(result.grade100).toEqual(1);
        });
    });

    describe('getEmptyTotalLongAnswers', () => {
        it('should return an object with all grades initialized to 0', () => {
            expect(game.getEmptyTotalLongAnswers()).toEqual({ grade0: 0, grade50: 0, grade100: 0 });
        });
    });

    describe('getEmptyTotalEditingLongAnswer', () => {
        it('should return an object with editing states initialized to 0', () => {
            expect(game.getEmptyTotalEditingLongAnswer()).toEqual({ isEditing: 0, isNotEditing: 0 });
        });
    });

    describe('updateLongAnswer', () => {
        it('should call updateLongAnswer on the targeted player with the correct parameters', () => {
            game['players'] = [playerMock];
            const isEditingUpdateCallback = jest.fn();
            game.updateLongAnswer(playerMock.id, 'reponse longue', isEditingUpdateCallback);

            expect(playerMock.updateLongAnswer).toHaveBeenCalledWith('reponse longue', isEditingUpdateCallback);
        });
    });

    describe('getHistoryInfo', () => {
        it('should return correct history info', () => {
            game['quiz'] = { title: 'joe > Ronaldo' } as Quiz;
            game.startDateTime = new Date('2045-11-14');
            game.nStartPlayers = 5;

            jest.spyOn(game, 'getPlayersOrderedByScore').mockReturnValue([
                { getPoints: () => 100, name: 'joe' },
                { getPoints: () => 50, name: 'Ronaldo' },
            ] as any[]);
            const expectedHistoryInfo = {
                title: 'joe > Ronaldo',
                startDateTime: new Date('2045-11-14'),
                highScore: 100,
                winner: 'joe',
                nPlayersStart: 5,
            };

            expect(game.getHistoryInfo()).toEqual(expectedHistoryInfo);
        });
    });

    describe('getEditingLongAnswerTotal', () => {
        it('should correctly count players who are editing and who are not', () => {
            game['players'] = [
                { getIsEditingLongAnswer: jest.fn().mockReturnValue(true) },
                { getIsEditingLongAnswer: jest.fn().mockReturnValue(false) },
                { getIsEditingLongAnswer: jest.fn().mockReturnValue(true) },
            ] as any[];

            jest.spyOn(game, 'getEmptyTotalEditingLongAnswer');
            const expectedTotal = {
                isEditing: 2,
                isNotEditing: 1,
            };

            const total = game.getEditingLongAnswerTotal();

            expect(total).toEqual(expectedTotal);
            expect(game.getEmptyTotalEditingLongAnswer).toHaveBeenCalled();
        });
    });

    describe('pauseGame', () => {
        it('should not pause or resume if game state is not Answering', () => {
            game.state = GameState.QuestionResults;

            game.pauseGame();

            expect(game.timer.pause).not.toHaveBeenCalled();
            expect(game.timer.resume).not.toHaveBeenCalled();
        });

        it('should pause the game if state is Answering and isGamePaused is true', () => {
            game.state = GameState.Answering;
            game.isGamePaused = true;

            game.pauseGame();

            expect(game.timer.pause).toHaveBeenCalled();
            expect(game.timer.resume).not.toHaveBeenCalled();
        });

        it('should resume the game if state is Answering and isGamePaused is false', () => {
            game.state = GameState.Answering;
            game.isGamePaused = false;

            game.pauseGame();

            expect(game.timer.pause).not.toHaveBeenCalled();
            expect(game.timer.resume).toHaveBeenCalled();
        });
    });

    describe('canStartPanicMode', () => {
        it('should return true for LONG_ANSWER type questions when time is greater than PANIC_MODE_TIME_QRL', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ type: QuestionType.LONG_ANSWER } as Question);
            const result = game.canStartPanicMode(PANIC_MODE_TIME_QRL + 1);
            expect(result).toBe(true);
        });

        it('should return false for LONG_ANSWER type questions when time is less than or equal to PANIC_MODE_TIME_QRL', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ type: QuestionType.LONG_ANSWER } as Question);
            const result = game.canStartPanicMode(PANIC_MODE_TIME_QRL);
            expect(result).toBe(false);
        });

        it('should return true for MULTIPLE_CHOICE type questions when time is greater than PANIC_MODE_TIME_QCM', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ type: QuestionType.MULTIPLE_CHOICE } as Question);
            const result = game.canStartPanicMode(PANIC_MODE_TIME_QCM + 1);
            expect(result).toBe(true);
        });

        it('should return false for MULTIPLE_CHOICE type questions when time is less than or equal to PANIC_MODE_TIME_QCM', () => {
            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ type: QuestionType.MULTIPLE_CHOICE } as Question);
            const result = game.canStartPanicMode(PANIC_MODE_TIME_QCM);
            expect(result).toBe(false);
        });
    });

    describe('startPanicMode', () => {
        it('should not do anything if isPanicOn is already true', () => {
            game.isPanicOn = true;

            game.startPanicMode();

            expect(game.timer.pause).not.toHaveBeenCalled();
            expect(game.timer.setTick).not.toHaveBeenCalledWith(PANIC_MODE_TICK);
            expect(game.timer.resume).not.toHaveBeenCalled();
        });

        it('should start panic mode if isPanicOn is false', () => {
            game.startPanicMode();

            expect(game.isPanicOn).toBe(true);
            expect(game.timer.pause).toHaveBeenCalled();
            expect(game.timer.setTick).toHaveBeenCalledWith(PANIC_MODE_TICK);
        });

        it('should resume the timer if isGamePaused is false', () => {
            game.isGamePaused = false;
            game.startPanicMode();
            expect(game.timer.resume).toHaveBeenCalled();
        });

        it('should not resume the timer if isGamePaused is true', () => {
            game.isGamePaused = true;
            game.startPanicMode();
            expect(game.timer.resume).not.toHaveBeenCalled();
        });
    });

    describe('getIsRandom', () => {
        it('should return true when isRandom is true', () => {
            game['isRandom'] = true;
            expect(game.getIsRandom()).toBe(true);
        });

        it('should return false when isRandom is false', () => {
            game['isRandom'] = false;
            expect(game.getIsRandom()).toBe(false);
        });
    });

    describe('getIsGamePaused', () => {
        it('should return true when the game is paused', () => {
            game.isGamePaused = true;
            expect(game.getIsGamePaused()).toBe(true);
        });

        it('should return false when the game is not paused', () => {
            game.isGamePaused = false;
            expect(game.getIsGamePaused()).toBe(false);
        });
    });

    describe('areGradingsFinished', () => {
        it('should return true when all players have been graded', () => {
            game['grades'] = [1, 0];
            game['players'] = [{}, {}] as Player[];

            expect(game.areGradingsFinished()).toBe(true);
        });

        it('should return false when not all players have been graded', () => {
            game['grades'] = [1];
            game['players'] = [{}, {}, {}] as Player[];

            expect(game.areGradingsFinished()).toBe(false);
        });
    });

    describe('addGrade', () => {
        it('should add a grade to the grades array', () => {
            game['grades'] = [];

            game.addGrade(1);

            expect(game['grades']).toContain(1);
        });
    });

    describe('getNextPlayerToGrade', () => {
        it('should return the next player to be graded', () => {
            const player1 = { name: 'joe' };
            const player2 = { name: 'Mbappe' };
            game['players'] = [player1, player2] as Player[];
            game['grades'] = [1];

            expect(game.getNextPlayerToGrade()).toEqual(player2);
        });
    });

    describe('getGradeIndex', () => {
        it('should return the correct index for the next grade', () => {
            game['grades'] = [1, 0];

            expect(game.getGradeIndex()).toBe(3);
        });
    });

    describe('endAllPlayersTimers', () => {
        it('should call resetTimer on all players', () => {
            const mockPlayer1 = { resetTimer: jest.fn() };
            const mockPlayer2 = { resetTimer: jest.fn() };
            game['players'] = [mockPlayer1, mockPlayer2] as any[];

            game.endAllPlayersTimers();

            expect(mockPlayer1.resetTimer).toHaveBeenCalled();
            expect(mockPlayer2.resetTimer).toHaveBeenCalled();
        });
    });

    describe('updateScoreForPlayerQrl', () => {
        it('should update player score based on question points and multiplier', () => {
            const multiplier = 2;

            jest.spyOn(game, 'getCurrentQuestion').mockReturnValue({ points: 10 } as Question);

            game['updateScoreForPlayerQrl'](playerMock, multiplier);

            expect(playerMock.updateScore).toHaveBeenCalledWith(10 * multiplier);
        });
    });

    describe('updateScoreForPlayersQrl', () => {
        it('should call updateScoreForPlayerQrl for each player with correct multiplier', () => {
            const mockPlayers = [{ updateScore: jest.fn() }, { updateScore: jest.fn() }] as any[];
            game['players'] = mockPlayers;
            game['grades'] = [1, 0.5];

            const updateScoreSpy = jest.spyOn(game as any, 'updateScoreForPlayerQrl');

            game['updateScoreForPlayersQrl']();

            expect(updateScoreSpy).toHaveBeenCalledTimes(mockPlayers.length);
            expect(updateScoreSpy).toHaveBeenCalledWith(mockPlayers[0], 1);
            expect(updateScoreSpy).toHaveBeenCalledWith(mockPlayers[1], 0.5);
        });
    });
});
