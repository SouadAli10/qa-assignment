// cypress/support/index.ts

Cypress.Commands.add('setBackEndUsed', (backend = 'nodejs') => {
  window.localStorage.setItem('selectedBackend', backend);
});

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to set the backend used in local storage.
       * @example cy.setBackEndUsed('python')
       */
      setBackEndUsed(backend?: string): Chainable<void>;
    }
  }
}

export {}; // Ensures this file is treated as a module
