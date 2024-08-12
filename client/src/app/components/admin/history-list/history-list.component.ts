import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '@app/components/admin/confirmation-modal/confirmation-modal.component';
import { SortDirection, SortType, sortTexts } from '@app/constants/history-list.component.constants';
import { HistoryService } from '@app/services/history/history.service';
@Component({
    selector: 'app-history-list',
    templateUrl: './history-list.component.html',
    styleUrls: ['./history-list.component.scss'],
})
export class HistoryListComponent implements OnInit {
    selectedSortingIndex: number = 0;
    sortOptions = [
        {
            sortingFunction: (event: Event) => {
                event.stopPropagation();
                this.selectedSortingIndex = 0;
                this.historyService.sortBy(SortType.Date, SortDirection.Ascending);
            },
            ...sortTexts.date.ascending,
        },
        {
            sortingFunction: (event: Event) => {
                event.stopPropagation();
                this.selectedSortingIndex = 1;
                this.historyService.sortBy(SortType.Date, SortDirection.Descending);
            },
            ...sortTexts.date.descending,
        },
        {
            sortingFunction: (event: Event) => {
                event.stopPropagation();
                this.selectedSortingIndex = 2;
                this.historyService.sortBy(SortType.Title, SortDirection.Ascending);
            },
            ...sortTexts.title.ascending,
        },
        {
            sortingFunction: (event: Event) => {
                event.stopPropagation();
                this.selectedSortingIndex = 3;
                this.historyService.sortBy(SortType.Title, SortDirection.Descending);
            },
            ...sortTexts.title.descending,
        },
    ];

    constructor(
        private historyService: HistoryService,
        public dialog: MatDialog,
    ) {}

    ngOnInit() {
        this.historyService.getHistory();
    }

    getHistory() {
        return this.historyService.games;
    }

    deleteHistory() {
        this.historyService.deleteHistory();
    }

    canDelete(): boolean {
        return this.historyService.games.length > 0;
    }

    openConfirmationModal() {
        const dialogRef = this.dialog.open(ConfirmationModalComponent, {
            panelClass: 'mat-dialog',
            enterAnimationDuration: 0,
            exitAnimationDuration: 0,
            data: { title: "Supprimer l'historique", message: "Êtes-vous sûr de vouloir supprimer l'historique ?" },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.deleteHistory();
            }
        });
    }
}
