import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { AuthResDto } from '@common/http/auth.dto';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let communicationServiceSpy: jasmine.SpyObj<HttpCommunicationService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj(['basicPost']);
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AuthService, { provide: HttpCommunicationService, useValue: communicationServiceSpy }, HttpClient, HttpHandler],
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return the correct authentication status', async () => {
        const password = 'testPassword';
        const expectedResponse = { isValid: true };

        communicationServiceSpy.basicPost.and.returnValue(of(expectedResponse as AuthResDto));

        const res = await service.validatePassword(password);

        expect(communicationServiceSpy.basicPost).toHaveBeenCalledWith('auth', { password });
        expect(res).toBe(expectedResponse.isValid);
        expect(service.getIsAuthenticated()).toBe(expectedResponse.isValid);
    });

    it('should return appropriate isAuthenticated status on init', () => {
        expect(service.getIsAuthenticated()).toBeFalse();
    });
});
