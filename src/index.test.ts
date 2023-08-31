import {Platform} from 'react-native';
import appCheckUpdates from './index';
import * as utils from './utils';
import mock from './mock.json';

const mockStartUpdate = jest.fn();
const mockCheckNeedUpdate = jest.fn().mockImplementation(() => mock);
const mockIsDevEnv = jest.spyOn(utils, 'isDevEnv');

jest.mock('sp-react-native-in-app-updates', () => {
	return {
		__esModule: true,
		default: jest.fn(() => ({
			checkNeedsUpdate: mockCheckNeedUpdate,
			startUpdate: mockStartUpdate,
		})),
		IAUUpdateKind: {
			FLEXIBLE: 1,
		},
	};
});

describe('App check updates funtion', () => {
	describe('Error handling', () => {
		it('CurVersion is not a string', () => {
			expect(appCheckUpdates({curVersion: ''})).resolves.toBe(null);
		});

		it('A promise is reject', async () => {
			mockIsDevEnv.mockReturnValueOnce(false);
			mockCheckNeedUpdate.mockRejectedValueOnce(() => new Error());
			const response = await appCheckUpdates({curVersion: '0.0.1'});
			expect(response).toEqual(false);
		});

		it('A promise is reject in debug mode', async () => {
			mockIsDevEnv.mockReturnValueOnce(true);
			mockCheckNeedUpdate.mockRejectedValueOnce(() => new Error());
			const response = await appCheckUpdates({curVersion: '0.0.1'});
			expect(response).toEqual(false);
		});
	});

	describe('Works correctly', () => {
		it('CheckNeedsUpdate is called', async () => {
			await appCheckUpdates({curVersion: '0.0.1'});

			expect(mockCheckNeedUpdate).toHaveBeenCalled();
		});

		it('StartUpdate is called', async () => {
			await appCheckUpdates({curVersion: '0.0.1'});

			expect(mockStartUpdate).toHaveBeenCalled();
		});

		it('Is a android device', async () => {
			Platform.OS = 'android';
			await appCheckUpdates({curVersion: '0.0.1'});

			expect(mockStartUpdate).toHaveBeenCalled();
		});

		it('shouldUpdate is false', async () => {
			mockCheckNeedUpdate.mockImplementationOnce(() => ({
				...mock,
				shouldUpdate: false,
			}));

			await appCheckUpdates({curVersion: '0.0.1'});

			expect(mockStartUpdate).toHaveBeenCalledTimes(0);
		});
	});
});
