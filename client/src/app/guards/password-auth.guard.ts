import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdminFormComponent } from '@app/components/admin/admin-form/admin-form.component';
import { AuthService } from '@app/services/auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class CanActivateAdminRoute {
    constructor(
        private dialog: MatDialog,
        private router: Router,
        private authService: AuthService,
    ) {}

    async canActivate(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (this.authService.getIsAuthenticated()) {
                resolve(true);
            } else {
                const dialogRef = this.dialog.open(AdminFormComponent, {
                    width: '300px',
                    disableClose: true,
                    panelClass: 'mat-dialog',
                    enterAnimationDuration: 0,
                    exitAnimationDuration: 0,
                });

                dialogRef.afterClosed().subscribe(async (isValid: boolean) => {
                    if (isValid) {
                        resolve(true);
                    } else {
                        this.router.navigate(['/']);
                        resolve(false);
                    }
                });
            }
        });
    }
}
