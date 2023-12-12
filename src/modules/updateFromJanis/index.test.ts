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
describe('App check updates funtion', () => {
	describe('Error handling', () => {
		it.each(['', 5, [], {}, jest.fn(), undefined, null, NaN])(
			'param is not valid',
			async (invalidValue) => {
				const updateTestEnv = updateFromJanis({
					env: invalidValue as any,
					app: 'wms',
					currentVersion: '1.1.0',
					buildNumber: '10',
				});
				expect(await updateTestEnv()).toBeFalsy();
				const updateTestApp = updateFromJanis({
					env: 'janis',
					app: invalidValue as any,
					currentVersion: '1.1.0',
					buildNumber: '10',
				});
				expect(await updateTestApp()).toBeFalsy();
				const updateTestCv = updateFromJanis({
					env: 'janis',
					app: 'wms',
					currentVersion: invalidValue as any,
					buildNumber: '10',
				});
				expect(await updateTestCv()).toBeFalsy();
				const updateTestBn = updateFromJanis({
					env: 'janis',
					app: 'wms',
					currentVersion: '1.1.0',
					buildNumber: invalidValue as any,
				});
				expect(await updateTestBn()).toBeFalsy();
			}
		);

		it('does not have to read storage permissions', async () => {
			mockCheck.mockResolvedValueOnce(false);
			const updateFn = updateFromJanis({
				env: 'janisdev',
				app: 'wms',
				currentVersion: '1.1.0',
				buildNumber: '10',
			});
			expect(await updateFn()).toEqual(false);
		});

		it('does not have to write storage permissions', async () => {
			mockCheck.mockResolvedValueOnce(true);
			mockCheck.mockResolvedValueOnce(false);
			const updateFn = updateFromJanis({
				env: 'janisdev',
				app: 'wms',
				currentVersion: '1.1.0',
				buildNumber: '10',
			});
			expect(await updateFn()).toEqual(false);
		});

		it('dont log the error', async () => {
			mockCheck.mockRejectedValueOnce(new Error());
			mockIsDevEnv.mockReturnValueOnce(false);
			const updateFn = updateFromJanis({
				env: 'janisdev',
				app: 'wms',
				currentVersion: '1.1.0',
				buildNumber: '10',
			});
			expect(await updateFn()).toEqual(false);
		});
		it('log the error in dev env', async () => {
			mockCheck.mockRejectedValueOnce(new Error());
			mockIsDevEnv.mockReturnValueOnce(true);
			const updateFn = updateFromJanis({
				env: 'janisdev',
				app: 'wms',
				currentVersion: '1.1.0',
				buildNumber: '10',
			});
			expect(await updateFn()).toEqual(false);
		});
	});

	describe('Works correctly', () => {
		it('works correctly in janisdev environment', async () => {
			mockCheck.mockResolvedValue(true);
			const updateFn = updateFromJanis({
				env: 'janisdev',
				app: 'wms',
				currentVersion: '1.1.0',
				buildNumber: '10',
			});
			expect(await updateFn()).toEqual(true);
		});
		it('works correctly in janisqa environment with invalid callback', async () => {
			mockCheck.mockResolvedValue(true);
			const updateFn = updateFromJanis({
				env: 'janisqa',
				app: 'wms',
				currentVersion: '1.1.0',
				buildNumber: '10',
			});
			expect(await updateFn(null as any)).toEqual(true);
		});
		it('works correctly in janis environment with valid callback', async () => {
			mockCheck.mockResolvedValue(true);
			const callback = () => {};
			const updateFn = updateFromJanis({
				env: 'janis',
				app: 'wms',
				currentVersion: '1.1.0',
				buildNumber: '10',
			});
			expect(await updateFn(callback)).toEqual(true);
		});
	});
});
