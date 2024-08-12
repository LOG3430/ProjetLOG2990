import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppMaterialModule } from '@app/modules/material.module';
import { ChoiceComponent } from './choice.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ChoiceComponent', () => {
    let component: ChoiceComponent;
    let fixture: ComponentFixture<ChoiceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ChoiceComponent],
            imports: [AppMaterialModule, NoopAnimationsModule],
        });

        fixture = TestBed.createComponent(ChoiceComponent);
        component = fixture.componentInstance;
        component.choice = { text: 'test', isCorrect: true };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit delete event', () => {
        spyOn(component.delete, 'emit');
        component.onDelete();
        expect(component.delete.emit).toHaveBeenCalled();
    });

    it('should emit choiceChange event', () => {
        spyOn(component.choiceChange, 'emit');
        component.onChangeChoice();
        expect(component.choiceChange.emit).toHaveBeenCalledWith(component.choice);
    });
});
