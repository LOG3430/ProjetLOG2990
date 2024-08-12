import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedRoute, RouterModule } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [NavbarComponent],
            imports: [AppMaterialModule, RouterModule],
            providers: [{ provide: ActivatedRoute, useValue: activatedRouteSpy }],
        });
        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
