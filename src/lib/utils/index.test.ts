import {isString} from './index';

describe('isString', () => {
	it.each([55, false, true, {}, [], null, NaN, undefined])('rejects %p', (invalidValue) => {
		expect(isString(invalidValue)).toBe(false);
	});

	it('accepts a string', () => {
		expect(isString('validValue')).toBe(true);
	});
});
