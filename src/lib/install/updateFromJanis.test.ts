// Mock para el módulo nativo ApkInstaller - DEBE estar antes de las importaciones
jest.mock('react-native', () => {
	const RN = jest.requireActual('react-native');
	RN.NativeModules.ApkInstaller = {
		install: jest.fn(() => Promise.resolve(true)),
		checkUpdateCompleted: jest.fn(() => Promise.resolve(false)),
	};
	return RN;
});

import {NativeModules} from 'react-native';
import RNFS from 'react-native-fs';
import updateFromJanis from './updateFromJanis';

// Keeps the dev-only console errors out of the test output
(global as any).__DEV__ = false;
const mockInstall = NativeModules.ApkInstaller.install as jest.Mock;

const mockRequestMultiple = jest.fn(() => new Promise((resolve) => resolve(true)));
const mockCheck = jest.fn();
const RNFSExistsSpy = jest.spyOn(RNFS, 'exists');
const RNFSUnlinkSpy = jest.spyOn(RNFS, 'unlink');
const RNFSReadDirSpy = jest.spyOn(RNFS, 'readDir');
const RNFSMkdirSpy = jest.spyOn(RNFS, 'mkdir');
const RNFSDownloadFileSpy = jest.spyOn(RNFS, 'downloadFile');

jest.mock('react-native//Libraries/PermissionsAndroid/PermissionsAndroid', () => {
	const PermissionsAndroid = jest.requireActual(
		'react-native//Libraries/PermissionsAndroid/PermissionsAndroid'
	);
	// Since RN 0.80 the module is ESM and react-native's index reads its default export
	return {
		__esModule: true,
		default: {
			...PermissionsAndroid.default,
			check: mockCheck,
			requestMultiple: mockRequestMultiple,
		},
	};
});
const mockVersion = jest.fn().mockReturnValue(14);

jest.mock('react-native/Libraries/Utilities/Platform', () => {
	const Platform = jest.requireActual('react-native/Libraries/Utilities/Platform');
	Object.defineProperty(Platform.default, 'Version', {
		get: mockVersion,
	});
	return Platform;
});
const params = {env: 'janisqa', app: 'picking', newVersionNumber: '2.10.0.2500'} as const;
const APK_DIR = '/Download/picking-qa-apk';
const APK_PATH = `${APK_DIR}/picking-qa.2.10.0.2500.apk`;

const mockDownload = (statusCode: number) =>
	RNFSDownloadFileSpy.mockReturnValueOnce({promise: Promise.resolve({statusCode})} as any);

describe('updateFromJanis', () => {
	beforeEach(() => {
		(RNFS as any).DownloadDirectoryPath = '/Download';
		mockVersion.mockReturnValue(33);
		mockInstall.mockResolvedValue(true);
		mockCheck.mockResolvedValue(true);
		RNFSExistsSpy.mockResolvedValue(false);
	});

	it('downloads the latest APK of the app and env and opens the installer', async () => {
		mockDownload(200);

		await expect(updateFromJanis(params)).resolves.toBe(true);

		expect(RNFSDownloadFileSpy).toHaveBeenCalledWith({
			fromUrl: 'https://mobile.janisqa.in/api/download/picking/android/latest',
			toFile: APK_PATH,
		});
		expect(mockInstall).toHaveBeenCalledWith(APK_PATH);
	});

	it('does not open the installer when the download fails', async () => {
		mockDownload(404);

		await expect(updateFromJanis(params)).resolves.toBe(false);

		expect(mockInstall).not.toHaveBeenCalled();
	});

	it('keeps the download successful when the installer cannot open, so it can be installed by hand', async () => {
		mockDownload(200);
		mockInstall.mockRejectedValueOnce(new Error('Installation failed'));

		await expect(updateFromJanis(params)).resolves.toBe(true);
	});

	it('replaces the APKs left by a previous download', async () => {
		mockDownload(200);
		RNFSExistsSpy.mockResolvedValueOnce(true);
		RNFSReadDirSpy.mockResolvedValueOnce([{path: `${APK_DIR}/picking-qa.2.9.0.2400.apk`}] as any);

		await updateFromJanis(params);

		expect(RNFSUnlinkSpy).toHaveBeenCalledWith(`${APK_DIR}/picking-qa.2.9.0.2400.apk`);
		expect(RNFSMkdirSpy).not.toHaveBeenCalled();
	});

	it('creates the download folder the first time', async () => {
		mockDownload(200);

		await updateFromJanis(params);

		expect(RNFSMkdirSpy).toHaveBeenCalledWith(APK_DIR);
	});

	describe('before Android 13, which needs storage permissions', () => {
		beforeEach(() => {
			mockVersion.mockReturnValue(32);
		});

		it('asks for them and downloads when granted', async () => {
			mockDownload(200);

			await expect(updateFromJanis(params)).resolves.toBe(true);

			expect(mockRequestMultiple).toHaveBeenCalled();
		});

		it.each([
			['read', [false, true]],
			['write', [true, false]],
		])('rejects without downloading when %s is denied', async (_, [read, write]) => {
			mockCheck.mockResolvedValueOnce(read).mockResolvedValueOnce(write);

			await expect(updateFromJanis(params)).rejects.toThrow(
				'You do not have permissions for external storage'
			);
			expect(RNFSDownloadFileSpy).not.toHaveBeenCalled();
		});
	});

	it('does not ask for storage permissions from Android 13', async () => {
		mockDownload(200);

		await updateFromJanis(params);

		expect(mockRequestMultiple).not.toHaveBeenCalled();
	});

	it('rejects when the download breaks', async () => {
		RNFSDownloadFileSpy.mockReturnValueOnce({promise: Promise.reject(new Error('Network'))} as any);

		await expect(updateFromJanis(params)).rejects.toThrow('Network');
	});
});
