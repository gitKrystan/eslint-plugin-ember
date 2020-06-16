'use strict';

const babelEslint = require('babel-eslint');
const propertySetterUtils = require('../../../lib/utils/property-setter');

function parse(code) {
  return babelEslint.parse(code).body[0];
}

describe('isThisSet', () => {
  it('behaves correctly', () => {
    // False:
    expect(propertySetterUtils.isThisSet(parse('this.x').expression)).toBeFalsy();
    expect(propertySetterUtils.isThisSet(parse('this.x()').expression)).toBeFalsy();
    expect(propertySetterUtils.isThisSet(parse('let x = 123;'))).toBeFalsy();
    expect(propertySetterUtils.isThisSet(parse('x = 123;'))).toBeFalsy();

    // True:
    expect(propertySetterUtils.isThisSet(parse('this.x = 123').expression)).toBeTruthy();
    expect(propertySetterUtils.isThisSet(parse('this.x.y = 123').expression)).toBeTruthy();
  });
});
