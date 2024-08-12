import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { ConfirmationModalComponent } from './confirmation-modal.component';

describe('ConfirmationModalComponent', () => {
    let component: ConfirmationModalComponent;
    let fixture: ComponentFixture<ConfirmationModalComponent>;
    let dialogSpy: MatDialog;

    beforeEach(() => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);

        TestBed.configureTestingModule({
            declarations: [ConfirmationModalComponent],
            providers: [
                {
                    provide: MatDialog,
                    useValue: dialogSpy,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        title: 'Test Title',
                        message: 'Test Message',
                    },
                },
            ],
            imports: [AppMaterialModule],
        });
        fixture = TestBed.createComponent(ConfirmationModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should contain the same title as the input data', () => {
        expect(component.data.title).toEqual('Test Title');
    });

    it('should contain the same message as the input data', () => {
        expect(component.data.message).toEqual('Test Message');
    });
});
