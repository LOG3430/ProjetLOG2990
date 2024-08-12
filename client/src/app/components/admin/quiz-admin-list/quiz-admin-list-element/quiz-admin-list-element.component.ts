import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { DateService } from '@app/services/date/date.service';
import { QuizCommunicationService } from '@app/services/quiz-communication/quiz-communication.service';
import { Quiz } from '@common/interfaces/quiz.dto';
@Component({
    selector: 'app-quiz-admin-list-element',
    templateUrl: './quiz-admin-list-element.component.html',
    styleUrls: ['./quiz-admin-list-element.component.scss'],
})
export class QuizAdminListElementComponent implements OnInit {
    @Input() quiz: Quiz;
    @Output() deleteQuizSignal: EventEmitter<string> = new EventEmitter<string>();
    @Output() downloadQuizSignal: EventEmitter<void> = new EventEmitter<void>();

    componentHasLoaded = false;

    constructor(
        private dateService: DateService,
        private quizCommunicationService: QuizCommunicationService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.componentHasLoaded = true;
    }

    getTimeSinceLastModificationMessage(): string {
        if (!this.componentHasLoaded) {
            return '';
        }
        return this.dateService.getTimeSinceLastModificationMessage(this.quiz.lastModification);
    }

    getDateMessage(): string {
        return this.dateService.getDateFormatted(this.quiz.lastModification);
    }

    toggleVisibility() {
        this.quiz.visible = !this.quiz.visible;
        this.quizCommunicationService.updateVisible(this.quiz._id, this.quiz.visible).subscribe((quiz: Quiz) => {
            this.quiz = quiz;
        });
    }

    deleteQuiz() {
        this.deleteQuizSignal.emit(this.quiz._id);
    }

    exportQuiz() {
        this.downloadQuizSignal.emit();
    }

    editQuiz() {
        this.router.navigate([AppRoutes.Quiz, this.quiz._id]);
    }
}
