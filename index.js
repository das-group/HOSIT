global.BrowsimitateSettings = require("./include/settings.js");

// Set Settings globally to enable access via the function class (Bad practice)
exports.Settings = global.BrowsimitateSettings;
exports.Controller = require("./class/controller.js");
exports.Functions = require("./include/functions.js");
exports.Identity = require("./class/identity.js");
