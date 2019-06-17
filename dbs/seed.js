/**
 * Defines global seed for usage of the random number generator
 * Seed is taken from the search query generator
 */

(async() => {
  // Define global seed if not defined before
  if(typeof global.SEED === "undefined") {
    const SearchQueries = require("../dbs/searchQueries");

    global.SEED = await SearchQueries.getRandomQuery();

    // Write now generated seed into file
    let fs = require('fs');
    let path = require('path');
    fs.writeFile(path.resolve(__dirname+"/../tmp/lastSeed.js"), "module.exports = '"+global.SEED+"';", function(err) {
        if(err) {
            return console.log(err);
        }
    });

    //console.log("new Seed: "+global.SEED);
  }
})();
