import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { QuizCreationPageComponent } from '@app/pages/quiz-creation-page/quiz-creation-page.component';

import { canDeactivateGuard } from '@app/guards/can-deactivate.guard';
import { AppPages } from '@app/enums/app-pages.enum';
import { CanActivateAdminRoute } from '@app/guards/password-auth.guard';

const routes: Routes = [
    { path: '', redirectTo: AppPages.Home, pathMatch: 'full' },
    { path: AppPages.Home, component: MainPageComponent },
    { path: `${AppPages.Play}`, component: GamePageComponent, canDeactivate: [canDeactivateGuard] },
    { path: AppPages.GameCreation, component: GameCreationPageComponent },
    { path: `${AppPages.Quiz}/:id`, component: QuizCreationPageComponent, canActivate: [CanActivateAdminRoute], canDeactivate: [canDeactivateGuard] },
    { path: AppPages.Admin, component: AdminPageComponent, canActivate: [CanActivateAdminRoute], canDeactivate: [canDeactivateGuard] },
    { path: '**', redirectTo: AppPages.Home },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true, bindToComponentInputs: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
