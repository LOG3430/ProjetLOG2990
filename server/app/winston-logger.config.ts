import { createLogger, format, transports } from 'winston';
import { OpensearchTransport } from 'winston-opensearch';

export const winstonLoggerConfig = createLogger({
    level: 'info',
    format: format.json(),
    transports: [
        new transports.Console(),
        new OpensearchTransport({
            indexPrefix: 'nestjs-logs',
            clientOpts: {
                node: 'http://opensearch-node1:9200',
            },
        }),
    ],
});
