// This file exists so Turbopack never statically traces docusign-esign.
// The dynamic require below is resolved at runtime by Node.js, not bundled.
module.exports = require("docusign-esign");
