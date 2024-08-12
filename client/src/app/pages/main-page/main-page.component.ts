import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { JoinGameComponent } from '@app/components/game/join-game/join-game.component';
import { AppRoutes } from '@app/enums/app-routes.enum';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly gameCreationPath = AppRoutes.GameCreation;
    readonly adminPath = AppRoutes.Admin;
    constructor(public dialog: MatDialog) {}

    openDialog(enterAnimationDuration: number, exitAnimationDuration: number): void {
        this.dialog.open(JoinGameComponent, {
            width: '60vw',
            panelClass: 'mat-dialog',
            enterAnimationDuration,
            exitAnimationDuration,
        });
    }
}
