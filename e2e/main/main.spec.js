'use strict';

describe('Main View', function() {
  var page;

  beforeEach(function() {
    browser.get('/');
    page = require('./main.po');
  });

  it('should include the header with logo image', function() {
    // expect(page.h1El.getText()).toBe('\'Allo, \'Allo!');
    expect(page.imgEl.getAttribute('src')).toMatch('http://localhost:9000/assets/images/logo.png');
    expect(page.imgEl.getAttribute('alt')).toBe('crowd-parser-logo');
  });
});
