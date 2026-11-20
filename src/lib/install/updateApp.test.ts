const mockCheckNeedsUpdate = jest.fn();
const mockStartUpdate = jest.fn();
const mockAddStatusUpdateListener = jest.fn();
const mockInstallUpdate = jest.fn();

jest.mock('sp-react-native-in-app-updates', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		checkNeedsUpdate: mockCheckNeedsUpdate,
		startUpdate: mockStartUpdate,
		addStatusUpdateListener: mockAddStatusUpdateListener,
		installUpdate: mockInstallUpdate,
	})),
	IAUUpdateKind: {FLEXIBLE: 0, IMMEDIATE: 1},
	IAUInstallStatus: {DOWNLOADING: 2, DOWNLOADED: 11},
}));

jest.mock('./updateFromJanis', () => ({__esModule: true, default: jest.fn()}));
jest.mock('./getInstallSource', () => ({__esModule: true, default: jest.fn()}));

import updateFromJanis from './updateFromJanis';
import getInstallSource from './getInstallSource';
import Crashlytics from '../crashlytics';
import updateApp from './updateApp';

const mockGetInstallSource = getInstallSource as jest.Mock;
const mockUpdateFromJanis = updateFromJanis as jest.Mock;

const params = {
	env: 'janisqa',
	app: 'picking',
	buildNumber: '2300',
	newVersionNumber: '2.10.0.2500',
	mode: 'immediate',
} as const;

describe('updateApp', () => {
	describe('installed from Play Store', () => {
		beforeEach(() => {
			mockGetInstallSource.mockResolvedValue('playStore');
		});

		it('starts a flexible update that installs as soon as the download ends', async () => {
			mockCheckNeedsUpdate.mockResolvedValueOnce({shouldUpdate: true});

			expect(await updateApp({...params, mode: 'flexible'})).toBe('started');
			expect(mockStartUpdate).toHaveBeenCalledWith({updateType: 0});

			const onStatusUpdate = mockAddStatusUpdateListener.mock.calls[0][0];
			onStatusUpdate({status: 2});
			expect(mockInstallUpdate).not.toHaveBeenCalled();

			onStatusUpdate({status: 11});
			expect(mockInstallUpdate).toHaveBeenCalled();
		});

		it('starts an immediate update when Play offers a new version', async () => {
			mockCheckNeedsUpdate.mockResolvedValueOnce({shouldUpdate: true});

			expect(await updateApp(params)).toBe('started');
			expect(Crashlytics.log).toHaveBeenCalledWith('updateApp:', params);
			expect(mockCheckNeedsUpdate).toHaveBeenCalledWith({curVersion: '2300'});
			expect(mockStartUpdate).toHaveBeenCalledWith({updateType: 1});
			expect(mockAddStatusUpdateListener).not.toHaveBeenCalled();
			expect(mockUpdateFromJanis).not.toHaveBeenCalled();
		});

		it('returns unavailable when Play does not offer the new version yet', async () => {
			mockCheckNeedsUpdate.mockResolvedValueOnce({shouldUpdate: false});

			expect(await updateApp(params)).toBe('unavailable');
			expect(mockStartUpdate).not.toHaveBeenCalled();
		});

		it('returns failed when Play fails', async () => {
			mockCheckNeedsUpdate.mockRejectedValueOnce(new Error('checkNeedsUpdate'));

			expect(await updateApp(params)).toBe('failed');
		});
	});

	describe('installed from Janis Store', () => {
		beforeEach(() => {
			mockGetInstallSource.mockResolvedValue('janis');
		});

		it('downloads the new version from Janis', async () => {
			mockUpdateFromJanis.mockResolvedValueOnce(true);

			expect(await updateApp(params)).toBe('started');
			expect(mockUpdateFromJanis).toHaveBeenCalledWith({
				env: 'janisqa',
				app: 'picking',
				newVersionNumber: '2.10.0.2500',
			});
			expect(mockCheckNeedsUpdate).not.toHaveBeenCalled();
		});

		it('returns failed when the download does not complete', async () => {
			mockUpdateFromJanis.mockResolvedValueOnce(false);

			expect(await updateApp(params)).toBe('failed');
		});
	});

	it('returns failed when the installer cannot be read', async () => {
		mockGetInstallSource.mockRejectedValueOnce(new Error('INSTALLER_ERROR'));

		expect(await updateApp(params)).toBe('failed');
	});
});
