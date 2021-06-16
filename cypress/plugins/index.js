const makeCljsPreprocessor = require('cypress-clojurescript-preprocessor');
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('file:preprocessor', makeCljsPreprocessor(config));
};
