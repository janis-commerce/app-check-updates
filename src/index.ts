import updateFromStore from './modules/updateFromStore';
import {checkNeedsUpdateInJanis, defaultResponse} from './utils';

interface IappCheckUpdates {
	buildNumber: string;
	isDebug?: boolean;
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
}

const appCheckUpdates = async ({buildNumber, isDebug = false, env, app}: IappCheckUpdates) => {
	const {hasCheckedUpdate, needCheckInJanis} = await updateFromStore({buildNumber, isDebug});

	if (hasCheckedUpdate) {
		return {
			...defaultResponse,
			hasCheckedUpdate,
		};
	}

	if (needCheckInJanis) {
		return checkNeedsUpdateInJanis({buildNumber, env, app});
	}
	return defaultResponse;
};

export default appCheckUpdates;
