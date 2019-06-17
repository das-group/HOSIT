/**
 * Example script to test functionality of the framework
 */

(async () => {
  // Import module
  const HOSIT = require("hosit-browser")

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
  await controller.typeSearchQuery("input[type='text']");

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