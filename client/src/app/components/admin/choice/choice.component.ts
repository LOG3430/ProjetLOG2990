import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TEXT_NOT_NULL_OR_WHITESPACE_PATTERN } from '@app/constants/common/pattern.constants';
import { Choice } from '@common/interfaces/choice.dto';

@Component({
    selector: 'app-choice',
    templateUrl: './choice.component.html',
    styleUrls: ['./choice.component.scss'],
})
export class ChoiceComponent {
    @Input() choiceIndex: number;
    @Input() choice: Choice;
    @Input() nChoices: number;
    @Input() isEditable: boolean;
    @Output() delete = new EventEmitter<void>();
    @Output() choiceChange = new EventEmitter<Choice>();

    readonly textNotNullOrWhitespacePattern = TEXT_NOT_NULL_OR_WHITESPACE_PATTERN;

    onDelete() {
        this.delete.emit();
    }

    onChangeChoice() {
        this.choiceChange.emit(this.choice);
    }
}
