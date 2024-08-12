import { TestBed } from '@angular/core/testing';
import { NavbarComponent } from '@app/components/navbar/navbar.component';
import { NotificationComponent } from '@app/components/notification/notification.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';

describe('AppComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppRoutingModule, AppMaterialModule],
            declarations: [AppComponent, NavbarComponent, NotificationComponent],
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });
});
