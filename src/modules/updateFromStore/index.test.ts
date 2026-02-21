import {Platform} from 'react-native';
import updateFromStore from './index';
import * as utils from '../../utils';
import mock from '../../../__mocks__/storeMock.json';

const mockStartUpdate = jest.fn();
const mockCheckNeedUpdate = jest.fn().mockImplementation(() => mock);
const mockAddStatusUpdateListener = jest.fn();
const mockIsDevEnv = jest.spyOn(utils, 'isDevEnv');

jest.mock('sp-react-native-in-app-updates', () => {
	return {
		__esModule: true,
		default: jest.fn(() => ({
			checkNeedsUpdate: mockCheckNeedUpdate,
			startUpdate: mockStartUpdate,
			addStatusUpdateListener: mockAddStatusUpdateListener,
		})),
		IAUUpdateKind: {
			FLEXIBLE: 1,
		},
	};
});

const defaultResponse = {hasCheckedUpdate: false, needCheckInJanis: false};
describe('updateFromStore', () => {
	describe('Error handling', () => {
		it('buildNumber is not a string', () => {
			expect(updateFromStore({buildNumber: ''})).resolves.toStrictEqual(defaultResponse);
		});

		it('A promise is reject', async () => {
			mockIsDevEnv.mockReturnValueOnce(false);
			mockCheckNeedUpdate.mockRejectedValueOnce(new Error());
			const response = await updateFromStore({buildNumber: '2050'});
			expect(response).toEqual(defaultResponse);
		});

		it('A promise is reject in checkNeedsUpdate method', async () => {
			mockIsDevEnv.mockReturnValueOnce(false);
			mockCheckNeedUpdate.mockRejectedValueOnce(new Error('checkNeedsUpdate'));
			const response = await updateFromStore({buildNumber: '2050'});
			expect(response).toEqual({...defaultResponse, needCheckInJanis: true});
		});

		it('A promise is reject in debug mode', async () => {
			mockIsDevEnv.mockReturnValueOnce(true);
			mockCheckNeedUpdate.mockRejectedValueOnce(new Error());
			const response = await updateFromStore({buildNumber: '2050'});
			expect(response).toEqual(defaultResponse);
		});
	});

	describe('Works correctly', () => {
		it('CheckNeedsUpdate is called', async () => {
			await updateFromStore({buildNumber: '2050'});

			expect(mockCheckNeedUpdate).toHaveBeenCalled();
		});

		it('StartUpdate is called', async () => {
			await updateFromStore({buildNumber: '2050'});

			expect(mockAddStatusUpdateListener).toHaveBeenCalled();
			expect(mockStartUpdate).toHaveBeenCalled();
		});

		it('Is a android device', async () => {
			Platform.OS = 'android';
			await updateFromStore({buildNumber: '2050'});

			expect(mockStartUpdate).toHaveBeenCalled();
		});

		it('shouldUpdate is false', async () => {
			mockCheckNeedUpdate.mockImplementationOnce(() => ({
				...mock,
				shouldUpdate: false,
			}));

			const response = await updateFromStore({buildNumber: '2650'});

			expect(mockStartUpdate).toHaveBeenCalledTimes(0);
			expect(response).toEqual({...defaultResponse, hasCheckedUpdate: true});
		});
	});
});
