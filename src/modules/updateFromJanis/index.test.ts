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
import * as utils from '../../utils';
import updateFromJanis from './index';

const mockIsDevEnv = jest.spyOn(utils, 'isDevEnv');
const mockInstall = NativeModules.ApkInstaller.install as jest.Mock;

const mockRequestMultiple = jest.fn(() => new Promise((resolve) => resolve(true)));
const mockCheck = jest.fn();
const RNFSExistsSpy = jest.spyOn(RNFS, 'exists');
const RNFSUnlinkSpy = jest.spyOn(RNFS, 'unlink');
const RNFSReadDirSpy = jest.spyOn(RNFS, 'readDir');

jest.mock('react-native//Libraries/PermissionsAndroid/PermissionsAndroid', () => {
	const PermissionsAndroid = jest.requireActual(
		'react-native//Libraries/PermissionsAndroid/PermissionsAndroid'
	);
	return {
		...PermissionsAndroid,
		check: mockCheck,
		requestMultiple: mockRequestMultiple,
	};
});
const mockVersion = jest.fn().mockReturnValue(14);

jest.mock('react-native/Libraries/Utilities/Platform', () => {
	const Platform = jest.requireActual('react-native/Libraries/Utilities/Platform');
	Object.defineProperty(Platform, 'Version', {
		get: mockVersion,
	});
	return Platform;
});
describe('App check updates funtion', () => {
	beforeEach(() => {
		mockInstall.mockClear();
		mockInstall.mockResolvedValue(true);
	});
	describe('Error handling', () => {
		it.each(['', 5, [], {}, jest.fn(), undefined, null, NaN])(
			'param is not valid',
			async (invalidValue) => {
				await expect(
					updateFromJanis({
						env: invalidValue as any,
						app: 'wms',
						newVersionNumber: '1.1.0.2345',
					})
				).rejects.toThrow('the parameters are incorrect');

				await expect(
					updateFromJanis({
						env: 'janisdev',
						app: invalidValue as any,
						newVersionNumber: '1.1.0.2345',
					})
				).rejects.toThrow('the parameters are incorrect');

				await expect(
					updateFromJanis({
						env: 'janisdev',
						app: 'wms',
						newVersionNumber: invalidValue as any,
					})
				).rejects.toThrow('the parameters are incorrect');
			}
		);

		it('does not have to read storage permissions', async () => {
			mockCheck.mockResolvedValueOnce(false);
			mockVersion.mockReturnValueOnce(25);
			await expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersionNumber: '2.0.0.2345',
				})
			).rejects.toThrow('You do not have permissions for external storage');
		});

		it('does not have to write storage permissions', async () => {
			mockCheck.mockResolvedValueOnce(true);
			mockCheck.mockResolvedValueOnce(false);

			expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersionNumber: '2.0.0.2345',
				})
			).rejects.toThrow('You do not have permissions for external storage');
		});

		it('dont log the error', async () => {
			mockCheck.mockRejectedValueOnce(new Error('Error'));
			mockIsDevEnv.mockReturnValueOnce(false);
			await expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersionNumber: '2.0.0.2345',
				})
			).rejects.toThrow('Error');
		});
		it('log the error in dev env', async () => {
			mockCheck.mockRejectedValueOnce(new Error('Error'));
			mockIsDevEnv.mockReturnValueOnce(true);
			await expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersionNumber: '2.0.0.2345',
				})
			).rejects.toThrow('Error');
		});
	});

	describe('Works correctly', () => {
		it('works correctly in janisdev environment without asking permissions', async () => {
			mockVersion.mockReturnValueOnce(33);
			mockCheck.mockResolvedValue(true);
			await expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersionNumber: '2.0.0.2345',
				})
			).resolves.toEqual(true);
		});
		it('works correctly in janisqa environment with invalid callback', async () => {
			mockVersion.mockReturnValueOnce(14);
			RNFSExistsSpy.mockResolvedValueOnce(true);
			RNFSReadDirSpy.mockResolvedValueOnce([{path: '/some/old/file.apk'}] as any);
			RNFSUnlinkSpy.mockResolvedValueOnce(undefined);
			mockCheck.mockResolvedValue(true);
			await expect(
				updateFromJanis({
					env: 'janisqa',
					app: 'wms',
					newVersionNumber: '2.0.0.2345',
					DownloadProgressCallback: null as any,
				})
			).resolves.toEqual(true);
		});
		it('works correctly in janis environment with valid callback', async () => {
			mockVersion.mockReturnValueOnce(14);
			mockCheck.mockResolvedValue(true);
			const DownloadProgressCallback = () => {};
			await expect(
				updateFromJanis({
					env: 'janis',
					app: 'wms',
					newVersionNumber: '2.0.0.2345',
					DownloadProgressCallback,
				})
			).resolves.toEqual(true);
		});

		it('installs APK automatically after successful download', async () => {
			mockVersion.mockReturnValueOnce(33);
			mockInstall.mockResolvedValueOnce(true);

			const result = await updateFromJanis({
				env: 'janisdev',
				app: 'wms',
				newVersionNumber: '2.0.0.2345',
			});

			// La descarga e instalación fueron exitosas
			expect(result).toEqual(true);
		});

		it('returns true even if APK installation fails but download was successful', async () => {
			mockVersion.mockReturnValueOnce(33);
			mockInstall.mockRejectedValueOnce(new Error('Installation failed'));
			mockIsDevEnv.mockReturnValueOnce(false);

			const result = await updateFromJanis({
				env: 'janis',
				app: 'picking',
				newVersionNumber: '3.0.0.5678',
			});

			// Aunque la instalación falle, retornamos true porque la descarga fue exitosa
			expect(result).toEqual(true);
		});

		it('returns true and logs when APK installation fails in dev environment', async () => {
			mockVersion.mockReturnValueOnce(33);
			mockInstall.mockRejectedValueOnce(new Error('Installation failed'));
			mockIsDevEnv.mockReturnValueOnce(true);

			const result = await updateFromJanis({
				env: 'janisdev',
				app: 'delivery',
				newVersionNumber: '4.0.0.1234',
			});

			expect(result).toEqual(true);
		});

		it('returns false when download fails (statusCode !== 200)', async () => {
			mockVersion.mockReturnValueOnce(33);
			mockCheck.mockResolvedValue(true);

			// Mock RNFS.downloadFile para que retorne un statusCode diferente de 200
			const originalDownloadFile = RNFS.downloadFile;
			RNFS.downloadFile = jest.fn(() => ({
				promise: Promise.resolve({statusCode: 404}),
			})) as any;

			const result = await updateFromJanis({
				env: 'janisdev',
				app: 'wms',
				newVersionNumber: '2.0.0.2345',
			});

			expect(result).toEqual(false);

			// Restaurar el mock original
			RNFS.downloadFile = originalDownloadFile;
		});
	});
});
