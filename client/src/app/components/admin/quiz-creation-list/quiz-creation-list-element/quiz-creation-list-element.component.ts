import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-quiz-creation-list-element',
    templateUrl: './quiz-creation-list-element.component.html',
    styleUrls: ['./quiz-creation-list-element.component.scss'],
})
export class QuizCreationListElementComponent {
    @Input() title: string;
    @Input() isSelected: boolean = false;
}
