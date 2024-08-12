import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-change-name-modal',
    templateUrl: './change-name-modal.component.html',
    styleUrls: ['./change-name-modal.component.scss'],
})
export class ChangeNameModalComponent {
    newName: string;

    constructor(public dialogRef: MatDialogRef<ChangeNameModalComponent>) {}

    submitForm(): void {
        if (this.newName) {
            this.dialogRef.close(this.newName);
        }
    }
}
