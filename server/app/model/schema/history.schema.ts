import { HistoryInfo } from '@common/http/historyInfo.dto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class HistoryDto implements HistoryInfo {
    @Prop({ required: true })
    title: string;
    @Prop({ required: true })
    startDateTime: Date;
    @Prop({ required: true })
    winner: string;
    @Prop({ required: true })
    highScore: number;
    @Prop({ required: true })
    nPlayersStart: number;
}

export const historySchema = SchemaFactory.createForClass(HistoryDto);
export type HistoryDocument = HydratedDocument<HistoryDto>;
