jest.mock('react-native', () => {
	const RN = jest.requireActual('react-native');
	RN.NativeModules.ApkInstaller = {getInstallerPackageName: jest.fn()};
	return RN;
});

import {NativeModules} from 'react-native';
import getInstallSource from './getInstallSource';

const mockGetInstallerPackageName = NativeModules.ApkInstaller.getInstallerPackageName as jest.Mock;

describe('getInstallSource', () => {
	it('returns playStore when Play Store installed the app', async () => {
		mockGetInstallerPackageName.mockResolvedValueOnce('com.android.vending');

		expect(await getInstallSource()).toBe('playStore');
	});

	it.each([
		['the APK was installed by adb, which records no installer', null],
		['the APK was opened with the system package installer', 'com.google.android.packageinstaller'],
		['the app was installed by an MDM', 'com.airwatch.androidagent'],
	])('returns janis when %s', async (_, installer) => {
		mockGetInstallerPackageName.mockResolvedValueOnce(installer);

		expect(await getInstallSource()).toBe('janis');
	});

	it('lets the caller handle a native failure', async () => {
		mockGetInstallerPackageName.mockRejectedValueOnce(new Error('INSTALLER_ERROR'));

		await expect(getInstallSource()).rejects.toThrow('INSTALLER_ERROR');
	});
});
