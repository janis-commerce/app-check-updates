import {NativeModules, Platform} from 'react-native';
import * as utils from './utils';
import {defaultResponse} from './utils';
import * as updateFromStorefn from './modules/updateFromStore';

// Mock para nuestro módulo nativo ApkInstaller
NativeModules.ApkInstaller = {
	install: jest.fn(() => Promise.resolve(true)),
	checkUpdateCompleted: jest.fn(() => Promise.resolve(false)),
};

// Mock Platform.OS para que sea 'android' por defecto
Object.defineProperty(Platform, 'OS', {
	get: jest.fn(() => 'android'),
	configurable: true,
});

import {appCheckUpdates, checkIfJustUpdated} from './index';

const updateFromStore = jest.spyOn(updateFromStorefn, 'default');
const checkNeedsUpdateInJanis = jest.spyOn(utils, 'checkNeedsUpdateInJanis');

describe('App check updates funtion', () => {
	const env = 'janis';
	const app = 'wms';
	const buildNumber = '123';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Works correctly', () => {
		it('could not verify for updates', async () => {
			updateFromStore.mockResolvedValueOnce({hasCheckedUpdate: false, needCheckInJanis: false});

			expect(await appCheckUpdates({buildNumber, env, app})).toEqual(defaultResponse);
		});

		it('there is no update available in the store', async () => {
			updateFromStore.mockResolvedValueOnce({hasCheckedUpdate: true, needCheckInJanis: false});
			expect(await appCheckUpdates({buildNumber, env, app})).toEqual({
				...defaultResponse,
				hasCheckedUpdate: true,
			});
		});

		it('there is no access to the store, you must check for janis', async () => {
			updateFromStore.mockResolvedValueOnce({hasCheckedUpdate: false, needCheckInJanis: true});
			await appCheckUpdates({buildNumber, env, app});
			expect(checkNeedsUpdateInJanis).toHaveBeenCalled();
		});
	});

	describe('checkIfJustUpdated', () => {
		it('should return true when update was completed', async () => {
			const mockCheckUpdate = NativeModules.ApkInstaller.checkUpdateCompleted as jest.Mock;
			mockCheckUpdate.mockResolvedValueOnce(true);

			const result = await checkIfJustUpdated();
			expect(result).toBe(true);
		});

		it('should return false when no update was pending', async () => {
			const mockCheckUpdate = NativeModules.ApkInstaller.checkUpdateCompleted as jest.Mock;
			mockCheckUpdate.mockResolvedValueOnce(false);

			const result = await checkIfJustUpdated();
			expect(result).toBe(false);
		});

		it('should return false when ApkInstaller is not available', async () => {
			const originalApkInstaller = NativeModules.ApkInstaller;
			NativeModules.ApkInstaller = undefined;

			const result = await checkIfJustUpdated();
			expect(result).toBe(false);

			NativeModules.ApkInstaller = originalApkInstaller;
		});

		it('should return false when checkUpdateCompleted throws error', async () => {
			const mockCheckUpdate = NativeModules.ApkInstaller.checkUpdateCompleted as jest.Mock;
			mockCheckUpdate.mockRejectedValueOnce(new Error('Test error'));

			const result = await checkIfJustUpdated();
			expect(result).toBe(false);
		});

		it('should return false on iOS platform', async () => {
			const mockPlatformGetter = jest.fn(() => 'ios');
			Object.defineProperty(Platform, 'OS', {
				get: mockPlatformGetter,
				configurable: true,
			});

			const result = await checkIfJustUpdated();
			expect(result).toBe(false);

			// Restaurar el mock de Platform a 'android'
			Object.defineProperty(Platform, 'OS', {
				get: jest.fn(() => 'android'),
				configurable: true,
			});
		});
	});
});
