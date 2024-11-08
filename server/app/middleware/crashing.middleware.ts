/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class ConditionalCrashMiddleware implements NestMiddleware {
    private readonly logger = new Logger(ConditionalCrashMiddleware.name);

    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    use(req: any, res: any, next: () => void) {
        if(req.originalUrl.includes('api/db/quiz/')){
        
        // THIS IS A VERY COMPLEX OPERATION THAT MIGHT FAIL
        // LIKE PULLING SOME DATA FROM A DATABASE OR FROM DISK
        // MAYBE SOME THREAD RACE !
        let value = this.randomInRange(0, 100);
        
            if(value <= 3) {
                throw new Error("Random failure");
            }
        }

        next();
    }
}
