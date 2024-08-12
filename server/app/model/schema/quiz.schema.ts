import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Question } from './question.schema';
@Schema()
export class QuizDto {
    @Prop({ required: true })
    title: string;
    @Prop({ required: true })
    description: string;
    @Prop({ required: true })
    visible: boolean;
    @Prop({ required: true })
    questions: Question[];
    @Prop({ required: true })
    duration: number;
    @Prop({ required: false })
    lastModification?: Date;
}

export const quizSchema = SchemaFactory.createForClass(QuizDto);
export type QuizDocument = mongoose.HydratedDocument<QuizDto>;
