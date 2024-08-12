import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { CODE_MAX_LENGTH, NAME_MAX_LENGTH, NUMERIC_KEYS } from '@app/constants/join-game.component.constants';
import { GameService } from '@app/services/game/game.service';
import { PlayersService } from '@app/services/players/players.service';

@Component({
    selector: 'app-join-game',
    templateUrl: './join-game.component.html',
    styleUrls: ['./join-game.component.scss'],
})
export class JoinGameComponent {
    @ViewChild('stepper') private gameCreationStepper: MatStepper;
    @ViewChild('codeInput') private codeInput: ElementRef<HTMLInputElement>;
    @ViewChild('nameInput') private playerNameInput: ElementRef<HTMLInputElement>;

    readonly codeMaxLength = CODE_MAX_LENGTH;
    readonly nameMaxLength = NAME_MAX_LENGTH;
    gameId: string;

    firstFormGroup = new FormGroup({
        gameId: new FormControl('', [Validators.required, Validators.pattern(/^\d{4}$/)]),
    });

    secondFormGroup = new FormGroup({
        playerName: new FormControl('', [this.containsLetterValidator()]),
    });

    constructor(
        public dialogRef: MatDialogRef<JoinGameComponent>,
        private playersService: PlayersService,
        private gameService: GameService,
    ) {}

    containsLetterValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const hasLetter = /[a-zA-Z]/.test(control.value);
            return hasLetter ? null : { noLetter: true };
        };
    }

    numericInputOnly(event: KeyboardEvent): void {
        if (!NUMERIC_KEYS.has(event.key)) {
            event.preventDefault();
        }
        if (event.key !== 'Enter') {
            return;
        }

        this.setGameId();
    }

    async setGameId(): Promise<void> {
        const gameIdControl = this.firstFormGroup.get('gameId');
        if (gameIdControl?.valid) {
            if (gameIdControl.value) {
                if (await this.playersService.validateRoomId(gameIdControl.value)) {
                    this.gameCreationStepper.next();
                }
                this.gameId = gameIdControl.value;
            }
        }
    }

    async joinGame(): Promise<void> {
        const playerNameControl = this.secondFormGroup.get('playerName');

        if (playerNameControl?.valid && playerNameControl.value) {
            if (await this.playersService.connectToGame(this.gameId, playerNameControl.value.trim())) {
                this.gameService.handleJoinGame(this.gameId);
                this.dialogRef.close();
            }
        }
    }

    onChange() {
        if (this.gameCreationStepper.selectedIndex === 0) {
            this.codeInput.nativeElement.focus();
        } else {
            this.playerNameInput.nativeElement.focus();
        }
    }
}
