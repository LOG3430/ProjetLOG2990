import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ANSWER_MAX_LENGTH, ANSWER_MIN_LENGTH, TEXTAREA_LINES } from '@app/constants/game-qrl.component.constants';
import { GameService } from '@app/services/game/game.service';
import { GameState } from '@common/enums/game-state.enum';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-qrl',
    templateUrl: './game-qrl.component.html',
    styleUrls: ['./game-qrl.component.scss'],
})
export class GameQrlComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('input') private longAnswerInput: ElementRef<HTMLInputElement>;

    readonly answerMaxLength = ANSWER_MAX_LENGTH;
    readonly answerMinLength = ANSWER_MIN_LENGTH;
    readonly textareaLines = TEXTAREA_LINES;

    private newQuestionSubscription: Subscription;

    constructor(private gameService: GameService) {}

    ngOnInit(): void {
        this.newQuestionSubscription = this.gameService.getNewQuestionMessage().subscribe(() => {
            this.longAnswerInput.nativeElement.value = '';
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.longAnswerInput.nativeElement.focus();
        });
    }

    ngOnDestroy(): void {
        this.newQuestionSubscription.unsubscribe();
    }

    onLongAnswerChange(event: Event) {
        if (event && (event.target as HTMLInputElement)) {
            const inputValue = (event.target as HTMLInputElement).value;

            const sanitizedValue = inputValue.replace(/(\r\n|\n|\r)/gm, '');
            (event.target as HTMLInputElement).value = sanitizedValue;

            this.gameService.onLongAnswerChange(inputValue);
        }
    }

    isEditable() {
        return this.gameService.getGameState() === GameState.Answering && !this.gameService.isLocked;
    }
}
