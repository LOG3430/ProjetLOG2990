import { Question } from './question.dto';

export interface Quiz {
    _id: string;
    title: string;
    description: string;
    duration: number;
    visible: boolean;
    lastModification: Date;
    questions: Question[];
    hasChanged?: boolean;
}
