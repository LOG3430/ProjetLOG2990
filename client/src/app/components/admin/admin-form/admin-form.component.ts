import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '@app/services/auth/auth.service';

@Component({
    selector: 'app-admin-form',
    templateUrl: './admin-form.component.html',
    styleUrls: ['./admin-form.component.scss'],
})
export class AdminFormComponent implements AfterViewInit {
    @ViewChild('passwordInput') inputElement: ElementRef;
    inputValue: FormControl = new FormControl('');
    errorMessage: string = '';

    constructor(
        private dialogRef: MatDialogRef<AdminFormComponent>,
        private authentificationService: AuthService,
    ) {}

    ngAfterViewInit() {
        setTimeout(() => {
            this.inputElement.nativeElement.focus();
        });
    }

    async onSubmit() {
        const isValid = await this.authentificationService.validatePassword(this.inputValue.value);
        if (isValid) {
            this.dialogRef.close(true);
        } else {
            this.errorMessage = 'Mot de passe invalide';
            this.inputValue.reset();
        }
    }
}
