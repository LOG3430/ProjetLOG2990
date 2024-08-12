import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/enums/app-routes.enum';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
    readonly homePath = AppRoutes.Home;
    constructor(private router: Router) {}

    isNavbarVisible(): boolean {
        return !(this.router.url === this.homePath);
    }
}
