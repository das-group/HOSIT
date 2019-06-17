/**
 * Settings.js
 * Settings
 */

// Show Debug messages in Commandline
module.exports.DEBUG = true;

// User agent string used in each browser session
//module.exports.USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3253.3 Safari/537.36";
module.exports.USER_AGENT = "";

// Width and height of browser window
module.exports.VIEWPORT = {
  width: 1366,
  height: 768
};
module.exports.WINDOW_SIZE = "" + module.exports.VIEWPORT.width + "," + module.exports.VIEWPORT.height;

// Anti-Captcha API Key (needed for CAPTCHA solving)
module.exports.ANTICAPTCHA_KEY = "ENTER YOUR ANTI-CAPTCHA KEY HERE";

// Parameters for Screenshots
// see the the Puppeteer documentation for more Information:
//
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagescreenshotoptions
module.exports.SCREENSHOT_PARAMS = {
  type: "jpeg",
  quality: 75
};

// List of search query generators (name of the generator with the corresponding
// paremeters)
// The function SearchQueryGenerator.getQueries is called with the parameters
// defined in the settings.
module.exports.SEARCH_QUERY_GENERATORS = {
  "spiegelonline": {
    rssFeedURL: 'http://www.spiegel.de/schlagzeilen/tops/index.rss',
    cacheFileName: "spiegelQueries",
    queryArrayObject: global.SPIEGEL_QUERIES,
    evaluationFunction: require("../class/searchQueryEvaluators").evaluateSPON
  },
  "facebook": {
    rssFeedURL: 'https://trends.google.com/trends/hottrends/atom/feed?pn=p15',
    cacheFileName: "facebookQueries",
    queryArrayObject: global.FACEBOOK_QUERIES,
    evaluationFunction: require("../class/searchQueryEvaluators").evaluateNormal
  }
}

// Set default search query generator
module.exports.SEARCH_QUERY_GENERATORS.default = module.exports.SEARCH_QUERY_GENERATORS.facebook;