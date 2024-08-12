import { Choice } from '@common/interfaces/choice.dto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Question } from './question.schema';

@Schema()
export class QcmDto extends Question {
    @Prop({ required: true })
    choices: Choice[];
}

export const qcmSchema = SchemaFactory.createForClass(QcmDto);
export type QcmDocument = HydratedDocument<QcmDto>;
