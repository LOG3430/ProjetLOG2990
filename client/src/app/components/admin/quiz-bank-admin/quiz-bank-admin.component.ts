import { Component, ContentChild, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ConfirmationModalComponent } from '@app/components/admin/confirmation-modal/confirmation-modal.component';
import { QuizComponent } from '@app/components/admin/quiz/quiz.component';
import { CanComponentDeactivate } from '@app/interfaces/can-component-deactivate';
import { AppRoutes } from '@app/enums/app-routes.enum';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-quiz-bank-admin',
    templateUrl: './quiz-bank-admin.component.html',
    styleUrls: ['./quiz-bank-admin.component.scss'],
})
export class QuizBankAdminComponent implements CanComponentDeactivate {
    @ContentChild(QuizComponent) quiz: QuizComponent;
    @ViewChild('drawer') drawer: MatDrawer;

    constructor(
        private router: Router,
        private dialog: MatDialog,
    ) {}

    exitToAdminPage() {
        this.router.navigate([AppRoutes.Admin]);
    }

    openDrawer() {
        this.drawer.open();
    }

    canDeactivate(): Observable<boolean> | boolean {
        if (!this.quiz.data.hasChanged) {
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
