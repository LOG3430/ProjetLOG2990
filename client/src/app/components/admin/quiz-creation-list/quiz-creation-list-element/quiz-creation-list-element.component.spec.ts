import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizBankAdminComponent } from '@app/components/admin/quiz-bank-admin/quiz-bank-admin.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuizCreationListElementComponent } from './quiz-creation-list-element.component';

describe('QuizListElementComponent', () => {
    let component: QuizCreationListElementComponent;
    let fixture: ComponentFixture<QuizCreationListElementComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QuizCreationListElementComponent, QuizBankAdminComponent],
            imports: [AppMaterialModule],
        }).compileComponents();

        fixture = TestBed.createComponent(QuizCreationListElementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
