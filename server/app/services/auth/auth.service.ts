import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    secretPassword = 'admin';

    isValidPassword(password: string): boolean {
        return password === this.secretPassword;
    }
}
