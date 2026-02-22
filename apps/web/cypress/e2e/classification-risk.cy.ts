describe('Classification Risk', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('displays the classification dashboard', () => {
    cy.visit('/classification');
    cy.contains(/classification|risk/i).should('be.visible');
  });

  it('shows risk distribution summary', () => {
    cy.visit('/classification');
    // Dashboard should show risk level categories
    cy.contains(/low|medium|high|critical/i).should('exist');
  });

  it('shows top risk contractors', () => {
    cy.visit('/classification');
    // Should list contractors with risk scores
    cy.get('a[href*="/contractors/"]').should('have.length.at.least', 1);
  });

  it('navigates to contractor risk detail from dashboard', () => {
    cy.visit('/classification');
    cy.get('a[href*="/contractors/"]').first().click();
    cy.url().should('match', /\/contractors\/[a-f0-9-]+/);
  });
});
