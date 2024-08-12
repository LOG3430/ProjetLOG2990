import { Choice } from './choice.dto';

export enum QuestionType {
    MULTIPLE_CHOICE = 'QCM',
    LONG_ANSWER = 'QRL',
}

interface AbstractQuestion {
    _id: string;
    text: string;
    points: number;
    type: QuestionType;
    lastModification?: Date;
    hasChanged?: boolean;
}

export interface Qcm extends AbstractQuestion {
    choices: Choice[];
}

export interface Qrl extends AbstractQuestion {}

export type Question = Qcm | Qrl;
