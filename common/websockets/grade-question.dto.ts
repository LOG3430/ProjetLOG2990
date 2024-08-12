export interface GradeQuestionReq {
    playerName: string;
    answer: string;
    gradeIndex: number;
    gradeTotal: number;
}

export interface GradeQuestionRes {
    grade: number;
}