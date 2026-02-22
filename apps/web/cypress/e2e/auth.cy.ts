describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('shows the login form', () => {
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Sign In');
  });

  it('shows validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    // Zod validation should show errors
    cy.contains('email').should('exist');
  });

  it('shows error for invalid credentials', () => {
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('WrongPassword1');
    cy.get('button[type="submit"]').click();
    // API should return error
    cy.contains(/invalid|incorrect|failed/i).should('be.visible');
  });

  it('admin login redirects to /dashboard', () => {
    cy.get('input[name="email"]').type('admin@acme-corp.com');
    cy.get('input[name="password"]').type('Password1');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('contractor login redirects to /portal', () => {
    cy.get('input[name="email"]').type('john.smith@example.com');
    cy.get('input[name="password"]').type('Password1');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/portal');
  });

  it('protected routes redirect to login when not authenticated', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
