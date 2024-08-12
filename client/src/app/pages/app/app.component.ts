import { Component } from '@angular/core';
import { SocketCommunicationService } from '@app/services/socket-communication/socket-communication.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    constructor(private clientCommunicationService: SocketCommunicationService) {
        this.clientCommunicationService.connect();
    }
}
