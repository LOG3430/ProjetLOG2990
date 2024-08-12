import { AuthController } from '@app/controllers/auth/auth.controller';
import { AuthService } from '@app/services/auth/auth.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [AuthService],
        }).compile();
        authService = module.get<AuthService>(AuthService);
        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it("should call authService's isValidPassword method with the password from the request body", () => {
        const password = 'password';
        const isValidPasswordSpy = jest.spyOn(authService, 'isValidPassword');
        controller.auth(password);
        expect(isValidPasswordSpy).toHaveBeenCalledWith(password);
    });
});
