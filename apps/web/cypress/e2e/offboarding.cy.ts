describe('Offboarding', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('displays the offboarding list page', () => {
    cy.visit('/offboarding');
    cy.contains('Offboarding').should('be.visible');
  });

  it('shows offboarding workflows from seed data', () => {
    cy.visit('/offboarding');
    // Should see at least one workflow from seed data
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });

  it('filters offboarding by status', () => {
    cy.visit('/offboarding');
    // Click a status filter tab
    cy.contains('button', 'In Progress').click();
    cy.get('table').should('exist');
  });

  it('navigates to offboarding detail', () => {
    cy.visit('/offboarding');
    cy.get('table tbody tr').first().find('a').first().click();
    cy.url().should('match', /\/offboarding\/[a-f0-9-]+/);
  });

  it('shows checklist on offboarding detail page', () => {
    cy.visit('/offboarding');
    cy.get('table tbody tr').first().find('a').first().click();
    cy.contains('Checklist').should('be.visible');
    // Should show checklist items
    cy.contains(/revoke|retrieve|process|archive/i).should('exist');
  });
});
