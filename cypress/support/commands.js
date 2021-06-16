// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('clearIndexedDB', async () => {
  const databases = await window.indexedDB.databases();

  await Promise.all(
    databases.map(
      ({ name }) =>
      new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase(name);

        request.addEventListener('success', resolve);
        // Note: we need to also listen to the "blocked" event
        // (and resolve the promise) due to https://stackoverflow.com/a/35141818
        request.addEventListener('blocked', resolve);
        request.addEventListener('error', reject);
      }),
    ),
  );
});
