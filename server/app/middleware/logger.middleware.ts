import { create_logger } from '../services/logging/logging.service'
import winston from 'winston'
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger: winston.Logger;

  constructor(){
    this.logger = create_logger();
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.info(req.originalUrl, {'method' : req.method})
    next();
  }
}