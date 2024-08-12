import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '@app/components/admin/confirmation-modal/confirmation-modal.component';
import { CanComponentDeactivate } from '@app/interfaces/can-component-deactivate';
import { QuestionBankService } from '@app/services/question-bank/question-bank.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements CanComponentDeactivate {
    constructor(
        private dialog: MatDialog,
        private questionBankService: QuestionBankService,
    ) {}

    canDeactivate(): Observable<boolean> | boolean {
        if (!this.questionBankService.haveQuestionsChanged()) {
            return true;
        }
        const dialogRef = this.dialog.open(ConfirmationModalComponent, {
            panelClass: 'mat-dialog',
            enterAnimationDuration: 0,
            exitAnimationDuration: 0,
            data: {
                title: 'Voulez-vous vraiment quitter?',
                message: 'Tous vos changements non-sauvegardés seront perdus.',
            },
        });
        return dialogRef.afterClosed();
    }
}
