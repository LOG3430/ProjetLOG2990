import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService],
        }).compile();
        service = module.get<AuthService>(AuthService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('isValidPassword() should return false when input is wrong', async () => {
        const fakePassword = 'fakePassword';
        expect(service.isValidPassword(fakePassword)).toEqual(false);
    });
    it('isValidPassword() should return true when input is correct', async () => {
        const password = 'log2990-203';
        expect(service.isValidPassword(password)).toEqual(true);
    });
});
