import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ChangeNameModalComponent } from './change-name-modal.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { FormsModule } from '@angular/forms';

describe('ChangeNameModalComponent', () => {
    let component: ChangeNameModalComponent;
    let fixture: ComponentFixture<ChangeNameModalComponent>;
    let dialogRef: jasmine.SpyObj<MatDialogRef<ChangeNameModalComponent>>;

    beforeEach(() => {
        dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        TestBed.configureTestingModule({
            declarations: [ChangeNameModalComponent],
            imports: [AppMaterialModule, FormsModule],
            providers: [{ provide: MatDialogRef, useValue: dialogRef }],
        });
        fixture = TestBed.createComponent(ChangeNameModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('submitForm', () => {
        it('should close the dialog if newName is defined', () => {
            component.newName = 'John Doe';

            component.submitForm();

            expect(dialogRef.close).toHaveBeenCalledWith('John Doe');
        });

        it('should not close the dialog if newName is not defined', () => {
            component.newName = '';

            component.submitForm();

            expect(dialogRef.close).not.toHaveBeenCalled();
        });
    });
});
