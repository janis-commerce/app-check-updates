import SpInAppUpdates, {IAUInstallStatus} from 'sp-react-native-in-app-updates';

// Each instance subscribes to Play's native events and never unsubscribes, so the package shares one
const inAppUpdates = new SpInAppUpdates(false);

let isInstallingWhenDownloaded = false;

/**
 * @name installWhenDownloaded
 * @description installs (and restarts the app) as soon as a flexible update ends downloading, like the previous flexible flow. Registers the listener once, however many updates start
 */
export const installWhenDownloaded = () => {
	if (isInstallingWhenDownloaded) {
		return;
	}
	isInstallingWhenDownloaded = true;
	inAppUpdates.addStatusUpdateListener(({status}) => {
		if (status === IAUInstallStatus.DOWNLOADED) {
			inAppUpdates.installUpdate();
		}
	});
};

export default inAppUpdates;
