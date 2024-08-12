import { Component } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { GradeQuestionReq } from '@common/websockets/grade-question.dto';

@Component({
    selector: 'app-game-grade',
    templateUrl: './game-grade.component.html',
    styleUrls: ['./game-grade.component.scss'],
})
export class GameGradeComponent {
    constructor(private gameService: GameService) {}

    gradeAnswer(grade: number): void {
        this.gameService.gradeQuestion(grade);
    }

    getGradingRequest(): GradeQuestionReq {
        return this.gameService.getGradeQuestionRequest();
    }
}
