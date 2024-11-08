describe('App Component Form Test', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should create a local party', () => {
        cy.wait(2000);

        // MAKE LOTS OF REQUEST TO THE BACKEND
        // HOPE THE NETWORK SURVIVE!! :) 
        for(let i = 0; i < 10; i++) { 
            cy.request('GET', 'http://localhost:3000/api/db/quiz/').as('getQuiz').wait(200);
        }

        cy.get('body > app-root > app-main-page > div > section > div > button:nth-child(2)').click();
        cy.wait(2000);

        cy.get(
            'body > app-root > app-game-creation-page > div > app-quiz-creation-list > div > div.list-element-container > app-quiz-creation-list-element > mat-card',
        ).click();
        cy.wait(2000);

        cy.get(
            'body > app-root > app-game-creation-page > div > app-quiz-creation-list > div.detail > div > button.button-box.mdc-button.mdc-button--raised.mat-mdc-raised-button.mat-primary.mat-mdc-button-base',
        ).click();
        cy.wait(2000);

        cy.get(
            'body > app-root > app-game-page > div > div > app-game-space > div > div.main-content > app-game-choice > div > mat-grid-list > div > mat-grid-tile:nth-child(1) > div > mat-card',
        ).click();
        cy.wait(2000);

        cy.get('body > app-root > app-game-page > div > app-game-footer > mat-card > mat-card-content > div > div.button-container > button').click();
    });
});
