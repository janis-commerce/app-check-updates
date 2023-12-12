import appCheckUpdates from './index';
import * as utils from './utils';
import {defaultResponse} from './utils';
import * as updateFromStorefn from './modules/updateFromStore';

const updateFromStore = jest.spyOn(updateFromStorefn, 'default');
const checkNeedsUpdateInJanis = jest.spyOn(utils, 'checkNeedsUpdateInJanis');

describe('App check updates funtion', () => {
	const env = 'janis';
	const app = 'wms';
	const buildNumber = '123';
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
});
