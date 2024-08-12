import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameService } from '@app/services/game/game.service';
import { GradeQuestionReq } from '@common/websockets/grade-question.dto';
import { GameGradeComponent } from './game-grade.component';
import { AppMaterialModule } from '@app/modules/material.module';

describe('GameGradeComponent', () => {
    let component: GameGradeComponent;
    let fixture: ComponentFixture<GameGradeComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['gradeQuestion', 'getGradeQuestionRequest']);
        gameServiceSpy.getGradeQuestionRequest.and.returnValue({ playerName: '', answer: '', gradeIndex: 0, gradeTotal: 0 });
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GameGradeComponent],
            imports: [AppMaterialModule],
            providers: [HttpClient, HttpHandler, { provide: GameService, useValue: gameServiceSpy }],
        });
        fixture = TestBed.createComponent(GameGradeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call gameService.gradeQuestion() with the provided grade', () => {
        const grade = 5;
        component.gradeAnswer(grade);
        expect(gameServiceSpy.gradeQuestion).toHaveBeenCalledWith(grade);
    });

    it('should call gameService.getGradeQuestionRequest() and return the result', () => {
        const answer = {} as unknown as GradeQuestionReq;
        gameServiceSpy.getGradeQuestionRequest.and.returnValue(answer);
        const result = component.getGradingRequest();
        expect(gameServiceSpy.getGradeQuestionRequest).toHaveBeenCalled();
        expect(result).toBe(answer);
    });
});
