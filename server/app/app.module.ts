import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controllers/auth/auth.controller';
import { HistoryController } from './controllers/database/history/history.controller';
import { QuestionDatabaseController } from './controllers/database/questions/questions.controller';
import { QuizDatabaseController } from './controllers/database/quiz/quiz.controller';
import { ValidationController } from './controllers/validation/validation.controller';
import { GameSocketGateway } from './gateways/websockets.gateway';
import { HistoryDto, historySchema } from './model/schema/history.schema';
import { QcmDto, qcmSchema } from './model/schema/qcm.schema';
import { QuizDto, quizSchema } from './model/schema/quiz.schema';
import { AuthService } from './services/auth/auth.service';
import { ChatService } from './services/chat/chat.service';
import { ClientCommunicationService } from './services/client-communication/client-communication.service';
import { HistoryService } from './services/database/history/history.service';
import { QuestionDatabaseService } from './services/database/question/question.service';
import { QuizDatabaseService } from './services/database/quiz/quiz.service';
import { GameStateService } from './services/game-state/game-state.service';
import { GameService } from './services/game/game.service';
import { LoggingService } from './services/logging/logging.service';
import { QuizService } from './services/quiz/quiz.service';
import { RoomService } from './services/room/room.service';
import { ValidationService } from './services/validation/validation.service';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        MongooseModule.forRoot(process.env.DATABASE_URI, {}),
        MongooseModule.forFeature([{ name: QcmDto.name, schema: qcmSchema }]),
        MongooseModule.forFeature([{ name: QuizDto.name, schema: quizSchema }]),
        MongooseModule.forFeature([{ name: HistoryDto.name, schema: historySchema }]),
    ],
    controllers: [AuthController, QuestionDatabaseController, QuizDatabaseController, ValidationController, HistoryController],
    providers: [
        AuthService,
        QuizDatabaseService,
        QuestionDatabaseService,
        ValidationService,
        RoomService,
        GameService,
        ChatService,
        ClientCommunicationService,
        GameSocketGateway,
        GameStateService,
        QuizService,
        HistoryService,
        LoggingService,
    ],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
          .apply(LoggerMiddleware)
          .forRoutes('*');
      }
}
