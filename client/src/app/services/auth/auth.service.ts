import { Injectable } from '@angular/core';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { AuthReqDto, AuthResDto } from '@common/http/auth.dto';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private isAuthenticated: boolean = false;
    constructor(private communicationService: HttpCommunicationService) {}

    getIsAuthenticated(): boolean {
        return this.isAuthenticated;
    }

    async validatePassword(password: string) {
        const response = await firstValueFrom(this.communicationService.basicPost<AuthReqDto, AuthResDto>('auth', { password }));
        this.isAuthenticated = response.isValid;
        return response.isValid;
    }
}
