import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JoinGameComponent } from '@app/components/game/join-game/join-game.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { MainPageComponent } from './main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            imports: [AppMaterialModule, RouterModule],
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        });

        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('openDialog', () => {
        it('should open the dialog with JoinGameComponent and the specified animation durations', () => {
            const enterAnimationDuration = 1;
            const exitAnimationDuration = 1;
            component.openDialog(enterAnimationDuration, exitAnimationDuration);

            expect(matDialogSpy.open).toHaveBeenCalledWith(JoinGameComponent, {
                width: '60vw',
                panelClass: 'mat-dialog',
                enterAnimationDuration,
                exitAnimationDuration,
            });
        });
    });
});
