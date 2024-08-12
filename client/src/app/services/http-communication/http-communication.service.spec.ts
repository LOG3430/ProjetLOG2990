import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpCommunicationService } from '@app/services/http-communication/http-communication.service';
import { AuthReqDto, AuthResDto } from '@common/http/auth.dto';

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: HttpCommunicationService;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(HttpCommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send a GET request and return the response', () => {
        const expectedResponse = { data: 'Hello, World!' };

        service.basicGet<unknown>('example').subscribe((response) => {
            expect(response).toEqual(expectedResponse);
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedResponse);
    });

    it('should send a POST request and return the response', () => {
        const requestBody = { name: 'John Doe' };
        const expectedResponse = { id: 1, name: 'John Doe' };

        service.basicPost<unknown, unknown>('example', requestBody).subscribe((response) => {
            expect(response).toEqual(expectedResponse);
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(requestBody);
        req.flush(expectedResponse);
    });

    it('should send a PUT request and return the response', () => {
        const requestBody = { id: 1, name: 'John Doe' };
        const expectedResponse = { success: true };

        service.basicPut<unknown, unknown>('example', requestBody).subscribe((response) => {
            expect(response).toEqual(expectedResponse);
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(requestBody);
        req.flush(expectedResponse);
    });

    it('should send a PATCH request and return the response', () => {
        const requestBody = { name: 'John Doe' };
        const expectedResponse = { success: true };

        service.basicPatch<unknown, unknown>('example', requestBody).subscribe((response) => {
            expect(response).toEqual(expectedResponse);
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual(requestBody);
        req.flush(expectedResponse);
    });

    it('should send a DELETE request and return void', () => {
        service.basicDelete('example').subscribe((response) => {
            expect(response).toBeNull();
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });

    it('should return isValid when password is okay', () => {
        const body: AuthReqDto = { password: 'log2990-203' };
        service.basicPost<AuthReqDto, AuthResDto>('auth', body).subscribe({
            // disabled no-empty-function because this is a test file
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/auth`);
        expect(req.request.method).toBe('POST');
        req.flush(body);
    });

    it('should handle http error safely', () => {
        service.basicPost<AuthReqDto, AuthResDto>('badPath', { password: '' }).subscribe({
            next: (response) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/badPath`);
        expect(req.request.method).toBe('POST');
        req.error(new ProgressEvent('Random error occurred'));
    });
});
