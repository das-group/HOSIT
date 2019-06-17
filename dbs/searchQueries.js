const Functions = require("../include/functions");

// Active the line below for debugging the script
/*if(typeof global.BrowsimitateSettings === "undefined")
  global.BrowsimitateSettings = require("../include/settings");*/

const Settings = global.BrowsimitateSettings;

// duration of how long the search query array should be cached
// (7200000 = 2 hours)
const CACHE_DURATION = 7200000;

// Crawled list of celebrities covered in German media from December 2017
const celebrities = ["Anna Angelina Wolfers", "Zooey Deschanel", "Claudia Schiffer", "Nela Lee ", "Kirsten Dunst ", "Jennifer Aniston", "Blake Lively", "Emma Watson", "Palina Rojinski", "Leighton Meester",
  "Luisa Hartema", "Barbara Meier", "Penelope Cruz ", "Mila Kunis", "Reese Witherspoon", "Toni Garrn ", "Rachel Bilson", "Nina Dobrev", "Natalie Portman", "Lena Gercke",
  "Ashley Greene", "Jennifer Lawrence", "Julia Stegner", "Beyoncé Knowles", "Selena Marie Gomez", "Keira Knightley", "Anne Hathaway", "Cameron Diaz ", "Diane Kruger ", "Eva Longoria",
  "Lauren Conrad", "Hilary Duff ", "AnnaSophia Robb ", "Angelina Jolie", "Charlize Theron", "Jessica Biel ", "Eva Mendes ", "Amber Heard ", "Liv Tyler", "Lea Michele",
  "Olivia Palermo", "Ashley Olsen ", "Gisele Bündchen", "Mary-Kate Olsen", "Katy Perry", "Alyssa Milano", "Marion Cotillard", "Sara Nuru", "Lily Collins", "Emma Roberts",
  "Kate Hudson", "Julia Stegner", "Elizabeth Chase Olsen ", "Evan Rachel Wood ", "Paris Hilton", "Christina Aguilera", "Jessica Karen Szohr", "Dita Von Teese", "Camilla Belle ", "Aimee Duffy",
  "Taylor Momsen", "Kristen Stewart", "Britney Spears ", "Michelle Trachtenberg ", "Heidi Klum", "Gwyneth Paltrow ", "Avril Lavigne", "Milla Jovovich", "Maggie Gyllenhaal", "Alexa Chung",
  "Kate Bosworth ", "Mischa Barton", "Juno Temple", "Pixie Lott", "Poppy Delevigne", "Gillian Zinser", "Clemence Poesy", "Gwen Stefani ", "Gemma Ward", "Jessica Schwarz",
  "Jessica Simpson", "Lily Donaldson ", "Julia Restoin Roitfeld", "Johanna Klum", "Hilary Swank", "Margherita Missoni ", "Franziska Knuppe", "Kate Moss ", "Mélanie Laurent", "Rooney Mara",
  "Mandy Bork ", "Michelle Williams", "Carey Mulligan", "Daisy Lowe", "Jessica Joffe ", "Hadnet Tesfai", "Agyness Deyn", "Lydia Hearst ", "Naomi Campbell ", "Florence Welch",
  "Dave Gahan", "Johannes Strate", "Bill Kaulitz", "Patrick Dempsey", "Florian David Fitz", "Jared Leto ", "Johnny Depp", "Ryan Gosling", "George Clooney", "Brad Pitt",
  "Leonardo DiCaprio", "Ian Somerhalder", "Channing Tatum", "Bradley Cooper", "Jake Gyllenhaal", "Jeremy Lee Renner ", "Gerard Butler", "Eric Dane", "Chace Crawford", "Zac Efron",
  "Justin Bieber", "Orlando Bloom", "Mats Hummels", "Jesse Williams", "Ryan Reynolds", "Ed Westwick", "Douglas Booth", "Johannes Huebl", "Ben Barnes", "Alex Pettyfer",
  "James Franco", "Justin Timberlake", "Chris Hemsworth ", "Adam Levine", "Taylor Lautner", "Ashton Kutcher", "Roman Lob ", "Garrett Hedlund ", "Ken Duken", "Cro",
  "Joe Manganiello ", "Alexander Fehling", "Jan Delay", "Robert Pattinson", "Tom Schilling", "Penn Badgley", "Joseph Gordon-Levitt ", "Brandon Flowers", "Alexander Skarsgard", "Andrew Garfield",
  "Michael Fassbender", "Taylor Kitsch ", "Jason Segel ", "Hugh Dancy", "Mario Gomez ", "Jon Kortajarena", "Bruno Mars", "Roger Federer", "Hugh Laurie", "Tom Hardy",
  "Markus Lanz", "Kellan Lutz", "Harry von Wales", "Jan Böhmermann ", "Sam Riley ", "Xavier Naidoo ", "James Tupper", "Caleb Followill", "Aaron Taylor-Johnson", "Jamie Bell",
  "Alex Watson", "Jesse Eisenberg", "Daniel Radcliffe", "Mark Ronson", "Jason Schwartzman", "Vladimir Restoin Roitfeld", "Elyas M'Barek", "Klaas Heufer-Umlauf", "Joko Winterscheidt", "Matthias Schweighöfer"];


/**
 * Includes functions which return generated search queries.
 * Uses {@link SearchQueryGenerator}.
 */
class SearchQueries {

  /**
   * Returns search query generated of the spiegelonline evaluator
   * (see {@link SearchQueryEvaluators} for details)
   *
   * @return {String}  Search query
   */
  static async getRandomQuery() {
    return this.getQuery("spiegelonline");
  }

  /**
   * Returns search query generated of the facebook evaluator
   * (see {@link searchQueryEvaluators} for details)
   *
   * @return {String}  Search query
   */
  static async getFacebookQuery() {
    if(Functions.getRandomBoolean(0.6)) {
      // Get random name of the celebrity list
      return celebrities[Functions.getRandomNumber(celebrities.length, 0)].toLowerCase();
    }
    else {
      // Get current term out of the Google Hot Top 20
      return this.getQuery("facebook");
    }
  }


  /**
   * Returns search query generated of the a given search query evaluator
   * (see {@link searchQueryEvaluators} for details)
   *
   * @param  {String} generatorName Name of the search query generator defined
   * inside the Framework Settings (for default values see include/settings.js).
   * The function SearchQueryGenerator.getQueries is called with the parameters
   * defined in the settings.
   * @return {String}               Search query randomly selected of returned
   * array of the called search query generator
   */
  static async getQuery(generatorName) {
    return new Promise(function(fulfill, reject) {
      var queries = (async() => {
        // Get parameters of Generator
        let params = Settings.SEARCH_QUERY_GENERATORS[generatorName];

        // Call Generator with retrieved parameters and
        // get all queries
        let queries = await SearchQueryGenerator.getQueries(
          params.rssFeedURL,
          params.cacheFileName,
          params.queryArrayObject,
          params.evaluationFunction
        );

        // Select random query out of the array
        const randomInt = Functions.getRandomNumber(queries.length);

        // Return the query
        fulfill(queries[randomInt]);
      })();
    });
  }
}

module.exports = SearchQueries;

/**
 * Class for the generic search query generator
 */
class SearchQueryGenerator {

  /**
   * Fetch RSS and generate an array containing generated search queries
   * out of the feed with its evaluationFunction.
   *
   * @param  {String} rssFeedURL       URL of RSS feed which should be parsed
   * @param  {String} cacheFileName      File name of the cache file which is
   * generated inside the tmp-folder of the project
   * @param  {Object} queryArrayObject   Array object which should contain the
   * contents of the generated array. The contents will be written to this
   * object.
   * @param  {Function} evaluationFunction=evaluateNormal
   * Function which should evaluate every single item of the RSS feed. The
   * function has to return a string of the generated search query out of the
   * item. Function has to be: Function(item) -> string
   * @return {Array}                    Array with generated search queries
   */
  static async getQueries(rssFeedURL, cacheFileName, queryArrayObject, evaluationFunction) {
    // Add tmp-folder to file name
    cacheFileName = '../tmp/'+cacheFileName;

    return new Promise(function(fulfill, reject) {

      // Create query array if not done before
      if(typeof queryArrayObject === "undefined") {
        // Get cached query array first
        try {
          var cachedQueries = require(cacheFileName);
        }
        catch (e){ }

        let now = new Date().getTime();

        // Create new cache if cache doesn't exist or is too old
        if(typeof cachedQueries === "undefined" || !cachedQueries.hasOwnProperty(queries) || (now - cachedQueries.lastFetch) > CACHE_DURATION) {
          var FeedParser = require('feedparser');
          var request = require('request'); // for fetching the feed

          var req = request(rssFeedURL);
          var feedparser = new FeedParser(req);

          req.on('error', function (error) {
            // handle any request errors
          });

          req.on('response', function (res) {
            var stream = this; // `this` is `req`, which is a stream

            if (res.statusCode !== 200) {
              this.emit('error', new Error('Bad status code'));
            }
            else {
              stream.pipe(feedparser);
            }
          });

          feedparser.on('error', function (error) {
            // always handle errors
          });

          var queries = [];
          feedparser.on('readable', function () {
            var stream = this;
            var meta = this.meta;
            var item;

            // Read every line of the feed
            while (item = stream.read()) {
              // Generate query with the corresponding
              // evaluation function
              let query = evaluationFunction(item);

              if(query.length > 0)
                queries.push(query);
            }
          });

          req.on('end', function() {
            // Generate cache object
            let cachedQueries = {};
            cachedQueries.lastFetch = now;
            cachedQueries.queries = queries;

            // Save cache object in file
            let fs = require('fs');
            let path = require('path');
            fs.writeFile(path.resolve(__dirname+"/"+cacheFileName+".js"), "module.exports = "+JSON.stringify(cachedQueries)+";", function(err) {
              if(err) {
                return console.log(err);
              }
            });

            queryArrayObject = queries;

            // Return query array
            fulfill(queryArrayObject);
          });
        }
        else { // Cache exists and is not too old
          // Return query array
          queryArrayObject = cachedQueries.queries;
          fulfill(queryArrayObject);
        }
      }
      else { // Query array already defined
        // Return query array
        fulfill(queryArrayObject);
      }
    });
  }
}

// Testing function to check the results returned by the query generator
/*var test = async function() {
  console.log(await SearchQueries.getRandomQuery());
}

test();*/
