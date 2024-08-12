export interface TotalSelectedChoices {
    choice0: number;
    choice1: number;
    choice2?: number;
    choice3?: number;
}

export interface TotalGrades {
    grade0: number;
    grade50: number;
    grade100: number;
}

export interface TotalIsEditing {
    isEditing: number;
    isNotEditing: number;
}

export type TotalResult = TotalSelectedChoices | TotalGrades | TotalIsEditing;
