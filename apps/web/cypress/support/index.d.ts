declare namespace Cypress {
  interface Chainable {
    /**
     * Log in via API and set auth token.
     */
    login(email: string, password: string): Chainable<void>;

    /**
     * Log in as the seeded admin user.
     */
    loginAsAdmin(): Chainable<void>;

    /**
     * Log in as the seeded contractor user.
     */
    loginAsContractor(): Chainable<void>;
  }
}
