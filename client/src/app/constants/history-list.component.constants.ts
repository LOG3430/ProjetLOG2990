export enum SortType {
    Date = 'date',
    Title = 'title',
}

export enum SortDirection {
    Ascending = 'ascending',
    Descending = 'descending',
}

export const sortTexts = {
    date: { ascending: { text: "Date (plus récent d'abord)", icon: 'update' }, descending: { text: "Date (plus ancien d'abord)", icon: 'history' } },
    title: { ascending: { text: 'Titre (A > Z)', icon: 'text_increase' }, descending: { text: 'Titre (Z > A)', icon: 'text_decrease' } },
};
