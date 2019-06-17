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

    await controller.newPage("https://das.th-koeln.de");
})();  