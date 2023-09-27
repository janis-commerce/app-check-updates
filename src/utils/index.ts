import SpInAppUpdates, {IAUInstallStatus, StatusUpdateEvent} from 'sp-react-native-in-app-updates';
/* istanbul ignore next */
/**
 * @name isDevEnv
 * @returns true if node env is development
 */
export const isDevEnv = () => {
	const {env} = process;
	const {NODE_ENV} = env;
	return NODE_ENV !== 'production';
};

/**
 * @name customVersionComparator
 * @description compares 2 versions of the app to determine if an update is necessary
 * @param {string} newAppV new version of the App
 * @param {string} appVersion current version of the App
 * @returns {number} returns 1 if the new version is greater, -1 if it is less, and 0 if they are equal
 */
export const customVersionComparator = (newAppV: string, appVersion: string): 0 | 1 | -1 => {
	if (newAppV > appVersion) {
		return 1;
	}

	if (newAppV < appVersion) {
		return -1;
	}
	return 0;
};

export const onStatusUpdate = async ({status}: StatusUpdateEvent, inAppUpdates: SpInAppUpdates) => {
	if (status === IAUInstallStatus.DOWNLOADED) {
		await inAppUpdates.installUpdate();
	}
};
