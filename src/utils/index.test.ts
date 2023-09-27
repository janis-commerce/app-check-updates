import SpInAppUpdates from 'sp-react-native-in-app-updates';
import {customVersionComparator, onStatusUpdate} from './index';

const mockInstallUpdate = jest.fn();

jest.mock('sp-react-native-in-app-updates', () => {
	return {
		__esModule: true,
		default: jest.fn(() => ({
			installUpdate: mockInstallUpdate,
		})),
		IAUInstallStatus: {
			DOWNLOADED: 11,
		},
	};
});

describe('utils funtion', () => {
	describe('customVersionComparator funtion', () => {
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
	describe('onStatusUpdate funtion', () => {
		it('new version was downloaded and the installation begins', async () => {
			const mockStatus = {
				bytesDownloaded: 123,
				totalBytesToDownload: 123,
				status: 11,
			};
			const inAppUpdates = await new SpInAppUpdates(false);
			await onStatusUpdate(mockStatus, inAppUpdates);
			await expect(mockInstallUpdate).toHaveBeenCalled();
		});

		it('new version is being downloaded', async () => {
			const mockStatus = {
				bytesDownloaded: 123,
				totalBytesToDownload: 123,
				status: 2,
			};
			const inAppUpdates = await new SpInAppUpdates(false);
			await onStatusUpdate(mockStatus, inAppUpdates);
			await expect(mockInstallUpdate).toHaveBeenCalledTimes(0);
		});
	});
});
