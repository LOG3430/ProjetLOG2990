import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportModalComponent } from './import-modal.component';
import { AppMaterialModule } from '@app/modules/material.module';

describe('ImportModalComponent', () => {
    let component: ImportModalComponent;
    let fixture: ComponentFixture<ImportModalComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ImportModalComponent],
            imports: [AppMaterialModule],
        });
        fixture = TestBed.createComponent(ImportModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set selectedFile when onFileSelected is called', () => {
        const event = {
            target: {
                files: [new File(['test'], 'test.txt')],
            },
        } as unknown as Event;

        component.onFileSelected(event);

        expect(component.selectedFile).toEqual(new File(['test'], 'test.txt'));
    });

    it('should not set selectedFile when onFileSelected is called with no files', () => {
        const event = {
            target: {},
        } as Event;

        component.onFileSelected(event);

        expect(component.selectedFile).toBeNull();
    });
});
