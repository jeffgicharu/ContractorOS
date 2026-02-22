describe('Invoice Workflow', () => {
  describe('Admin view', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('displays the invoice list page', () => {
      cy.visit('/invoices');
      cy.contains('Invoices').should('be.visible');
      cy.get('table tbody tr').should('have.length.at.least', 1);
    });

    it('filters invoices by status tab', () => {
      cy.visit('/invoices');
      // Click "Paid" tab
      cy.contains('button', 'Paid').click();
      // Results should update (or show empty state)
      cy.get('table').should('exist');
    });

    it('navigates to invoice detail page', () => {
      cy.visit('/invoices');
      cy.get('table tbody tr').first().click();
      cy.url().should('match', /\/invoices\/[a-f0-9-]+/);
    });

    it('shows invoice detail with timeline', () => {
      cy.visit('/invoices');
      cy.get('table tbody tr').first().click();
      // Invoice detail page should show timeline section
      cy.contains(/status|timeline|history/i).should('exist');
    });
  });

  describe('Contractor portal view', () => {
    beforeEach(() => {
      cy.loginAsContractor();
    });

    it('displays portal invoice list', () => {
      cy.visit('/portal/invoices');
      cy.contains('Invoices').should('be.visible');
    });

    it('shows create invoice button', () => {
      cy.visit('/portal/invoices');
      cy.contains(/new|create/i).should('exist');
    });
  });
});
