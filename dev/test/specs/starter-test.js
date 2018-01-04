/*
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const assert = require('assert');

function pierceShadows(selectors) {
  return browser.execute(function(selectors) {
    return pierceShadows(selectors);
  }, selectors);
}
function pierceShadowsSingle(selectors) {
  return browser.execute(function(selectors) {
    return pierceShadowsSingle(selectors);
  }, selectors);
}

/**
 * Search the list of elements, return the one that matches the textQuery.
 * (return an error if there are multiple matches, null if there are none).
 * The return format should be an object with the format:
 *   {id: <element-id>, text: <found text>}
 */
function searchElementsForText(elements, textQuery) {
  const textToId = elements.map(value => {
    return {
      id: value.ELEMENT,
      text: browser.elementIdText(value.ELEMENT).value
    };
  });
  assert.ok(textToId.length > 0, textToId);
  assert.equal(textToId.length, elements.length);

  const matches = textToId.reduce((accumulator, currentValue) => {
    const found = currentValue.text.includes(textQuery) ? currentValue : null;
    if (accumulator && found) {
      throw Error(`found two matches ${accumulator}, ${found}`);
    } else if (accumulator) {
      return accumulator;
    }

    return found;
  }, null);

  return matches;
}

/** wait for the dancing dots to stop. */
function waitForStillness() {
  var element = pierceShadowsSingle([
    'arc-footer',
    'x-toast[app-footer]',
    'dancing-dots'
  ]);

  browser.waitUntil(
    () => {
      var result = browser.elementIdAttribute(element.value.ELEMENT, 'animate');
      return null == result.value;
    },
    5000,
    `the dancing dots can't stop won't stop`,
    1000
  );
}

/** Load the selenium utils into the current page. */
function loadSeleniumUtils() {
  var result = browser.execute(function(baseUrl) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `${baseUrl}/test/selenium-utils.js`;
    document.getElementsByTagName('head')[0].appendChild(script);
  }, browser.options.baseUrl);
  browser.waitUntil(() => {
    try {
      // To see if our selenium-utils has finished loading, try one of the
      // methods (pierceShadows()) with an arbitrary argument. If the utils
      // haven't loaded yet this will throw an exception.
      browser.execute('pierceShadows(["head"])');
    } catch (e) {
      if (e.message.includes('pierceShadows is not defined')) {
        console.log(
          `got a not-entirely-unexpected error, but waitUntil will try again (up to a point). Error: ${e}`
        );
        return false;
      }
      throw e;
    }
    return true;
  });
}

function getFooterPath() {
  return ['arc-footer', 'x-toast[app-footer]'];
}

function initTestWithNewArc() {
  // TODO(smalls) should we create a user on the fly?
  // note - baseUrl (currently specified on the command line) must end in a
  // trailing '/', and this must not begin with a preceding '/'.
  browser.url(`apps/web/?user=-L-YGQo_7f3izwPg6RBn`);

  assert.equal('Arcs', browser.getTitle());

  // create a new arc, switch to that tab (toggling back to the first tab to
  // reset the webdriver window state).
  createNewArc();

  // wait for the page to load a bit, init the test harness for this page
  browser.waitForVisible('<app-main>');
  browser.waitForVisible('<footer>');
  loadSeleniumUtils();

  // check out some basic structure relative to the app footer
  const footerPath = getFooterPath();
  assert.ok(pierceShadowsSingle(footerPath.slice(0, 1)).value);
  assert.ok(pierceShadowsSingle(footerPath).value);
}

function createNewArc() {
  assert.equal(1, browser.windowHandles().value.length);

  // create a new arc, switch to that tab (toggling back to the first tab to
  // reset the webdriver window state).
  browser.waitForVisible('div[title="New Arc"]');
  browser.click('div[title="New Arc"]');
  browser.switchTab(browser.windowHandles().value[0]);
  browser.switchTab(browser.windowHandles().value[1]);
}

function allSuggestions() {
  waitForStillness();

  const magnifier = pierceShadowsSingle(
    getFooterPath().concat(['div[search]', 'i'])
  );
  browser.elementIdClick(magnifier.value.ELEMENT);
}

function acceptSuggestion(textSubstring) {
  waitForStillness();
  let footerPath = getFooterPath();

  const suggestionsRoot = pierceShadowsSingle(
    footerPath.concat(['suggestions-element'])
  );
  const suggestionsDiv = pierceShadowsSingle(
    footerPath.concat(['suggestions-element', 'div'])
  );
  browser.waitUntil(
    () => {
      const allSuggestions = browser.elementIdElements(
        suggestionsDiv.value.ELEMENT,
        'suggest'
      );
      if (!allSuggestions.value || 0 == allSuggestions.value) {
        return false;
      }

      try {
        const desiredSuggestion = searchElementsForText(
          allSuggestions.value,
          textSubstring
        );
        if (!desiredSuggestion) {
          return false;
        }

        browser.elementIdClick(desiredSuggestion.id);
        return true;
      } catch (e) {
        if (e.message.includes('stale element reference')) {
          console.log(
            `got a not-entirely-unexpected error, but waitUntil will try again (up to a point). Error: ${e}`
          );
          return false;
        }

        throw e;
      }
    },
    5000,
    `couldn't find suggestion ${textSubstring}`
  );
  // TODO: return the full suggestion text for further verification.
  console.log(`Accepted suggestion: ${textSubstring}`);
}

/**
 * Click in the main arcs app, in the slot with the name 'slotName', using the
 * specified selectors, filtering by the optional textQuery.
 */
function clickInParticles(slotName, selectors, textQuery) {
  waitForStillness();

  if (!selectors) selectors = [];
  const realSelectors = ['arc-host', `div[slotid="${slotName}"]`].concat(
    selectors
  );

  browser.waitUntil(
    () => {
      const pierced = pierceShadows(realSelectors);
      assert.ok(pierced);
      if (!pierced.value || pierced.value.length == 0) {
        return false;
      }

      let selected;
      if (textQuery) {
        selected = searchElementsForText(pierced.value, textQuery).id;
      } else {
        if (1 == pierced.value.length) {
          selected = pierced.value[0].ELEMENT;
        } else {
          throw Error(
            `found multiple matches for ${realSelectors}: ${pierced.value}`
          );
        }
      }

      if (selected) {
        browser.elementIdClick(selected);
        return true;
      } else {
        return false;
      }
    },
    5000,
    `couldn't find anything to click with selectors ${realSelectors} textQuery ${textQuery}`
  );
}

describe('test Arcs demo flows', function() {
  it('can use the restaurant demo flow', function() {
    initTestWithNewArc();

    allSuggestions();

    acceptSuggestion('Find restaurants');
    clickInParticles('root', ['div.item', 'div.title'], 'Tacolicious');

    acceptSuggestion('make a reservation');
    acceptSuggestion('You are free');

    browser.close();
    // to drop into debug mode with a REPL; also a handy way to see the state
    // at the end of the test:
    // browser.debug();
  });

  it('can use the gift shopping demo flow', function() {
    initTestWithNewArc();

    allSuggestions();

    acceptSuggestion('Show Products from your browsing context (Minecraft Book plus 2 other items) and choose from Products recommended based on Products from your browsing context and Claire\'s wishlist (Book: How to Draw plus 2 other items)');
    browser.waitForVisible('div[slotid="action"]');
    browser.waitForVisible('div[slotid="annotation"]');

    // TODO: click the 'Add' buttons to move products from recommended to shortlist and
    // (1) verify product was moved,
    // (2) verify 'action' slot is not visible after all products were moved.

    acceptSuggestion('Estimate arrival dates, estimate arrival dates');  // TODO: add 'and buy gifts for Claire' when descriptions are fixed.
    acceptSuggestion('check manufacturer information for Products from your browsing context');
    acceptSuggestion('recommendations based on Products recommended based on Products from your browsing context and Claire\'s wishlist');

    // Verify each product has non empty annotation text.
    let annotations = browser.getText('div[slotid="annotation"]');
    assert.equal(6, annotations.length);
    assert.ok(annotations.length > 0 && annotations.every(a => a.length > 0));

    browser.close();
  });
});
