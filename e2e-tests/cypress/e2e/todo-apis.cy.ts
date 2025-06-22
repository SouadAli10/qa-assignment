describe('Todo API Tests', () => {
  const servers = [
    {
      api: Cypress.env('golangAPI'),
      name: 'Golang'
    },
    {
      api: Cypress.env('nodeAPI'),
      name: 'Node'
    }
  ];

  servers.forEach((server) => {
    context(`Tests for ${server.name} backend`, function () {
      const baseUrl = new URL(server.api).origin;
      const todosEndpoint = `${baseUrl}/api/todos`;

      before(() => {
        cy.request({
          method: 'DELETE',
          url: `${baseUrl}/todos/delete-all`,
          failOnStatusCode: false
        }).then((res) => {
          expect([200, 204, 404]).to.include(res.status);
        });
      });

      it('Health check should return 200', () => {
        const healthUrl = `${baseUrl}/health`;
        cy.request(healthUrl).then((res) => {
          expect(res.status).to.eq(200);
        });
      });

      it('Should create a new todo', function () {
        cy.request('POST', todosEndpoint, {
          title: 'Learn Go Fiber',
          description: 'Build a REST API with Go Fiber framework',
          completed: false
        }).then((res) => {
          expect(res.status).to.eq(201);
          expect(res.body).to.have.property('id');
          expect(res.body.title).to.eq('Learn Go Fiber');
          this.createdTodoId = res.body.id; // Store ID in context
        });
      });

      it('Should get all todos', () => {
        cy.request(todosEndpoint).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.data || res.body).to.be.an('array'); // Compatible with wrapped/unwrapped
        });
      });

      it('Should filter todos by completed=false', () => {
        cy.request(`${todosEndpoint}?completed=false`).then((res) => {
          expect(res.status).to.eq(200);
          const todos = res.body.data || res.body;
          todos.forEach(todo => {
            expect(todo.completed).to.be.false;
          });
        });
      });

      it('Should search todos by keyword "fiber"', () => {
        cy.request(`${todosEndpoint}?search=fiber`).then((res) => {
          expect(res.status).to.eq(200);
          const todos = res.body.data || res.body;
          todos.forEach(todo => {
            expect(todo.title.toLowerCase()).to.include('fiber');
          });
        });
      });

      it('Should update the created todo', function () {
        const id = this.createdTodoId;
        expect(id).to.exist;

        cy.request('PUT', `${todosEndpoint}/${id}`, {
          title: 'Learn Go Fiber - Updated',
          completed: true
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.data?.title || res.body.title).to.eq('Learn Go Fiber - Updated');
          expect(res.body.data?.completed || res.body.completed).to.be.true;
        });
      });

      it('Should delete the created todo', function () {
        const id = this.createdTodoId;
        expect(id).to.exist;

        cy.request('DELETE', `${todosEndpoint}/${id}`).then((res) => {
          expect(res.status).to.eq(204);
        });

        cy.request({
          url: `${todosEndpoint}/${id}`,
          failOnStatusCode: false
        }).then((res) => {
          expect(res.status).to.eq(404);
        });
      });
    });
  });
});
