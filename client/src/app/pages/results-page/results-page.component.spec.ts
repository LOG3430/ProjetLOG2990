import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HistogramMockComponent } from '@app/components/game/histogram/histogram-mock.component';
import { StatisticComponent } from '@app/components/game/statistic/statistic.component';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { QuestionType } from '@common/interfaces/question.dto';
import { ResultsPageComponent } from './results-page.component';
import SpyObj = jasmine.SpyObj;

describe('ResultsPageComponent', () => {
    let component: ResultsPageComponent;
    let fixture: ComponentFixture<ResultsPageComponent>;
    let gameServiceSpy: SpyObj<GameService>;
    let routerSpy: SpyObj<Router>;
    let histogramServiceSpy: SpyObj<HistogramService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['handleLeaveGame', 'getIsOrganizer', 'navigateExit', 'isQcm', 'getChoices', 'rank']);
        gameServiceSpy.rank = 0;
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['histogramRightAnswers']);
        histogramServiceSpy.histogramTexts = [];
        histogramServiceSpy.quizHistory = {
            totalSelectedChoicesHistory: [[0]],
            questionHistory: [''],
            histogramTextsHistory: [['']],
            rightAnswerHistory: [[0]],
        };
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ResultsPageComponent, StatisticComponent, HistogramMockComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: HistogramService, useValue: histogramServiceSpy },
            ],
        });

        fixture = TestBed.createComponent(ResultsPageComponent);
        component = fixture.componentInstance;
        gameServiceSpy.question = { text: 'question', points: 1, choices: [], type: QuestionType.MULTIPLE_CHOICE, _id: '1' };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('constructor', () => {
        it('should not go home if there is a question', () => {
            routerSpy.navigate.calls.reset();
            gameServiceSpy.question = { text: 'question', points: 1, choices: [], type: QuestionType.MULTIPLE_CHOICE, _id: '1' };
            TestBed.createComponent(ResultsPageComponent);
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('should go home if there is no question', () => {
            // disabled no-any because we want to test the behavior when the input is undefined
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            gameServiceSpy.question = undefined as any;
            TestBed.createComponent(ResultsPageComponent);
            expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.Home]);
        });
    });

    describe('constructor', () => {
        it('should not go home if there is a question', () => {
            routerSpy.navigate.calls.reset();
            gameServiceSpy.question = { text: 'question', points: 1, choices: [], type: QuestionType.MULTIPLE_CHOICE, _id: '1' };
            TestBed.createComponent(ResultsPageComponent);
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('should go home if there is no question', () => {
            // disabled no-any because we want to test the behavior when the input is undefined
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            gameServiceSpy.question = undefined as any;
            TestBed.createComponent(ResultsPageComponent);
            expect(routerSpy.navigate).toHaveBeenCalledWith([AppRoutes.Home]);
        });
    });

    describe('getScore', () => {
        it('should return player score', () => {
            // disabled no-magic-numbers because this is a test file
            /* eslint-disable  @typescript-eslint/no-magic-numbers */
            gameServiceSpy.playerScore = 5;
            expect(component.getScore()).toEqual(5);
        });
    });

    describe('getRankText', () => {
        it('should return 1er if rank is 0', () => {
            gameServiceSpy.rank = 0;
            expect(component.getRankText()).toEqual('1er');
        });

        it('should return 2ième if rank is 1', () => {
            gameServiceSpy.rank = 1;
            expect(component.getRankText()).toEqual('2ième');
        });
    });

    describe('leaveResultsPage', () => {
        it('should call handleLeaveGame and navigateExit from game service', () => {
            component.leaveResultsPage();
            expect(gameServiceSpy.handleLeaveGame).toHaveBeenCalled();
            expect(gameServiceSpy.navigateExit).toHaveBeenCalled();
        });
    });

    describe('showResults', () => {
        it('should return true if the user is not the organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(false);
            expect(component.showResults()).toBeTrue();
        });

        it('should return false if the user is the organizer', () => {
            gameServiceSpy.getIsOrganizer.and.returnValue(true);
            expect(component.showResults()).toBeFalse();
        });
    });
});
