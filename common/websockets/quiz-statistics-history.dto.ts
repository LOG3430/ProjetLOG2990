import { Quiz } from '@common/interfaces/quiz.dto';
import { TotalSelectedChoices } from './total-result.dto';

export interface QuizStatisticsHistoryRes {
    totalSelectedChoicesHistory: TotalSelectedChoices[];
    quiz: Quiz;
}
