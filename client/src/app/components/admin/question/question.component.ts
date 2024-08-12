import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { MAXIMUM_NUMBER_CHOICES } from '@app/constants/common/choices.constants';
import { QCM_ICON, QRL_ICON } from '@app/constants/common/icons.constants';
import { TEXT_NOT_NULL_OR_WHITESPACE_PATTERN } from '@app/constants/common/pattern.constants';
import { POINTS_OPTIONS } from '@app/constants/question.component.constants';
import { DateService } from '@app/services/date/date.service';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { QuestionValidatorService } from '@app/services/question-validator/question-validator.service';
import { Choice } from '@common/interfaces/choice.dto';
import { Qcm, Question, QuestionType } from '@common/interfaces/question.dto';

@Component({
    selector: 'app-question',
    templateUrl: './question.component.html',
    styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit {
    @Input() questionIndex: number;
    @Input() question: Question;
    @Input() isEditable: boolean = true;
    @Input() isInBank: boolean = false;
    @Input() isInNewQuiz: boolean = false;
    @Output() removeQuestionSignal = new EventEmitter<number>();
    @Output() saveQuestionSignal = new EventEmitter<Question>();
    @Output() changeQuestionSignal = new EventEmitter();
    @Input() isUniqueQuestion: boolean = true;
    @ViewChild('panel') panel!: MatExpansionPanel;

    isValidQuestion = false;
    readonly pointsOptions: number[] = POINTS_OPTIONS;

    hasAppropriateNumberChoices = false;
    hasTrueAndFalseChoices = false;
    hasTooManyChoicesToAddMore = false;
    componentHasLoaded = false;
    readonly textNotNullOrWhitespacePattern = TEXT_NOT_NULL_OR_WHITESPACE_PATTERN;
    readonly qcmIcon = QCM_ICON;
    readonly qrlIcon = QRL_ICON;

    constructor(
        private questionValidator: QuestionValidatorService,
        private questionBankService: QuestionBankService,
        private dateService: DateService,
    ) {}

    ngOnInit() {
        this.checkQuestionValidity();
        this.question.hasChanged = !this.question._id ? true : false;
        this.componentHasLoaded = true;
    }

    getTimeSinceLastModificationMessage(): string {
        if (!this.componentHasLoaded) {
            return '';
        }
        if (!this.question.lastModification) {
            this.question.lastModification = new Date();
        }
        return this.dateService.getTimeSinceLastModificationMessage(this.question.lastModification);
    }

    getDateMessage(): string {
        return this.dateService.getDateFormatted(this.question.lastModification ? this.question.lastModification : new Date());
    }

    drop(event: CdkDragDrop<string[]>) {
        if (!this.isQcm()) {
            return;
        }
        this.onInputChange();
        moveItemInArray((this.question as Qcm).choices, event.previousIndex, event.currentIndex);
    }

    deleteChoice(choiceIndex: number) {
        if (!this.isQcm()) {
            return;
        }
        if (choiceIndex >= 0 && choiceIndex < (this.question as Qcm).choices.length) {
            (this.question as Qcm).choices.splice(choiceIndex, 1);
            this.checkQuestionValidity();
        }
    }

    newChoice() {
        if (!this.isQcm() || this.hasTooManyChoicesToAddMore) {
            return;
        }
        (this.question as Qcm).choices.push({ text: '', isCorrect: false });
        this.checkQuestionValidity();
    }

    choiceChange(choice: Choice, choiceIndex: number) {
        if (!this.isQcm()) {
            return;
        }
        (this.question as Qcm).choices[choiceIndex] = choice;
        this.onInputChange();
    }

    onInputChange() {
        this.checkQuestionValidity();
        this.changeQuestionSignal.emit();
        this.question.hasChanged = true;
    }

    checkQuestionValidity() {
        this.isValidQuestion = this.questionValidator.isValidQuestion(this.question);
        if (!this.isQcm()) {
            this.hasAppropriateNumberChoices = true;
            this.hasTrueAndFalseChoices = true;
            this.hasTooManyChoicesToAddMore = true;
            return;
        }
        this.hasAppropriateNumberChoices = this.questionValidator.hasAppropriateNumberChoices((this.question as Qcm).choices);
        this.hasTrueAndFalseChoices = this.questionValidator.hasTrueAndFalseChoices((this.question as Qcm).choices);
        this.hasTooManyChoicesToAddMore = (this.question as Qcm).choices.length >= MAXIMUM_NUMBER_CHOICES;
    }

    emitDelete(event: MouseEvent) {
        event.stopPropagation();
        this.removeQuestionSignal.emit(this.questionIndex);
    }

    saveQuestion() {
        this.saveQuestionSignal.emit(this.question);
    }

    getSaveDisabledMessage(): string {
        if (!this.question.hasChanged) {
            return 'Aucune modification apportée';
        } else if (!this.isValidQuestion) {
            return 'La question est invalide';
        } else {
            return '';
        }
    }

    addToQuestionBank() {
        this.questionBankService.addQuestionToBank(this.question);
    }

    addToCurrentQuiz(event: MouseEvent) {
        event.stopPropagation();
        this.questionBankService.addQuestionToQuiz(this.question);
    }

    hasError() {
        return !this.isValidQuestion || !this.isUniqueQuestion;
    }

    isQcm(): boolean {
        return this.question.type === QuestionType.MULTIPLE_CHOICE;
    }

    getChoices(): Choice[] {
        return this.isQcm() ? (this.question as Qcm).choices : [];
    }

    getIconText(): string {
        return this.isQcm() ? QCM_ICON : QRL_ICON;
    }

    getIconTooltip(): string {
        return this.isQcm() ? 'Question à choix multiple' : 'Question à réponse libre';
    }

    onChangeQuestionType() {
        (this.question as Qcm).choices = this.isQcm()
            ? []
            : [
                  { text: '', isCorrect: true },
                  { text: '', isCorrect: false },
              ];
        this.question.type = this.isQcm() ? QuestionType.LONG_ANSWER : QuestionType.MULTIPLE_CHOICE;
        this.onInputChange();
    }

    stopPropagation(event: MouseEvent) {
        event.stopPropagation();
    }
}
