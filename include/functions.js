// Include Settings
const Settings = global.BrowsimitateSettings;


/**
 * Custom functions which enhance the Puppeteer standard functionality
 */
class Functions {

  /**
   * Searches tab with given url and returns this tab
   *
   * @param  {Browser} browser Browser element
   * @param  {string} url     Beginning of URL of targeted Tab
   * @return {Page}         Seite
   * @category static async
   */
  static async getPage(browser, url) {
    this.debugLog("getPage: " + url)
    let pages = await browser.pages();

    for (var i = 0; i < pages.length; i++) {
      let page = await pages[i];
      try {
        await page.setViewport(Settings.VIEWPORT);
        await page.setUserAgent(Settings.USER_AGENT);
      } catch (e) {}

      try {
        var pageTitle = await page.url();
      } catch (e) {
        var pageTitle = "";
      }
      if (pageTitle.includes(url)) {
        return page;
      }
    }
  }

  /**
   * Searches tab with given URL and closes this tab
   *
   * @param  {Browser} browser Browser-Element
   * @param  {string} url     Beginning of URL of targeted Page tab
   * @return {void}
   * @category static async
   */
  static async closePage(browser, url) {
    var page = await this.getPage(browser, url)
    await page.close();
  }


  /**
   * Opens new Page tab and opens the given url inside the tab. The new tab
   * is focused afterwards.
   *
   * @param  {Browser} browser  Browser object
   * @param  {string} url="" URL to be loaded. No page will be loaded if the
   * string is empty.
   * @return {Page}        The new Page tab
   * @category static async
   */
  static async newPage(browser, url = "") {
    // Create new Page
    let page = await browser.newPage();

    // Enable camouflage enhancements for new page tab
    await this._enableCamouflage(page);

    // Set page parameters to the values defined in the settings
    try {
      await page.setViewport(Settings.VIEWPORT);
      await page.setUserAgent(Settings.USER_AGENT);
    } catch (e) {}

    if (url != "") {
      // Open URL in tab
      await page.goto(url);
    }

    // Return the new tab
    return page;
  }

  /**
   * Enables additional protection mechanisms for the given page to reduce
   * possibilities for services to identify the headless browser
   *
   * @param  {Page} page Page object for which the mechanisms should be enabled
   * @return {void}
   * @category static async
   */
  static async _enableCamouflage(page) {
    let camouflage = function() {
      // Remove webdriver object from navigator
      const navigatorNew = navigator.__proto__;
      delete navigatorNew.webdriver;
      navigator.__proto__ = navigatorNew;
    };

    // Do camouflage on this page right now
    await page.evaluate(camouflage);

    // Enable camouflage for each now page
    await page.evaluateOnNewDocument(camouflage);
  }

  /**
   * Searches for inline frame with given URL start and returns the frame
   *
   * @param  {Page} page Page element
   * @param  {string} url Beginning of URL of targeted iFrame inside the current
   * page tab
   * @return {Frame}      Frame element
   * @category static async
   */
  static async getFrame(page, url) {
    this.debugLog("getFrame: " + url);

    // Get all child frames of page
    var childFrames = await page.mainFrame().childFrames();
    //console.log(childFrames);

    // Interate through all frames
    var frameUrl = "";
    for (var i = 0; i < childFrames.length; i++) {
      // Get URL of current frame
      frameUrl = await childFrames[i].url();

      // Return frame if it begins the searched URL
      if (typeof frameUrl !== 'undefined') {
        if (frameUrl.startsWith(url)) {
          this.debugLog("found: " + frameUrl);
          return childFrames[i];
        }
      }
    }
    this.debugLog("not found");

    // Return null if frame hasn't been found
    return null;
  }


  /**
   * Brings page to front (activates page tab)
   *
   * @param  {Page} page Page-Object
   * @return {void}
   * @category static async
   */
  static async bringToFront(page) {
    try {
      await page.bringToFront();
    } catch (e) {}
  }


  /**
   * Initialize Browser session or connects to active browser session
   * and opens new tab. Browser will be started in normal mode instead
   * of the headless mode.
   *
   * @param  {Puppeteer} puppeteer Puppeteer element
   * @param  {string} endpoint  Websocket-Endpoint. Browser session will
   * be initialized, if not set.
   * @param  {string} executablePath="" Path to a Chromium or Chrome executable
   * to run instead of the standard Chromium included in Puppeteer. Normal
   * bundled version will be started, if not set.
   *
   * @return {Object} Initialisiierungselemente [Page, Browser]
   * @category static async
   */
  static async init(puppeteer, endpoint, executablePath = "") {
    let USER_AGENT = Settings.USER_AGENT;
    const VIEWPORT = Settings.VIEWPORT;

    let browser = null;
    if (endpoint != null) {
      browser = await puppeteer.connect({
        browserWSEndpoint: endpoint
      });
    } else {
      // Set Puppeteer parameters
      let parameters = {
        headless: false,
        args: ["--window-size="+VIEWPORT.width+","+VIEWPORT.height]
      };

      // Add executablePath to parameters, if set
      if (executablePath !== "") {
        parameters.executablePath = executablePath;
      }

      browser = await puppeteer.launch(parameters);
    }

    const page = await browser.newPage();

    // Enable camouflage enhancements for new page tab
    await this._enableCamouflage(page);

    // If user agent is not set in the settings
    if (USER_AGENT === "") {
      // Take the standard user agent of the browser
      USER_AGENT = await page.evaluate(() => {
        return navigator.userAgent;
      });

      // Replace wording of HeadlessChrome to Chrome
      USER_AGENT = USER_AGENT.replace("HeadlessChrome", "Chrome");

      // Set USER_AGENT as Global setting
      global.BrowsimitateSettings.USER_AGENT = USER_AGENT;
    }

    await page.setViewport(VIEWPORT);
    await page.setUserAgent(USER_AGENT);

    // Execute the following commands whenever a new browser tab is opened
    browser.on("targetcreated", async function(target) {
      // If new page was created
      if(target.type() === "page") {
        // Get opened page
        let page = await target.page();

        // Enable camouflage enhancements for new page tab
        await Functions._enableCamouflage(page);

        // Set page parameters to the values defined in the settings
        try {
          await page.setViewport(Settings.VIEWPORT);
          await page.setUserAgent(Settings.USER_AGENT);
        } catch (e) {}
      }
    });

    return {
      "page": page,
      "browser": browser
    };
  }


  /**
   * Get selector of last visible Div-element
   * on the page
   *
   * @param  {Page} page Page object
   * @return {string}      Bottom selector
   * @category static async
   */
  static async getBottomSelector(page) {
    // Get all divs
    var selector = await page.$$eval('div', (divs) => {
      // Get last div element
      var last = divs.length - 1;
      do {
        var element = divs[last];
        last--;
        var idClass = "" + element.id + element.getAttribute('class');
        // Go one element backwards, if current element is not visible
      } while (element.offsetWidth == 0 && last > 0 || element.offsetHeight == 0 && last > 0 ||
        idClass.includes("google") || idClass.includes("ad") || idClass == "null"); // Exclude advertising elements

      // Use element, if visible

      // Build selector string
      var selector = "div";

      // Add id and class of element
      var divId = element.id;
      var divClass = element.getAttribute('class');
      if (divId != "")
        selector += "#" + divId;
      else if (divClass != null && typeof divClass !== "undefined")
        selector += "." + divClass.split(" ")[0]; // Only get first div
      //selector += ":last-child";

      return selector;
    });

    this.debugLog("getBottomSelector", selector);
    return selector;
  }


  /**
   * Get Href (link) content of targeted DOM element
   *
   * @param  {Page} page     page object
   * @param  {string} selector Selector of target
   * @return {string}          Href content
   * @category static async
   */
  static async getHref(page, selector) {
    await this.bringToFront(page);

    var href = "";
    try {
      var href = await page.$eval(selector, link => link.href)
    } catch (e) {}
    this.debugLog("getHref: " + href);
    return href;
  }


  /**
   * Hover over targeted element
   *
   * @param  {Page} page     Page object
   * @param  {string} selector Selector of target element
   * @return {void}
   * @category static async
   */
  static async hover(page, selector) {
    // Get first visible element
    const element = await page.$(selector);

    // Take screenshot of element
    const screenshot = await this.getScreenshot(element);

    this.debugLog("hover", selector, screenshot);
    try {
      await page.hover(selector);
    } catch (e) {
      await this.errorHandling(page, e);
    }
  }

  /**
   * Click on target element with random deviation around the click position
   * and error handling. Every click is saved as a screenshot.
   *
   * @param  {Page} page     Page element
   * @param  {string} selector Selector of target element
   * @param  {number} delay=true  Random delay between MouseDown und MouseUp event
   * @param  {Boolean} tap=false  Send touchscreen tap instead of MouseClick event
   * @param  {Boolean} topRight=false  Click inside of the top right corner instead
   * of the element's center.
   * @param  {Boolean} doTrigger=false  Manually trigger the click event via JavaScript
   * if error occurred (can happen, if Dropdown menu closed before the click has been
   * executed)
   * @return {void}
   * @category static async
   */
  static async click(page, selector, delay = true, tap = false, topRight = false, doTrigger = false) {
    await this.bringToFront(page);

    // Get element
    const element = await page.$(selector);
    const screenshot = await this.getScreenshot(element);
    var href = await this.getHref(page, selector);
    if (typeof href !== "undefined")
      href = ", href: " + href;
    else
      href = "";

    // Set delay time
    let params = {
      delay: this.getRandomTime(160, 20)
    };

    // Remove delay if parameter is set
    if (!delay) {
      params = {};
    }

    this.debugLog("click", selector + href + ", topRight: " + topRight, screenshot);
    try {
      // Get bounding box of element
      let boundingBox = await element.boundingBox();
      let width = boundingBox.width;
      let height = boundingBox.height;

      this.debugLog(JSON.stringify(boundingBox));

      if (width > 16 && height > 16) {
        let halfWidth = width / 2;
        let halfHeight = height / 2;

        // Calculate random click position inside the allowed clicking
        // area of the element (1/4 around the element center).
        let x = boundingBox.x + this.getRandomNumber(halfWidth + width / 8, halfWidth - width / 8);
        let y = boundingBox.y + this.getRandomNumber(halfHeight + height / 8, halfHeight - height / 8);

        if (topRight) {
          // Calculate random click position on the top right corner, if
          // parameter is set
          x = boundingBox.x + this.getRandomNumber(width, width - width / 8);
          y = boundingBox.y + this.getRandomNumber(height, height - height / 8);
        }

        if (!tap) {
          this.debugLog("clickPos in boundingBox", "" + (x - boundingBox.x) + ", " + (y - boundingBox.y));
          await page.mouse.click(x, y, params);
        } else {
          this.debugLog("TapPos in boundingBox", "" + (x - boundingBox.x) + ", " + (y - boundingBox.y));
          await page.touchscreen.tap(x, y);
        }
      } else {
        // Perform standard center click or tap, if element is smaller than
        // 16x16 pixels
        if (!tap) {
          await page.click(selector, params);
        } else {
          await page.tap(selector);
        }
      }
    } catch (e) {
      if (doTrigger)
        await this.triggerClick(page, selector);
      else
        await this.errorHandling(page, e);
    }
  }


  /**
   * Click on target element with error handling. Version for iFrame.
   *
   * @param  {Frame} frame     Frame element
   * @param  {string} selector Selector of target element
   * @return {void}
   * @category static async
   */
  static async clickFrame(frame, selector) {
    const element = await frame.$(selector);
    const screenshot = await this.getScreenshot(element);
    var href = await this.getHref(frame, selector);
    if (href != "")
      href = ", href: " + href;

    this.debugLog("clickFrame", selector + href, screenshot);
    try {
      // Get element of selector and perform click
      const element = await frame.$(selector);
      element.click();
    } catch (e) {
      await this.errorHandling(frame, e);
    }
  }


  /**
   * Exit program without error
   *
   * @return {void}
   * @category static async
   */
  static async exit() {
    // If global logger exists, create entry.
    if (typeof global.logger !== "undefined") {
      await global.logger.newLog("exit", "true");
    }

    await process.exit();
  }

  /**
   * Wait for visibility of selector with error error handling
   *
   * @param  {Page} page     Page element
   * @param  {string} selector Selector of target element
   * @param  {boolean} doThrow throws an error instead of invoking the internal
   * errorHandling function
   * @return {void}
   * @category static async
   */
  static async waitForSelector(page, selector, doThrow = false) {
    this.debugLog("waitForSelector", selector);
    try {
      await page.waitForSelector(selector, {
        visible: true
      });
    } catch (e) {
      if (doThrow)
        throw e;
      else
        await this.errorHandling(page, e);
    }
  }


  /**
   * Selects value of dropdown list with error handling
   *
   * @param  {Page} page     Page element
   * @param  {string} selector Selector of target element
   * @param  {string} value    Selection value of target value (value="VALUE")
   * @return {void}
   * @category static async
   */
  static async select(page, selector, value) {
    this.debugLog("Select", selector + ', Value: ' + value);
    try {
      await page.select(selector, value);
    } catch (e) {
      await this.errorHandling(page, e);
    }
  }


  /**
   * Selects value of dropdown list with error handling
   * Version for iFrames
   *
   * @param  {Frame} frame     Frame element
   * @param  {string} selector Selector of target element
   * @param  {string} value    Selection value of target value (value="VALUE")
   * @return {void}
   * @category static async
   */
  static async selectFrame(frame, selector, value) {
    this.debugLog("Select", selector + ', Value: ' + value);
    try {
      await frame.select(selector, value);
    } catch (e) {
      await this.errorHandling(frame, e);
    }
  }


  /**
   * Types inside the target input element with randomized typing delays
   *
   * @param  {Page} page       Page element
   * @param  {string} selector   Selector ot the target input element. If the
   * selector is not given, the typing events will be executed without focusing
   * the input element.
   * @param  {string} text       Text which should be entered
   * @param  {number} time=456   Average typing delay in milliseconds
   * @param  {number} random=265 Random deviation from average typing delay
   * in milliseconds
   * @return {void}
   * @category static async
   */
  static async type(page, selector = "", text, time = 456, random = 265) {
    this.debugLog("Type", text + ", selector: " + selector);
    while (text.length > 0) {
      // Take first character of text
      var char = text.substr(0, 1);

      // Wait a little bit longer if it is the @ character
      if (char === '@') {
        await this.randomWait(page, time / 4, random / 4);
      }

      // Cut first character from text
      text = text.substr(1);

      // Type character
      try {
        if (selector === "")
          await page.keyboard.type(char);
        else
          await page.type(selector, char);
        this.debugLog("Type: " + char);
      } catch (e) { // Call error handling if error has occurred
        await this.errorHandling(page, e);
      }

      // Wait for random duration
      await this.randomWait(page, time, random);
    }
  }


  /**
   * Types inside the target input element with randomized typing delays
   * Version for iFrames
   *
   * @param  {Frame} Frame       Frame element
   * @param  {string} selector   Selector ot the target input element. If the
   * selector is not given, the typing events will be executed without focusing
   * the input element.
   * @param  {string} text       Text which should be entered
   * @param  {number} time=456   Average typing delay in milliseconds
   * @param  {number} random=265 Random deviation from average typing delay
   * @return {void}
   * @category static async
   */
  static async typeFrame(frame, selector, text, time = 456, random = 265) {
    this.debugLog("typeFrame", selector + ", text: " + text);

    const page = await frame.parentFrame();

    // Get defined element with selector and click the element to focus
    const element = await frame.$(selector);
    element.click();

    await this.randomWait(frame);

    while (text.length > 0) {
      // Take first character of text
      var char = text.substr(0, 1);

      // Cut first character from text
      text = text.substr(1);

      // Type character
      try {
        await element.type(char);
        this.debugLog("Type: " + char);
      } catch (e) { // Call error handling if error has occurred
        await this.errorHandling(frame, e);
      }

      // Wait for random duration
      await this.randomWait(page, time, random);
    }
  }


  /**
   * Presses Enter button with random press and release time
   *
   * @param  {Page} page Page element
   * @return {void}
   * @category static async
   */
  static async typeEnter(page) {
    const KEY_ENTER = 'Enter';
    this.debugLog("TypeEnter", "Enter");

    // Press enter button
    await page.keyboard.down(KEY_ENTER);
    //await page.keyboard.press(KEY_ENTER);
    await this.randomWait(page, 10, 5);
    await page.keyboard.up(KEY_ENTER);
  }


  /**
   * Presses Tab button
   *
   * @param  {Page} page Page element
   * @return {void}
   * @category static async
   */
  static async typeTab(page) {
    const KEY_TAB = 'Tab';
    this.debugLog("TypeTab", "Tab");

    // Press tab
    await page.keyboard.down(KEY_TAB);
    await page.keyboard.up(KEY_TAB);
  }


  /**
   * Presses ESC button
   *
   * @param  {Page} page Page element
   * @return {type}
   * @category static async
   */
  static async typeEsc(page) {
    const KEY_ESC = 'Escape';
    this.debugLog("TypeEsc", "Esc");

    // Press ESC
    await page.keyboard.down(KEY_ESC);
    await page.keyboard.up(KEY_ESC);
  }

  /**
   * Presses ArrowUp or PageUp button with random delay
   *
   * @param  {Page} page Page element
   * @param  {boolean} pageUp=false Presses PageUp button
   * @return {void}
   * @category static async
   */
  static async typeUp(page, pageUp = false) {
    var pressTime = 15;
    const pressRandom = 5;

    var KEY_UP = 'ArrowUp';
    if (pageUp) {
      KEY_UP = "PageUp";
      pressTime = 0;
    }
    this.debugLog("TypeUp");

    // Press button
    await page.keyboard.down(KEY_UP);
    if (pressTime > 0) {
      await page.keyboard.press(KEY_UP);
      await this.randomWait(page, pressTime, pressRandom);
    }
    await page.keyboard.up(KEY_UP);
  }

  /**
   * Presses ArrowDown or PageDown button with random delay
   *
   * @param  {Page} page Page element
   * @param  {boolean} pageDown=false Presses PageDown button
   * @return {void}
   * @category static async
   */
  static async typeDown(page, pageDown = false) {
    var pressTime = 15;
    const pressRandom = 5;

    var KEY_DOWN = 'ArrowDown';
    if (pageDown) {
      KEY_DOWN = "PageDown";
      pressTime = 0;
    }
    this.debugLog("TypeDown");

    // Press button
    var time = pressTime;
    if (pressTime > 0)
      time = this.getRandomTime(pressTime, pressRandom);
    await page.keyboard.press(KEY_DOWN, {
      delay: time
    });
  }


  /**
   * Scrolls to given selector
   *
   * @param  {Page} page         Page object
   * @param  {string} stopSelector Selector to which the function should scroll
   * @param  {boolean} wait=true     Wait after half of page is scrolled
   * @return {void}
   * @category static async
   */
  static async scrollToSelector(page, stopSelector, wait = true, press = false) {
    this.debugLog("scrollToSelector", stopSelector);

    // Get horizontal scrolling distance to selector
    var scrollY = await this.getScrollY(page, stopSelector);

    // If selector is below our current position
    // then we have to scroll downwards
    if (!await this.isInViewport(page, stopSelector)) {
      await this.scrollDown(page, stopSelector, wait, press);
    } else {
      // Check, if selector is above our current position
      if (scrollY < 0) {
        // Scroll upwards
        await this.scrollUp(page, stopSelector, wait, press);
      }
    }
  }


  /**
   * Scrolls page up until the selector is visible
   *
   * @param  {Page} page          Page object
   * @param  {string} stopSelector  Selector to which the function should scroll up
   * @param  {boolean} wait=true     Wait after half of page is scrolled
   * @param  {boolean} press=false   true: Scrolling is achieved with long button press of page up-button,
   * false: Scrolling is achieved with several short arrow up button presses
   * @param  {number} minScrolls=11 Minimum number of keyboard presses for scrolling (if press=false)
   * @param  {number} maxScrolls=15 Maximum number of keyboard presses for scrolling (if press=false)
   * @return {void}
   * @category static async
   */
  static async scrollUp(page, stopSelector, wait = true, press = false, minScrolls = 11, maxScrolls = 15) {
    this.debugLog("scrollUp", stopSelector);

    if (stopSelector != "") {
      if (this.isSelectorVisible(page, stopSelector)) {
        var i = 0;
        var scrollYBefore = -999999999999; // Last Scrolling-Position
        do {
          this.debugLog("scrollYBefore: " + scrollYBefore);
          this.debugLog("scrollY" + await this.getScrollY(page, stopSelector));
          if (i > 100 || // Too many repetitions mean that the page content
            // has not moved since last iteration or that the scrolling behavior
            // is strange
            scrollYBefore >= await this.getScrollY(page, stopSelector))
            break; // abort

          scrollYBefore = await this.getScrollY(page, stopSelector);
          if (press) {
            // Scroll with page up button
            await typeUp(page, true);
          } else {
            // Do 11-15 button presses
            for (var j = 0; j < this.getRandomNumber(maxScrolls, minScrolls); j++) {
              await this.typeUp(page);
              await this.randomWait(page, 150, 50);
            }
          }
          i++;
          if (wait)
            await this.randomWait(page, 12000, 2000);
          var check = !await this.isInViewport(page, stopSelector, false);
        } while (check);
      } else {
        var e = {};
        e.message("Selector does not exist: " + stopSelector);
        await this.errorHandling(page, e);
      }
    }
  }


  /**
   * Scrolls page down until the selector is visible
   *
   * @param  {Page} page          Page object
   * @param  {string} stopSelector  Selector to which the function should scroll up
   * @param  {boolean} wait=true     Wait after half of page is scrolled
   * @param  {boolean} press=false   true: Scrolling is achieved with long button press of page down-button,
   * false: Scrolling is achieved with several short arrow down button presses
   * @param  {number} minScrolls=11 Minimum number of keyboard presses for scrolling (if press=false)
   * @param  {number} maxScrolls=15 Maximum number of keyboard presses for scrolling (if press=false)
   * @param  {number} minIterations=0 Minimum number of how many iterations this
   * scrolling have to be repeated (even if element has already been scrolled by)
   *
   * @return {void}
   * @category static async
   */
  static async scrollDown(page, stopSelector, wait = true, press = false, minScrolls = 11, maxScrolls = 15, minIterations = 0) {
    this.debugLog("scrollDown", stopSelector);

    if (stopSelector != "") {
      if (this.isSelectorVisible(page, stopSelector)) {
        var i = 0;
        var scrollYBefore = 999999999999; // Last Scrolling-Position

        var check = !await this.isInViewport(page, stopSelector);
        while (check || i < minIterations) {
          this.debugLog("scrollYBefore: " + scrollYBefore);
          this.debugLog("scrollY" + await this.getScrollY(page, stopSelector));
          if (i > 100 || // Too many repetitions mean that the page content
            // has not moved since last iteration or that the scrolling behavior
            // is strange
            scrollYBefore <= await this.getScrollY(page, stopSelector))
            break; // Abort

          scrollYBefore = await this.getScrollY(page, stopSelector);
          if (press) {
            // Scroll with page down button
            await this.typeDown(page, true);
          } else {
            // Do 11-15 button presses
            for (var j = 0; j < this.getRandomNumber(maxScrolls, minScrolls); j++) {
              await this.typeDown(page);
              await this.randomWait(page, 150, 50);
            }
          }

          i++;
          if (wait)
            await this.randomWait(page, 12000, 2000);
          check = !await this.isInViewport(page, stopSelector);
        }
      } else {
        var e = {};
        e.message("Selector does not exist: " + stopSelector);
        await this.errorHandling(page, e);
      }
    }
  }


  /**
   * Change HTML-DOM value (z.B. Textarea elements)
   *
   * @param  {Page} page        Page or frame element
   * @param  {string} selector  Selektor of target
   * @param  {Sting} text       Value text to which the selected element should
   * be changed
   * @return {void}
   * @category static async
   */

  static async setValue(page, selector, text) {
    this.debugLog("setValue", selector + ", text: " + text);
    try {
      await page.evaluate((selector, text) => {
        return document.querySelector(selector).value = text;
      }, selector, text);
    } catch (e) {
      await this.errorHandling(page, e);
    }
  }


  /**
   * Deactivate link invocation behavior inside the browser page with injection
   * of JavaScript
   *
   * @param  {Page} page     Page-Element
   * @param  {string} selector Target selector of link which should be deactivated
   * @return {void}
   * @category static async
   */
  static async deactivateLink(page, selector) {
    this.debugLog("deactivateLink", selector);
    try {
      await page.evaluate((selector) => {
        return document.querySelector(selector).addEventListener('click', function(event) {
          event.preventDefault();
        });
      }, selector);
    } catch (e) {
      await this.errorHandling(page, e);
    }
  }


  /**
   * Trigger click event manually via JavaScript code injection
   * (element does not have to be visible inside the browser)
   *
   * @param  {Page} page     Page element
   * @param  {string} selector Target selector to the (link/button) element
   * which should be triggered by the function
   * @return {void}
   * @category static async
   */
  static async triggerClick(page, selector) {
    this.debugLog("triggerClick", selector);
    try {
      await page.evaluate((selector) => {
        return document.querySelector(selector).click();
      }, selector);
    } catch (e) {
      await this.errorHandling(page, e);
    }
  }

  /**
   * Return random time
   *
   * @param  {number} time   Average time in milliseconds
   * @param  {number} random Maximum deviation from average time in milliseconds
   * @return {number}        Random number inside range [time +/- random]
   */
  static getRandomTime(time, random) {
    let randomTime = this.getRandomNumber(time + random, time - random);
    return randomTime;
  }

  /**
   * Return random number with seedrandom library
   *
   * @param  {number} to      To
   * @param  {number} from=0  From
   * @return {number}         Random number inside range [from-to]
   */
  static getRandomNumber(to, from = 0) {
    // Initialize random number generator
    let seedrandom = require("seedrandom");

    // Define seed for randomness as global object
    require("../dbs/seed");
    let seed = global.SEED;

    // Get last calculated seed of temporary file
    // if seed has not been defined before
    if (typeof seed === "undefined") {
      try {
        seed = require("../tmp/lastSeed");
      }
      // File not found - should only happen at first start during first
      // generation of lastSeed
      catch (e) {
        seed = "";
      }
    }

    // Initialize random generator with seed and additional
    // local entropy (current date etc.)
    let randomGenerator = seedrandom(seed, {
      entropy: true
    });

    // Generate random number
    let random = from + Math.floor((randomGenerator() * (to - from)));

    return random;
  }

  /**
   * Return random boolean value
   *
   * @param  {Number} truePercent=0.5   Probability for returning true
   * (comma value between 0 and 1)
   * @return {Boolean}
   */
  static getRandomBoolean(truePercent = 0.5) {
    const random = Math.random();
    if (random < truePercent)
      return true;
    else
      return false;
  }

  /**
   * Waits for random time range
   *
   * @param  {Page}    page          Page element
   * @param  {number}  time=2000     Average waiting time in milliseconds
   * @param  {number}  random=1000   Maximum deviation from average waiting time
   * in milliseconds
   * @return {void}
   * @category static async
   */
  static async randomWait(page, time = 2000, random = 1000) {
    let randomTime = this.getRandomTime(time, random);
    this.debugLog("wait: " + randomTime);

    // Set global control variable to check if an action has been already executed
    // before the timeout (for usage in controlStatus function).
    global.ACTION_SINCE_WAIT = true;
    await page.waitFor(randomTime);
  }


  /**
   * Waits for a random time (alternate implementation to the randomWait function
   * without page element)
   *
   * @param  {number}  time=2000     Average waiting time in milliseconds
   * @param  {number}  random=1000   Maximum deviation from average waiting time
   * @return {void}
   * @category static async
   */
  static async randomTimeout(time = 2000, random = 1000) {
    let randomTime = this.getRandomTime(time, random);
    this.debugLog("randomTimeout: " + randomTime);
    return new Promise(function(fulfill, reject) {
      setTimeout(fulfill, time);
    });
  }

  /**
   * Bring page tab to the front every time after the timeout. Function is
   * used for several services which are known for opening extra tabs which
   * might crash functionality in the "headfull" mode (since the tab is not
   * focused anymore).
   *
   * You need to set global.controlStatusRunning=true before starting this
   * function in order to work. Function will stop when controlStatusRunning
   * is set to false.
   *
   * WARNING: Never use this function with "await" since it will never stop.
   *
   * @param  {Browser} browser      Browser element
   * @param  {Page} page            Page element
   * @param  {string} searchURL     URL to search for the defined tab
   * @param  {number} timeout=60000 Timeout in milliseconds
   * @return {void}
   * @category static async
   */
  static async controlStatus(browser, page, searchURL, timeout = 60000) {
    while (global.controlStatusRunning === true) {
      await this.randomTimeout(timeout);

      // Get page tab if no action has been executed since the last execution
      // of this part right here (timeout duration)
      if (global.ACTION_SINCE_WAIT === false) {
        // Get page tab, if Browser object exists
        if (typeof browser !== "undefined") {
          page = await this.getPage(browser, searchURL);
          this.debugLog("controlStatus: getPage");
        } else {
          // Otherwise execute alternative function without searching
          // for the browser tab
          try {
            await page.setViewport(Settings.VIEWPORT);
            await page.setUserAgent(Settings.USER_AGENT);
          } catch (e) {}
          this.debugLog("controlStatus: setViewport + userAgent");
        }

        await func.bringToFront(page);
        this.debugLog("controlStatus: bringToFront");
      }

      // Setze Kontrollvariable wieder zurück
      global.ACTION_SINCE_WAIT = false;
    }
  }


  /**
   * Error handling function: Creates screenshot, creates log entry with it
   * and exits the program
   *
   * @param  {Page}  page  Page element
   * @param  {Error} e     Error element
   * @param  {type} doScreenshot=true Create screenshot of page
   * @return {type}
   * @category static async
   */
  static async errorHandling(page, e, doScreenshot = true) {
    // Create screenshot
    var screenshotBase64 = "";
    if (doScreenshot) {
      screenshotBase64 = await this.getScreenshot(page);
    }

    // Create log
    await this.debugLog("error", e.message, screenshotBase64);

    // Set error for the Session inside global logging element
    if (typeof global.logger !== "undefined")
      await global.logger.setError();

    // Close erroneous tab, if globally available
    if (typeof global.tab !== "undefined") {
      try {
        await global.tab.close();
      } catch (e) {}
    }

    await process.exit(1);
  }


  /**
   * Creates screenshot and returns it as a Base64 encoded string
   *
   * @param  {Page} page   Page object
   * @param  {boolean} fullPage=false Create screenshot of full page
   * @return {String}      Base64-encoded string of screenshot
   * @category static async
   */
  static async getScreenshot(page, fullPage = false) {
    var screenshotBase64 = "";
    var parameters = Settings.SCREENSHOT_PARAMS;
    if (fullPage)
      parameters.fullPage = true;
    else
      parameters.fullPage = false;

    try {
      const screenshot = await page.screenshot(parameters);
      screenshotBase64 = screenshot.toString('base64');
    } catch (err) {
      this.debugLog("error", "getScreenshot: " + err.message);
    }
    return screenshotBase64;
  }


  /**
   * Create screenshot and save it inside the log
   *
   * @param  {Object} page Element from which the screenshot should be taken
   * from [Page, Element, Frame]
   * @param  {string} text Text for the log entry
   * @return {void}
   * @category static async
   */
  static async logScreenshot(page, text = "", fullPage = false) {
    if (text == "") {
      try {
        text = await page.url();
      } catch (e) {
        text = "keine URL vorhanden";
      }
    }

    // Get Screenshot
    var screenshot = await this.getScreenshot(page, fullPage);

    // Log screenshot
    await this.debugLog("logScreenshot", text, screenshot);
  }

  /**
   * Check if selector is visible on page
   *
   * @param  {Page} page     Page-Element
   * @param  {string} selector Selector of target
   * @return {Boolean}       true: visible, false: not visible
   * @category static async
   */
  static async isSelectorVisible(page, selector) {
    this.debugLog("isSelectorVisible: " + selector);
    try {
      await page.waitForSelector(selector, {
        visible: true,
        timeout: 500
      });
      // Element was found if no error has been thrown
      // -> the following code will then be reached
      return true;
    } catch (e) {
      // Error is triggered -> Selector is not visible
      return false;
    }
  }



  /**
   * Check if selector is visible inside the browser window or has been
   * overscrolled before.
   * @param  {Page} page     Page element
   * @param  {string} selector Target selector
   * @param  {Boolean} scrollDown=true Scrolling direction (true: downwards,
   *  false: upwards)
   * @return {Boolean}         true: visible, false: not visible
   * @category static async
   */
  static async isInViewport(page, selector, scrollDown = true) {
    var scrollY = await this.getScrollY(page, selector);

    var windowY = await page.evaluate(function() {
      return window.innerHeight;
    });

    // Calculate result in dependency of the scrolling direction
    if (scrollDown) {
      var result = scrollY < windowY;
    } else {
      var result = scrollY > 0;
    }

    if (result == true)
      this.debugLog("isInViewport", selector + ": " + String(scrollY < windowY));

    await this.bringToFront(page);
    return result;
  }


  /**
   * Get horizontal scroll variable
   *
   * @param  {Page} page     Page object
   * @param  {string} selector Selector of target
   * @return {number}          Y-scroll position
   * @category static async
   */
  static async getScrollY(page, selector) {
    var scrollY = await page.$eval(selector, element => {
      return element.getBoundingClientRect().top;
    });

    return scrollY;
  }


  /**
   * Creates debug output in console and writes the log entry into
   * the database. The constant DEBUG inside settings.js has to be set to
   * true to see the log entries. The object global.logger of type {@link Logger}
   * (class/logger.js) has to be defined and initialized to enable database
   * logging. Log entries will be created in the Database if the value is set.
   *
   * @param  {string} key        Text which should be outputted
   * @param  {type} value=""     Second text which should be outputted. If this
   * values is unequal to "", the log entry will be logged into the database.
   * @param  {type} imageData="" Base64 encoded imagedata
   * @return {void}
   * @category static async
   */
  static async debugLog(key, value = "", imageData = "") {
    if (Settings.DEBUG) {
      console.log(key + " " + value);
    }

    // Create log entry, if Logger and value exists
    if (typeof global.logger !== "undefined" && value != "") {
      await global.logger.newLog(key, value, imageData);
    }
  }


  /**
   * Solve image captcha with the help of the Anti-Captcha service. Needs
   * anti-captcha library to work. Library can be downloaded at
   * https://github.com/AdminAnticaptcha/anticaptcha-nodejs/blob/master/anticaptcha.js
   * and the file has to be put into the "lib"-folder of this project.
   *
   * @param  {Page} page        Page element
   * @param  {string} selector  Selector of the Captcha
   * @return {string}           Submitted solution of the Captcha
   * @category static async
   */
  static async solveCaptcha(page, selector) {
    return new Promise(function(fulfill, reject) {
      var Settings = require("./Settings");
      var anticaptcha = require('../lib/anticaptcha')(Settings.ANTICAPTCHA_KEY);

      const imageBase64 = async function() {
        // Select CAPTCHA element
        const captcha = await page.$(selector);

        // Get screenshot of CAPTCHA
        const image = await captcha.screenshot();

        // Convert CAPTCHA image into Base64
        const imageBase64 = await image.toString('base64');

        this.logScreenshot(captcha, "solveCaptcha: selector");

        const solution = anticaptcha.getBalance(function(err, balance) {
          if (err) {
            reject(err);
          }

          if (balance > 0) {
            this.debugLog("balance", balance);

            // Send order to Anticaptcha
            var task = {
              case: true,
              body: imageBase64
            };

            // Create order
            anticaptcha.createImageToTextTask(task, function(err, taskId) {
              if (err) {
                reject(err);
              }

              this.debugLog("taskId: " + taskId);

              // Get solution
              anticaptcha.getTaskSolution(taskId, function(err, taskSolution) {
                if (err) {
                  reject(err);
                }

                this.debugLog("solution", taskSolution);

                // Return solution
                fulfill(taskSolution);
              });
            });
          }
        });
      }();
    });
  }

  /**
   * Solve reCAPTCHA with the help of the Anti-Captcha service. Needs
   * anti-captcha library to work. Library can be downloaded at
   * https://github.com/AdminAnticaptcha/anticaptcha-nodejs/blob/master/anticaptcha.js
   * and the file has to be put into the "lib"-folder of this project.
   *
   * @param  {Frame} iframe   Frame element (page element could be possible,
   * but not tested)
   * @param  {string} selector Selector to the reCAPTCHA iframe included inside
   * the given frame element (needs to have URL to reCAPTCHA inside the HTML DOM
   * attribute "src").
   * @return {string}        reCAPTCHA solution string which has to be injected
   * into hidden textarea element before submission of the form.
   * @category static async
   */
  static async solveRecaptcha(iframe, selector) {
    return new Promise(function(fulfill, reject) {
      var Settings = require("./Settings");
      var anticaptcha = require('../lib/anticaptcha')(Settings.ANTICAPTCHA_KEY);

      const imageBase64 = async function() {
        // Get reCAPTCHA key
        const recaptchaURL = await iframe.$eval(selector, e => e.getAttribute('src'));
        // Get reCAPTCHA ID
        const recaptchaKey = await recaptchaURL.split('=', 2)[1].split('&', 2)[0];

        this.debugLog("recaptchaURL", recaptchaURL);
        this.debugLog("recaptchaKey", recaptchaKey);

        // Set parameters
        anticaptcha.setWebsiteURL(await iframe.url());
        anticaptcha.setWebsiteKey(recaptchaKey);
        anticaptcha.setUserAgent(Settings.USER_AGENT);

        this.debugLog("solveRecaptcha", selector);

        const solution = anticaptcha.getBalance(function(err, balance) {
          if (err) {
            reject(err);
          }

          if (balance > 0) {
            this.debugLog("balance", balance);

            // Send order to Anticaptcha
            anticaptcha.createTaskProxyless(function(err, taskId) {
              if (err) {
                reject(err);
              }

              this.debugLog("taskId: " + taskId);

              // Get solution
              anticaptcha.getTaskSolution(taskId, function(err, taskSolution) {
                if (err) {
                  reject(err);
                }

                this.debugLog("solution", taskSolution);

                // Return solution
                fulfill(taskSolution);
              });
            });
          }
        });
      }();
    });
  }
}


// Setze Funktionen für Außenzugriff
module.exports = Functions;