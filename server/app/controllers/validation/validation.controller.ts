import { GameService } from '@app/services/game/game.service';
import { ConnectionRes } from '@common/websockets/connection.dto';
import { Body, Controller, Post } from '@nestjs/common';
@Controller('validation')
export class ValidationController {
    constructor(private gameService: GameService) {}
    @Post('/rooms')
    verifyRoomId(@Body('room') room: string): ConnectionRes {
        const error = this.gameService.getGameIdConnectionError(room);

        return error ? { success: false, errorType: error } : { success: true };
    }
}
