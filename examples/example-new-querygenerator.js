/**
 * Example script to test functionality of the framework with the addition
 * of a new custom query generator
 */

(async () => {
  // Import module
  const HOSIT = require("hosit-browser")

  let trendsus = {
    rssFeedURL: 'https://trends.google.com/trends/hottrends/atom/feed?pn=p1',
    cacheFileName: "trendsusQueries",           // Name of the cache file created in tmp-folder
    queryArrayObject: global.TRENDSUS_QUERIES,  // our Array object where we're saving the queries
    evaluationFunction: function(item) {        // Function which evaluates every feed item and generates the query for it
      // Writes item title in upper case for fun
      return item.title.toUpperCase();
    }
  };

  HOSIT.Settings.SEARCH_QUERY_GENERATORS.hottrends = trendsus;

  // Define identity
  const testidentity = new HOSIT.Identity("Firstname", "Lastname", new Date(1992, 5, 19),
    "email@address.com", "PASSW0RD", "Company", "Position", 456, 265,
    global.GENDER_MALE);

  // Initiate controller with test identity
  const controller = await new HOSIT.Controller(testidentity);

  // Start browser session and open new tab
  await controller.init();

  // Open example.com
  await controller.goto("https://example.com");

  // Wait until "More Information"-Link is visible
  await controller.waitForSelector("a[href='http://www.iana.org/domains/example']");

  // Wait a random time period with the standard values
  await controller.randomWait();

  // Click on the "More Information"-Link
  await controller.click("a[href='http://www.iana.org/domains/example']");

  // Wait until the page is loaded
  await controller.waitForNavigation();

  // Wait a random time period with the standard values
  await controller.randomWait();

  // Open new page tab with example.net
  await controller.newPage("http://ixquick.com");

  // Wait around 5 seconds
  await controller.randomWait(5000);

  // Wait until the text field is loaded
  await controller.waitForSelector("input[type='text']");

  // Enter Stuff inside the text field
  await controller.type("input[type='text']", "Here is an example search query: ");
  await controller.typeSearchQuery("input[type='text']", "hottrends");

  // Wait around 5 seconds
  await controller.randomWait(5000);

  // Close the new Page tab
  await controller.closePage();

  // Wait around 5 seconds
  await controller.randomWait(5000);

  // Scroll to the bottom of the last opened page (Simulate reading)
  await controller.scrollToBottom();

  // Exit browser
  process.exit();
})();
