import { Prop, Schema } from '@nestjs/mongoose';
@Schema()
export class Question {
    @Prop({ required: true })
    text: string;
    @Prop({ required: true })
    points: number;
    @Prop({ required: true })
    type: string;
    @Prop({ required: false })
    lastModification?: Date;
}
