import { AuthService } from '@app/services/auth/auth.service';
import { LoggingService } from '@app/services/logging/logging.service';
import { AuthResDto } from '@common/http/auth.dto';
import { Body, Controller, Post } from '@nestjs/common';
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly loggingService: LoggingService,
    ) {}
    @Post()
    auth(@Body('password') password: string): AuthResDto {
        this.loggingService.log('Auth request received');
        return { isValid: this.authService.isValidPassword(password) };
    }
}
