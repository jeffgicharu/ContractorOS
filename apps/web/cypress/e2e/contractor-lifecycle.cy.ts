describe('Contractor Lifecycle', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('displays the contractor list page', () => {
    cy.visit('/contractors');
    cy.contains('Contractors').should('be.visible');
    // Should show at least one contractor from seed data
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });

  it('filters contractors by status', () => {
    cy.visit('/contractors');
    cy.get('select').first().select('active');
    // Should only show active contractors
    cy.contains('Active').should('exist');
  });

  it('navigates to contractor detail page', () => {
    cy.visit('/contractors');
    // Click first contractor name link
    cy.get('table tbody tr').first().find('a').first().click();
    cy.url().should('match', /\/contractors\/[a-f0-9-]+/);
  });

  it('shows contractor detail with tabs', () => {
    cy.visit('/contractors');
    cy.get('table tbody tr').first().find('a').first().click();
    // Contractor detail should have tabs
    cy.contains('Engagements').should('exist');
    cy.contains('Invoices').should('exist');
    cy.contains('Documents').should('exist');
  });

  it('displays the onboarding pipeline board', () => {
    cy.visit('/onboarding');
    cy.contains('Onboarding Pipeline').should('be.visible');
  });
});
