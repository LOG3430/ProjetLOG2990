import { AuthService } from '@app/services/auth/auth.service';
import { AuthResDto } from '@common/http/auth.dto';
import { Body, Controller, Logger, Post } from '@nestjs/common';
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) {}

    @Post()
    auth(@Body('password') password: string): AuthResDto {
        this.logger.log('Auth request received');
        return { isValid: this.authService.isValidPassword(password) };
    }
}
