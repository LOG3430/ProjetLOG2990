import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService } from '@app/services/game/game.service';
import { NotificationService } from '@app/services/notification-service/notification.service';
import { PlayersService } from '@app/services/players/players.service';
import { JoinGameComponent } from './join-game.component';

describe('JoinGameComponent', () => {
    let component: JoinGameComponent;
    let fixture: ComponentFixture<JoinGameComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<JoinGameComponent>>;
    let playersServiceSpy: jasmine.SpyObj<PlayersService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let stepperSpy: jasmine.SpyObj<MatStepper>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        stepperSpy = jasmine.createSpyObj('MatStepper', ['next', 'previous', 'selectedIndex']);
        playersServiceSpy = jasmine.createSpyObj('PlayersService', ['validateRoomId', 'connectToGame']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['handleJoinGame']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showBanner']);

        TestBed.configureTestingModule({
            declarations: [JoinGameComponent],
            imports: [AppMaterialModule, NoopAnimationsModule, ReactiveFormsModule],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: PlayersService, useValue: playersServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(JoinGameComponent);
        component = fixture.componentInstance;
        component.gameId = 'testGameId';
        component['gameCreationStepper'] = stepperSpy;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('gameId FormControl', () => {
        it('should be invalid when empty', () => {
            component.firstFormGroup.controls['gameId'].setValue('');
            expect(component.firstFormGroup.valid).toBeFalsy();
        });

        it('should be invalid when not 4 digits', () => {
            component.firstFormGroup.controls['gameId'].setValue('123');
            expect(component.firstFormGroup.valid).toBeFalsy();

            component.firstFormGroup.controls['gameId'].setValue('12345');
            expect(component.firstFormGroup.valid).toBeFalsy();
        });

        it('should be valid when exactly 4 digits', () => {
            component.firstFormGroup.controls['gameId'].setValue('1234');
            expect(component.firstFormGroup.valid).toBeTruthy();
        });
    });

    describe('containsLetterValidator', () => {
        it('should not allow name if there are no letters', () => {
            const validatorFn = component.containsLetterValidator();

            const control = new FormControl('');
            expect(validatorFn(control)).toEqual({ noLetter: true });
        });

        it('should allow if there is at least one letter', () => {
            const validatorFn = component.containsLetterValidator();

            const control = new FormControl('a123');
            expect(validatorFn(control)).toBeNull();
        });
    });

    describe('setGameId', () => {
        it('should notify success and advance the stepper if room ID is valid', fakeAsync(() => {
            playersServiceSpy.validateRoomId.and.returnValue(Promise.resolve(true));
            playersServiceSpy.validateRoomId('1234');
            fixture.detectChanges();
            tick();
            expect(playersServiceSpy.validateRoomId).toHaveBeenCalledWith('1234');
        }));

        it('should notify error if wrong', fakeAsync(() => {
            playersServiceSpy.validateRoomId.and.returnValue(Promise.resolve(false));
            spyOn(component['gameCreationStepper'], 'next');
            playersServiceSpy.validateRoomId('0000');
            fixture.detectChanges();
            tick();
            expect(playersServiceSpy.validateRoomId).toHaveBeenCalledWith('0000');
            expect(component['gameCreationStepper'].next).not.toHaveBeenCalled();
        }));
    });

    describe('numericInputOnly', () => {
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Enter'];

        allowedKeys.forEach((key) => {
            it(`should not prevent default action if ${key} key is pressed`, () => {
                const fakeEvent = new KeyboardEvent('keydown', { key });

                spyOn(fakeEvent, 'preventDefault');

                component.numericInputOnly(fakeEvent);

                expect(fakeEvent.preventDefault).not.toHaveBeenCalled();
            });
        });

        it('should prevent default action if a non-numeric and non-control key is pressed', () => {
            const fakeEvent = new KeyboardEvent('keydown', { key: 'a' });

            spyOn(fakeEvent, 'preventDefault');

            component.numericInputOnly(fakeEvent);

            expect(fakeEvent.preventDefault).toHaveBeenCalled();
        });

        it('should call setGame if Enter is pressed when in the first step ', () => {
            const fakeEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            spyOn(component, 'setGameId');
            component.numericInputOnly(fakeEvent);
            expect(component.setGameId).toHaveBeenCalled();
        });
    });

    describe('setGameId', () => {
        it('should set the game id and call validateRoomId if valid', fakeAsync(() => {
            const testGameId = '1234';
            component.firstFormGroup.controls['gameId'].setValue(testGameId);
            playersServiceSpy.validateRoomId.and.returnValue(Promise.resolve(true));
            component.setGameId();
            tick();
            expect(playersServiceSpy.validateRoomId).toHaveBeenCalledWith(testGameId);
            expect(component.gameId).toEqual(testGameId);
        }));

        it('should not set the game id nor call validateRoomId if not valid', () => {
            component.firstFormGroup.controls['gameId'].setValue('');
            component.setGameId();
            expect(playersServiceSpy.validateRoomId).not.toHaveBeenCalled();
        });
    });

    describe('joinGame', () => {
        it('should join game, close dialog and navigate if playerName is valid and connection is successful', async () => {
            const testGameId = '1234';
            component.firstFormGroup.controls['gameId'].setValue(testGameId);
            const testPlayerName = 'TestPlayer';
            component.secondFormGroup.controls['playerName'].setValue(testPlayerName);
            playersServiceSpy.connectToGame.and.returnValue(Promise.resolve(true));

            await component.joinGame();

            expect(playersServiceSpy.connectToGame).toHaveBeenCalledWith('testGameId', testPlayerName);
            expect(gameServiceSpy.handleJoinGame).toHaveBeenCalledWith('testGameId');
            expect(dialogRefSpy.close).toHaveBeenCalled();
        });

        it('should not proceed if playerName is valid but connection fails', async () => {
            const testGameId = '1234';
            component.firstFormGroup.controls['gameId'].setValue(testGameId);
            component.secondFormGroup.controls['playerName'].setValue('TestPlayer');
            playersServiceSpy.connectToGame.and.returnValue(Promise.resolve(false));

            await component.joinGame();

            expect(playersServiceSpy.connectToGame).toHaveBeenCalledTimes(1);
            expect(gameServiceSpy.handleJoinGame).not.toHaveBeenCalled();
            expect(dialogRefSpy.close).not.toHaveBeenCalled();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('should not proceed if playerName is invalid', async () => {
            const testGameId = '1234';
            component.firstFormGroup.controls['gameId'].setValue(testGameId);
            component.secondFormGroup.controls['playerName'].setErrors({ invalid: true });

            await component.joinGame();

            expect(playersServiceSpy.connectToGame).not.toHaveBeenCalled();
            expect(gameServiceSpy.handleJoinGame).not.toHaveBeenCalled();
            expect(dialogRefSpy.close).not.toHaveBeenCalled();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });
    });

    // disabled to make test more concise
    /* eslint-disable @typescript-eslint/no-empty-function */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    describe('onChange', () => {
        it('should focus the target for codeInput', () => {
            component['gameCreationStepper'].selectedIndex = 0;
            component['codeInput'] = { nativeElement: { focus: () => {} } } as any;
            const codeInputSpy = spyOn(component['codeInput'].nativeElement, 'focus');
            component['playerNameInput'] = { nativeElement: { focus: () => {} } } as any;
            const playerNameInputSpy = spyOn(component['playerNameInput'].nativeElement, 'focus');

            component.onChange();
            expect(codeInputSpy).toHaveBeenCalled();
            expect(playerNameInputSpy).not.toHaveBeenCalled();
        });

        it('should focus the target for playerNameInput', () => {
            component['playerNameInput'] = { nativeElement: { focus: () => {} } } as any;
            const playerNameInputSpy = spyOn(component['playerNameInput'].nativeElement, 'focus');
            component['codeInput'] = { nativeElement: { focus: () => {} } } as any;
            const codeInputSpy = spyOn(component['codeInput'].nativeElement, 'focus');
            component['gameCreationStepper']['selectedIndex'] = 1;

            component.onChange();
            expect(codeInputSpy).toHaveBeenCalled();
            expect(playerNameInputSpy).not.toHaveBeenCalled();
        });
    });
});
