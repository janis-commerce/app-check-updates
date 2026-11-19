const mockCheckNeedsUpdate = jest.fn();

jest.mock('sp-react-native-in-app-updates', () => ({
	__esModule: true,
	default: jest.fn(() => ({checkNeedsUpdate: mockCheckNeedsUpdate})),
}));

jest.mock('./getInstallSource', () => ({__esModule: true, default: jest.fn()}));

import getInstallSource from './getInstallSource';
import isUpdateAvailable from './isUpdateAvailable';

const mockGetInstallSource = getInstallSource as jest.Mock;

describe('isUpdateAvailable', () => {
	describe('installed from Janis', () => {
		beforeEach(() => {
			mockGetInstallSource.mockResolvedValue('janis');
		});

		it.each([
			['a newer build is published', '2500', true],
			['the published build is the installed one', '2400', false],
			['the published build is older', '2300', false],
		])('returns %s', async (_, currentBuildNumber, expected) => {
			expect(await isUpdateAvailable({buildNumber: '2400', currentBuildNumber})).toBe(expected);
		});

		it('compares builds as numbers', async () => {
			expect(await isUpdateAvailable({buildNumber: '999', currentBuildNumber: '1000'})).toBe(true);
		});

		it('does not ask Play Store', async () => {
			await isUpdateAvailable({buildNumber: '2400', currentBuildNumber: '2500'});

			expect(mockCheckNeedsUpdate).not.toHaveBeenCalled();
		});
	});

	describe('installed from Play Store', () => {
		beforeEach(() => {
			mockGetInstallSource.mockResolvedValue('playStore');
		});

		it('trusts Play even when Janis publishes an older build', async () => {
			mockCheckNeedsUpdate.mockResolvedValueOnce({shouldUpdate: true});

			expect(await isUpdateAvailable({buildNumber: '2400', currentBuildNumber: '2300'})).toBe(true);
			expect(mockCheckNeedsUpdate).toHaveBeenCalledWith({curVersion: '2400'});
		});

		it('returns false when Play does not offer the build published in Janis yet', async () => {
			mockCheckNeedsUpdate.mockResolvedValueOnce({shouldUpdate: false});

			expect(await isUpdateAvailable({buildNumber: '2400', currentBuildNumber: '2500'})).toBe(
				false
			);
		});

		it('returns false when Play fails, instead of breaking the check', async () => {
			mockCheckNeedsUpdate.mockRejectedValueOnce(new Error('checkNeedsUpdate'));

			expect(await isUpdateAvailable({buildNumber: '2400', currentBuildNumber: '2500'})).toBe(
				false
			);
		});
	});

	it('returns false when the install channel cannot be read', async () => {
		mockGetInstallSource.mockRejectedValueOnce(new Error('INSTALLER_ERROR'));

		expect(await isUpdateAvailable({buildNumber: '2400', currentBuildNumber: '2500'})).toBe(false);
	});
});
