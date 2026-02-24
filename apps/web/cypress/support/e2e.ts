import './commands';

// Ignore React hydration errors in production builds — these don't affect
// functionality as React reconciles differences client-side.
// See: https://docs.cypress.io/api/events/catalog-of-events#uncaught-exception
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('Minified React error #418') ||
    err.message.includes('Minified React error #423')
  ) {
    return false;
  }
});
