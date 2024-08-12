import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { QuizCreationListComponent } from '@app/components/admin/quiz-creation-list/quiz-creation-list/quiz-creation-list.component';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';
import { GameCreationPageComponent } from './game-creation-page.component';

describe('GameCreationPageComponent', () => {
    let component: GameCreationPageComponent;
    let fixture: ComponentFixture<GameCreationPageComponent>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let dialogSpy: MatDialog;

    beforeEach(async () => {
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['getQuizzes', 'on']);

        dialogSpy = jasmine.createSpyObj('MatDialog', ['closeAll']);
        await TestBed.configureTestingModule({
            declarations: [GameCreationPageComponent, QuizCreationListComponent],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
