import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    secretPassword = 'log2990-203';

    isValidPassword(password: string): boolean {
        return password === this.secretPassword;
    }
}
