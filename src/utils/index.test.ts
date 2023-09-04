import {customVersionComparator} from './index';

describe('customVersionComparator funtion', () => {
	describe('compare versions correctly', () => {
		it('new version is equal to the current version', () => {
			expect(customVersionComparator('1210', '1210')).toEqual(0);
		});

		it('new version is greater than the current version', async () => {
			expect(customVersionComparator('1210', '1209')).toEqual(1);
		});

		it('new version is lower than current version', async () => {
			expect(customVersionComparator('1210', '1211')).toEqual(-1);
		});
	});
});
