const API_BASE = Cypress.env('API_URL') || 'http://localhost:3001/api/v1';

// UI-based login — used by cy.login() for tests that exercise the login form itself.
function loginViaUI(email: string, password: string) {
  cy.visit('/login');
  cy.get('input[name="email"]').should('be.visible').type(email);
  cy.get('input[name="password"]').should('be.visible').type(password);
  cy.get('button[type="submit"]').should('not.be.disabled').click();
}

Cypress.Commands.add('login', (email: string, password: string) => {
  loginViaUI(email, password);
});

// Programmatic login via API request — avoids React hydration timing issues
// that cause empty form state when Cypress types before onChange is attached.
Cypress.Commands.add('loginAsAdmin', () => {
  cy.request({
    method: 'POST',
    url: `${API_BASE}/auth/login`,
    body: { email: 'admin@acme-corp.com', password: 'Password1' },
  });
  cy.visit('/dashboard');
  cy.url({ timeout: 15000 }).should('include', '/dashboard');
});

Cypress.Commands.add('loginAsContractor', () => {
  cy.request({
    method: 'POST',
    url: `${API_BASE}/auth/login`,
    body: { email: 'john.smith@example.com', password: 'Password1' },
  });
  cy.visit('/portal');
  cy.url({ timeout: 15000 }).should('include', '/portal');
});
