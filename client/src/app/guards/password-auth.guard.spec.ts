import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CanActivateAdminRoute } from './password-auth.guard';
import { AuthService } from '@app/services/auth/auth.service';

describe('PasswordAuthGuard', () => {
    let guard: CanActivateAdminRoute;
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockAuthService: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['getIsAuthenticated']);

        TestBed.configureTestingModule({
            providers: [
                CanActivateAdminRoute,
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: AuthService, useValue: authServiceSpy },
            ],
        });
        guard = TestBed.inject(CanActivateAdminRoute);
        mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });

    it('should return true if user is authenticated', fakeAsync(() => {
        mockAuthService.getIsAuthenticated.and.returnValue(true);
        guard.canActivate().then((result: boolean) => {
            expect(result).toBe(true);
        });
        tick();
    }));

    it('should return true if user is authenticated and modal closed', fakeAsync(() => {
        mockAuthService.getIsAuthenticated.and.returnValue(false);
        const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true) });
        mockDialog.open.and.returnValue(dialogRefSpyObj);
        guard.canActivate().then((result: boolean) => {
            expect(result).toBe(true);
        });
        tick();
    }));

    it('should return false if user is not authenticated', fakeAsync(() => {
        mockAuthService.getIsAuthenticated.and.returnValue(false);
        const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(false) });
        mockDialog.open.and.returnValue(dialogRefSpyObj);
        guard.canActivate().then((result: boolean) => {
            expect(result).toBe(false);
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
        });
        tick();
    }));
});
