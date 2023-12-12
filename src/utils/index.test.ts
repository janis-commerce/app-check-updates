import SpInAppUpdates from 'sp-react-native-in-app-updates';
import {
	customVersionComparator,
	onStatusUpdate,
	checkNeedsUpdateInJanis,
	defaultResponse,
} from './index';
import mock from '../../__mocks__/janisMock.json';

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

	describe('checkNeedsUpdateInJanis funtion', () => {
		const env = 'janis';
		const app = 'picking';
		const buildNumber = '123';
		describe('Error handling', () => {
			it.each(['', 55, false, true, {}, [], null, NaN, undefined])(
				'should return dedault response',
				async (invalidValue) => {
					expect(
						await checkNeedsUpdateInJanis({
							env: invalidValue as any,
							app,
							buildNumber,
						})
					).toEqual(defaultResponse);

					expect(
						await checkNeedsUpdateInJanis({
							env,
							app: invalidValue as any,
							buildNumber,
						})
					).toEqual(defaultResponse);

					expect(
						await checkNeedsUpdateInJanis({
							env,
							app,
							buildNumber: invalidValue as any,
						})
					).toEqual(defaultResponse);
				}
			);

			it('The query api returns incorrect parameters', async () => {
				global.fetch = jest.fn(() =>
					Promise.resolve({json: () => Promise.resolve({currentVersion: 4123})})
				) as jest.Mock;

				const response = await checkNeedsUpdateInJanis({
					env,
					app,
					buildNumber: '123',
				});
				expect(response).toEqual(defaultResponse);
			});

			it('query api fails in production', async () => {
				const originalEnv = process.env;
				process.env = {
					...originalEnv,
					NODE_ENV: 'production',
				};
				global.fetch = jest.fn() as jest.Mock;

				const response = await checkNeedsUpdateInJanis({
					env,
					app,
					buildNumber: '123',
				});
				expect(response).toEqual(defaultResponse);
				process.env = originalEnv;
			});

			it('query api fails in dev env', async () => {
				global.fetch = jest.fn() as jest.Mock;

				const response = await checkNeedsUpdateInJanis({
					env,
					app,
					buildNumber: '123',
				});
				expect(response).toEqual(defaultResponse);
			});
		});

		it('new version of the app is available', async () => {
			global.fetch = jest.fn(() =>
				Promise.resolve({json: () => Promise.resolve(mock)})
			) as jest.Mock;
			const response = await checkNeedsUpdateInJanis({
				env,
				app,
				buildNumber: '123',
			});
			expect(response.hasCheckedUpdate).toBeTruthy();
			expect(response.shouldUpdateFromJanis).toBeTruthy();
		});
	});
});
