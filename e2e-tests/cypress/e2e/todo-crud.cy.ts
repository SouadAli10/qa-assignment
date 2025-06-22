describe('Todo CRUD Operations', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  const openDialog = () => {
    cy.contains('button', 'Add Todo').click();
  };

  const servers = [
    {
      api: Cypress.env('golangAPI'),
      server: 'golang',
      name: 'Golang'
    },
    {
      api: Cypress.env('nodeAPI'),
      server: 'nodejs',
      name: 'Node'
    }
  ];
  servers.forEach((server) => {
    context(`Tests for Ui with ${server.name} backend`, function () {
      const serverURL = new URL(server.api).origin;

      before(() => {
        cy.request({
          method: 'GET',
          url: `${serverURL}/api/todos`,
          failOnStatusCode: false
        }).then((res) => {
          expect(res.status).to.eq(200);
          const todos = res.body.data || res.body;

          if (Array.isArray(todos) && todos.length > 0) {
            cy.request({
              method: 'DELETE',
              url: `${serverURL}/api/todos/delete-all`,
              failOnStatusCode: false
            }).then((deleteRes) => {
              expect([200, 204, 404]).to.include(deleteRes.status);
            });
          }
        });
      });


      beforeEach(() => {
        cy.setBackEndUsed(server.server);
      });

      it('should create a new todo', () => {
        openDialog();
        const todoTitle = 'Test Todo ' + Date.now();
        const todoDescription = 'This is a test todo description';

        // Fill the form
        cy.get('input[placeholder="e.g. Finish QA report"]').type(todoTitle);
        cy.get('textarea[placeholder="Add any extra details..."]').type(todoDescription);

        // Submit the form
        cy.get('button[type="submit"]').contains('Create Todo').click();

        // Verify todo was created
        cy.contains(todoTitle).should('be.visible');
        cy.contains(todoDescription).should('be.visible');
      });

      it('should toggle todo completion status', () => {
        openDialog();
        const todoTitle = 'Toggle Test Todo ' + Date.now();

        // Create a todo
        cy.get('input[placeholder="e.g. Finish QA report"]').type(todoTitle);
        cy.get('button[type="submit"]').contains('Create Todo').click();

        // Find the todo container
        cy.contains('label', todoTitle).parents('.flex.items-center').as('todoItem');

        // Find the checkbox and label within the container
        cy.get('@todoItem').find('button[role="checkbox"]').as('checkbox');
        cy.get('@todoItem').find('label').as('label');

        // Initially unchecked
        cy.get('@checkbox').should('have.attr', 'data-state', 'unchecked');

        // Toggle to completed
        cy.get('@checkbox').click();
        cy.get('@checkbox').should('have.attr', 'data-state', 'checked');
        cy.get('@label').should('have.class', 'line-through');

        // Toggle back to incomplete
        cy.get('@checkbox').click();
        cy.get('@checkbox').should('have.attr', 'data-state', 'unchecked');
        cy.get('@label').should('not.have.class', 'line-through');
      });

      it('should delete a todo', () => {
        openDialog();
        const todoTitle = 'Delete Test Todo ' + Date.now();

        // Create a todo
        cy.get('input[placeholder="e.g. Finish QA report"]').type(todoTitle);
        cy.get('button[type="submit"]').contains('Create Todo').click();

        // Verify todo exists
        cy.contains(todoTitle).should('be.visible');

        // Open dropdown and click delete
        cy.contains('.flex.items-center', todoTitle).find('button[aria-haspopup="menu"]').click();
        cy.contains('[role="menuitem"]', 'Delete').click();

        // Confirm deletion in dialog
        cy.contains('button', 'Continue').click();

        // Verify todo was deleted
        cy.contains(todoTitle).should('not.exist');
      });

      it('should show validation error if title is empty', () => {
        openDialog();

        // Try to submit with empty title
        cy.get('button[type="submit"]').contains('Create Todo').click();

        // Check for validation message
        cy.contains('Title is required').should('be.visible');

        // Add title
        cy.get('input[placeholder="e.g. Finish QA report"]').type('Test');

        // Validation message should disappear
        cy.contains('Title is required').should('not.exist');
      });

    });
  });


});