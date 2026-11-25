const mockAddStatusUpdateListener = jest.fn();
const mockInstallUpdate = jest.fn();

jest.mock('sp-react-native-in-app-updates', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		addStatusUpdateListener: mockAddStatusUpdateListener,
		installUpdate: mockInstallUpdate,
	})),
	IAUInstallStatus: {DOWNLOADING: 2, DOWNLOADED: 11},
}));

import SpInAppUpdates from 'sp-react-native-in-app-updates';

// The module keeps the listener state, so each test starts from a fresh copy
const loadPlayStore = () => {
	let playStore!: typeof import('./playStore');
	jest.isolateModules(() => {
		playStore = require('./playStore');
	});
	return playStore;
};

describe('playStore', () => {
	it('creates a single Play client, since each one keeps its native subscriptions forever', () => {
		const {default: inAppUpdates} = loadPlayStore();

		expect(SpInAppUpdates).toHaveBeenCalledTimes(1);
		expect(inAppUpdates.installUpdate).toBe(mockInstallUpdate);
	});

	it('installs only once the download ends', () => {
		loadPlayStore().installWhenDownloaded();
		const onStatusUpdate = mockAddStatusUpdateListener.mock.calls[0][0];

		onStatusUpdate({status: 2});
		expect(mockInstallUpdate).not.toHaveBeenCalled();

		onStatusUpdate({status: 11});
		expect(mockInstallUpdate).toHaveBeenCalledTimes(1);
	});

	it('registers the listener once however many updates start, so it installs once', () => {
		const {installWhenDownloaded} = loadPlayStore();

		installWhenDownloaded();
		installWhenDownloaded();

		expect(mockAddStatusUpdateListener).toHaveBeenCalledTimes(1);
	});
});
