// import {Platform} from 'react-native';
import updateFromJanis from './index';
import * as utils from '../../utils';

const mockIsDevEnv = jest.spyOn(utils, 'isDevEnv');

const mockRequestMultiple = jest.fn(() => new Promise((resolve) => resolve(true)));
const mockCheck = jest.fn();

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
	describe('Error handling', () => {
		it.each(['', 5, [], {}, jest.fn(), undefined, null, NaN])(
			'param is not valid',
			async (invalidValue) => {
				await expect(
					updateFromJanis({
						env: invalidValue as any,
						app: 'wms',
						newVersion: '1.1.0.2345',
					})
				).rejects.toThrow('the parameters are incorrect');

				await expect(
					updateFromJanis({
						env: 'janisdev',
						app: invalidValue as any,
						newVersion: '1.1.0.2345',
					})
				).rejects.toThrow('the parameters are incorrect');

				await expect(
					updateFromJanis({
						env: 'janisdev',
						app: 'wms',
						newVersion: invalidValue as any,
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
					newVersion: '2.0.0.2345',
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
					newVersion: '2.0.0.2345',
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
					newVersion: '2.0.0.2345',
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
					newVersion: '2.0.0.2345',
				})
			).rejects.toThrow('Error');
		});
	});

	describe('Works correctly', () => {
		it('works correctly in janisdev environment without asking permissions', async () => {
			mockVersion.mockReturnValueOnce(33);
			await expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersion: '2.0.0.2345',
				})
			).resolves.toEqual(true);
		});
		it('works correctly in janisqa environment with invalid callback', async () => {
			mockCheck.mockResolvedValue(true);
			await expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersion: '2.0.0.2345',
					DownloadProgressCallback: null as any,
				})
			).resolves.toEqual(true);
		});
		it('works correctly in janis environment with valid callback', async () => {
			mockCheck.mockResolvedValue(true);
			const DownloadProgressCallback = () => {};
			await expect(
				updateFromJanis({
					env: 'janisdev',
					app: 'wms',
					newVersion: '2.0.0.2345',
					DownloadProgressCallback,
				})
			).resolves.toEqual(true);
		});
	});
});
