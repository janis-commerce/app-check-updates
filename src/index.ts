import SpInAppUpdates, {IAUUpdateKind, StartUpdateOptions} from 'sp-react-native-in-app-updates';

interface IappCheckUpdates {
	curVersion: string;
	isAndroid?: boolean;
	isDebug?: boolean;
}

const appCheckUpdates = async ({
	curVersion,
	isAndroid = true,
	isDebug = false,
}: IappCheckUpdates) => {
	try {
		if (typeof curVersion !== 'string' || !curVersion) {
			return null;
		}
		const inAppUpdates = await new SpInAppUpdates(isDebug);

		const storeResponse = await inAppUpdates.checkNeedsUpdate({curVersion});

		if (storeResponse?.shouldUpdate) {
			let updateOptions: StartUpdateOptions = {};
			if (isAndroid) {
				// android only, on iOS the user will be promped to go to your app store page
				updateOptions = {
					updateType: IAUUpdateKind.FLEXIBLE,
				};
			}
			inAppUpdates.startUpdate(updateOptions);
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(error);
		Promise.reject();
	}
};

export default appCheckUpdates;
