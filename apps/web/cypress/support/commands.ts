const API_BASE = Cypress.env('API_URL') || 'http://localhost:3001/api/v1';

function loginViaUI(email: string, password: string) {
  cy.visit('/login');
  cy.get('input[name="email"]').should('be.visible').type(email);
  cy.get('input[name="password"]').should('be.visible').type(password);
  cy.get('button[type="submit"]').should('not.be.disabled').click();
}

Cypress.Commands.add('login', (email: string, password: string) => {
  loginViaUI(email, password);
});

Cypress.Commands.add('loginAsAdmin', () => {
  loginViaUI('admin@acme-corp.com', 'Password1');
  cy.url({ timeout: 15000 }).should('include', '/dashboard');
});

Cypress.Commands.add('loginAsContractor', () => {
  loginViaUI('john.smith@example.com', 'Password1');
  cy.url({ timeout: 15000 }).should('include', '/portal');
});
