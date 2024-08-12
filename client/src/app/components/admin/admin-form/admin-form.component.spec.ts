import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { AdminFormComponent } from './admin-form.component';
import { AuthService } from '@app/services/auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';

describe('AdminFormComponent', () => {
    let component: AdminFormComponent;
    let fixture: ComponentFixture<AdminFormComponent>;
    let authService: AuthService;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AdminFormComponent>>;

    beforeEach(() => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AdminFormComponent],
            providers: [MatFormField, HttpClient, HttpHandler, AppMaterialModule, { provide: MatDialogRef, useValue: dialogRefSpy }, AuthService],
            imports: [NoopAnimationsModule, AppMaterialModule, ReactiveFormsModule],
        });
        fixture = TestBed.createComponent(AdminFormComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should reset inputValue and set errorMessage when onSubmit is called with invalid password', async () => {
        spyOn(authService, 'validatePassword').and.returnValue(Promise.resolve(false));
        component.inputValue.setValue('invalidPassword');

        await component.onSubmit();

        expect(component.errorMessage).toBe('Mot de passe invalide');
        expect(component.inputValue.value).toBeNull();
    });

    it('should close the dialog when onSubmit is called with valid password', async () => {
        spyOn(authService, 'validatePassword').and.returnValue(Promise.resolve(true));
        component.inputValue.setValue('validPassword');

        await component.onSubmit();

        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });
});
