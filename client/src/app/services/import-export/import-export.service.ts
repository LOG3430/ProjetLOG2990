import { ElementRef, Injectable } from '@angular/core';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { Choice } from '@common/interfaces/choice.dto';
import { Qcm, Qrl, Question, QuestionType } from '@common/interfaces/question.dto';
import { Quiz } from '@common/interfaces/quiz.dto';

// disabled no-explicit-any because we are parsing a JSON object
/* eslint-disable  @typescript-eslint/no-explicit-any */

@Injectable({
    providedIn: 'root',
})
export class ImportExportService {
    constructor(private quizValidatorService: QuizValidatorService) {}

    exportAsJson(data: Quiz, filename: string, downloadComponent: ElementRef<HTMLAnchorElement>) {
        const jsonData = this.deepCopy(data) as Quiz;

        const blob = new Blob([JSON.stringify({ ...jsonData, visible: undefined, id: jsonData._id, _id: undefined })], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);

        this.downloadFileFromUrl(url, filename, downloadComponent);

        window.URL.revokeObjectURL(url);
    }

    async importFromJson(file: File): Promise<Quiz> {
        return new Promise<Quiz>((res, rej) => {
            const reader = new FileReader();

            reader.onload = (event: ProgressEvent<FileReader>) => {
                try {
                    if (!event.target || !event.target.result) throw new Error("Aucun fichier n'a été donné");

                    const parsedData = JSON.parse(event.target.result as string);
                    const quiz = this.jsonToQuizDto(parsedData);

                    this.quizValidatorService
                        .testQuiz(quiz)
                        .then(() => {
                            res(quiz);
                        })
                        .catch((error) => {
                            rej(error);
                        });
                } catch (error) {
                    rej(error);
                }
            };

            reader.readAsText(file);
        });
    }

    deepCopy(quiz: Quiz): object {
        return JSON.parse(JSON.stringify(quiz));
    }

    downloadFileFromUrl(url: string, filename: string, downloadComponent: ElementRef<HTMLAnchorElement>) {
        if (!downloadComponent) {
            throw new ReferenceError('Le composant de téléchargement est introuvable');
        }

        downloadComponent.nativeElement.href = url;
        downloadComponent.nativeElement.download = filename;
        downloadComponent.nativeElement.click();
    }

    jsonToQuizDto(jsonQuiz: any): Quiz {
        try {
            const quizDto: Quiz = {
                _id: jsonQuiz.id,
                lastModification: new Date(),
                title: jsonQuiz.title,
                description: jsonQuiz.description,
                duration: jsonQuiz.duration,
                visible: false,
                questions: jsonQuiz.questions.map((x: Question) => this.jsonToQuestionDto(x)),
            };
            return quizDto;
        } catch (error) {
            throw new Error('Le format du JSON est invalide');
        }
    }

    jsonToQuestionDto(jsonQuestion: any): Question {
        if (jsonQuestion.type === 'QCM') {
            const question: Qcm = {
                _id: '',
                text: jsonQuestion.text,
                points: jsonQuestion.points,
                type: QuestionType.MULTIPLE_CHOICE,
                choices: jsonQuestion.choices.map((x: unknown) => this.jsonToChoice(x)),
            };
            return question;
        } else if (jsonQuestion.type === 'QRL') {
            const question: Qrl = {
                _id: '',
                text: jsonQuestion.text,
                points: jsonQuestion.points,
                type: QuestionType.LONG_ANSWER,
            };
            return question;
        } else {
            throw new Error('Le format du JSON est invalide');
        }
    }

    jsonToChoice(jsonChoice: any): Choice {
        const choice: Choice = {
            text: jsonChoice.text,
            isCorrect: jsonChoice.isCorrect,
        };
        return choice;
    }
}
