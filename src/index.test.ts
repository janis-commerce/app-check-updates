import 'react-native';
import appCheckUpdates from './index';
import mock from './mock.json';

const mockStartUpdate = jest.fn();
const mockCheckNeedUpdate = jest.fn().mockImplementation(() => mock);

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
			try {
				mockCheckNeedUpdate.mockRejectedValueOnce(() => new Error());
				await appCheckUpdates({curVersion: '0.0.1'});
			} catch (e) {
				expect(e).toEqual('Error');
			}
		});
	});

	describe('Works correctly', () => {
		it('CheckNeedsUpdate is called', async () => {
			await appCheckUpdates({curVersion: '0.0.1', isAndroid: true});

			expect(mockCheckNeedUpdate).toHaveBeenCalled();
		});

		it('StartUpdate is called', async () => {
			await appCheckUpdates({curVersion: '0.0.1', isAndroid: true});

			expect(mockStartUpdate).toHaveBeenCalled();
		});

		it('Is not a android device', async () => {
			await appCheckUpdates({curVersion: '0.0.1', isAndroid: false});

			expect(mockStartUpdate).toHaveBeenCalled();
		});

		it('shouldUpdate is false', async () => {
			mockCheckNeedUpdate.mockImplementationOnce(() => ({
				...mock,
				shouldUpdate: false,
			}));

			await appCheckUpdates({curVersion: '0.0.1', isAndroid: true});

			expect(mockStartUpdate).toHaveBeenCalledTimes(0);
		});
	});
});
