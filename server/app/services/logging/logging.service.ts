import { Injectable } from '@nestjs/common';
import winston, { createLogger, format, transports } from 'winston';
import { OpensearchTransport } from 'winston-opensearch';

@Injectable()
export class LoggingService {
    private logger: winston.Logger;

    constructor() {
        const opensearchHost = 'http://opensearch-node1:9200';
        this.logger = createLogger({
            level: 'info',
            format: format.json(),
            transports: [
                new OpensearchTransport({
                    indexPrefix: 'nestjs-logs',
                    clientOpts: {
                        node: opensearchHost,
                    },
                }),
                new transports.Console(),
            ],
        });
    }

    log(message: string) {
        this.logger.info(message);
    }

    error(message: string) {
        this.logger.error(message);
    }

    warn(message: string) {
        this.logger.warn(message);
    }

    debug(message: string) {
        this.logger.debug(message);
    }

    verbose(message: string) {
        this.logger.verbose(message);
    }
}

export function create_logger()
{
    const opensearchHost = 'http://opensearch-node1:9200';
    return createLogger({
        level: 'info',
        format: format.json(),
        transports: [
            new OpensearchTransport({
                indexPrefix: 'nestjs-logs',
                clientOpts: {
                    node: opensearchHost,
                },
            }),
            new transports.Console(),
        ],
    });
}