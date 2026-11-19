jest.mock('react-native', () => {
	const RN = jest.requireActual('react-native');
	RN.NativeModules.ApkInstaller = {getInstallerPackageName: jest.fn()};
	return RN;
});

const mockCheckNeedsUpdate = jest.fn();
const mockStartUpdate = jest.fn();

jest.mock('sp-react-native-in-app-updates', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		checkNeedsUpdate: mockCheckNeedsUpdate,
		startUpdate: mockStartUpdate,
	})),
	IAUUpdateKind: {FLEXIBLE: 0, IMMEDIATE: 1},
}));

jest.mock('./updateFromJanis', () => ({__esModule: true, default: jest.fn()}));

import {NativeModules} from 'react-native';
import updateFromJanis from './updateFromJanis';
import Crashlytics from '../crashlytics';
import updateApp from './updateApp';

const mockGetInstallerPackageName = NativeModules.ApkInstaller.getInstallerPackageName as jest.Mock;
const mockUpdateFromJanis = updateFromJanis as jest.Mock;

const params = {
	env: 'janisqa',
	app: 'picking',
	buildNumber: '2300',
	newVersionNumber: '2.10.0.2500',
} as const;

describe('updateApp', () => {
	describe('installed from Play Store', () => {
		beforeEach(() => {
			mockGetInstallerPackageName.mockResolvedValue('com.android.vending');
		});

		it('starts an immediate update when Play offers a new version', async () => {
			mockCheckNeedsUpdate.mockResolvedValueOnce({shouldUpdate: true});

			expect(await updateApp(params)).toBe('started');
			expect(Crashlytics.log).toHaveBeenCalledWith('updateApp:', params);
			expect(mockCheckNeedsUpdate).toHaveBeenCalledWith({curVersion: '2300'});
			expect(mockStartUpdate).toHaveBeenCalledWith({updateType: 1});
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
			mockGetInstallerPackageName.mockResolvedValue(null);
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
		mockGetInstallerPackageName.mockRejectedValueOnce(new Error('INSTALLER_ERROR'));

		expect(await updateApp(params)).toBe('failed');
	});
});
