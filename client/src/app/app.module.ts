import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AdminFormComponent } from './components/admin/admin-form/admin-form.component';
import { ChoiceComponent } from './components/admin/choice/choice.component';
import { QuestionComponent } from './components/admin/question/question.component';

import { DateInterceptor } from '@app/interceptors/date-conversion.interceptor';
import { ChangeNameModalComponent } from './components/admin/change-name-modal/change-name-modal.component';
import { ImportModalComponent } from './components/admin/import-modal/import-modal.component';
import { QuestionBankComponent } from './components/admin/question-bank/question-bank.component';
import { QuizAdminListElementComponent } from './components/admin/quiz-admin-list/quiz-admin-list-element/quiz-admin-list-element.component';
import { QuizAdminListComponent } from './components/admin/quiz-admin-list/quiz-admin-list/quiz-admin-list.component';
import { QuizBankAdminComponent } from './components/admin/quiz-bank-admin/quiz-bank-admin.component';
// import needs to be longer than 150 characters
// eslint-disable-next-line max-len
import { HistoryCardComponent } from './components/admin/history-card/history-card.component';
import { HistoryListComponent } from './components/admin/history-list/history-list.component';
import { ConfirmationModalComponent } from './components/admin/confirmation-modal/confirmation-modal.component';
// import needs to be longer than 150 characters
// eslint-disable-next-line max-len
import { QuizCreationListElementComponent } from './components/admin/quiz-creation-list/quiz-creation-list-element/quiz-creation-list-element.component';
import { QuizCreationListComponent } from './components/admin/quiz-creation-list/quiz-creation-list/quiz-creation-list.component';
import { QuizComponent } from './components/admin/quiz/quiz.component';
import { ChatboxComponent } from './components/game/chatbox/chatbox.component';
import { GameChoiceComponent } from './components/game/game-choice/game-choice.component';
import { GameFooterComponent } from './components/game/game-footer/game-footer.component';
import { GameGradeComponent } from './components/game/game-grade/game-grade.component';
import { GameQrlComponent } from './components/game/game-qrl/game-qrl.component';
import { GameSpaceComponent } from './components/game/game-space/game-space.component';
import { GameTimerComponent } from './components/game/game-timer/game-timer.component';
import { HistogramComponent } from './components/game/histogram/histogram.component';
import { JoinGameComponent } from './components/game/join-game/join-game.component';
import { PlayerListBoxComponent } from './components/game/player-list/player-list-box/player-list-box.component';
import { PlayerListElementComponent } from './components/game/player-list/player-list-element/player-list-element.component';
import { PlayerListComponent } from './components/game/player-list/player-list/player-list.component';
import { StatisticComponent } from './components/game/statistic/statistic.component';
import { WaitingRoomComponent } from './components/game/waiting-room/waiting-room.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NotificationComponent } from './components/notification/notification.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { GameCreationPageComponent } from './pages/game-creation-page/game-creation-page.component';
import { GamePageComponent } from './pages/game-page/game-page.component';
import { QuizCreationPageComponent } from './pages/quiz-creation-page/quiz-creation-page.component';
import { ResultsPageComponent } from './pages/results-page/results-page.component';
import { SocketCommunicationService } from './services/socket-communication/socket-communication.service';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        QuestionComponent,
        ChoiceComponent,
        GamePageComponent,
        ResultsPageComponent,
        ChatboxComponent,
        QuizCreationListComponent,
        QuizCreationListElementComponent,
        GameCreationPageComponent,
        QuizComponent,
        NotificationComponent,
        AdminFormComponent,
        NavbarComponent,
        AdminPageComponent,
        QuizAdminListComponent,
        QuizAdminListElementComponent,
        SpinnerComponent,
        ImportModalComponent,
        QuestionBankComponent,
        QuizBankAdminComponent,
        QuizCreationPageComponent,
        WaitingRoomComponent,
        ChangeNameModalComponent,
        GameChoiceComponent,
        GameQrlComponent,
        GameFooterComponent,
        GamePageComponent,
        PlayerListComponent,
        PlayerListElementComponent,
        JoinGameComponent,

        GameSpaceComponent,
        GameTimerComponent,
        HistogramComponent,
        StatisticComponent,
        PlayerListBoxComponent,
        GameGradeComponent,
        HistoryCardComponent,
        HistoryListComponent,
        ConfirmationModalComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        NgApexchartsModule,
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: DateInterceptor,
            multi: true,
        },
        SocketCommunicationService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
