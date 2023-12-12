import {PermissionsAndroid} from 'react-native';
import RNFS from 'react-native-fs';
import {isDevEnv} from '../../utils';

interface IappCheckUpdates {
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
	buildNumber: string;
	currentVersion: string;
}

const updateFromJanis = ({env, app, currentVersion, buildNumber}: IappCheckUpdates) => {
	return async () => {
		const isDevEnvironment = isDevEnv();
		try {
			if (
				typeof env !== 'string' ||
				!env ||
				typeof app !== 'string' ||
				!app ||
				typeof buildNumber !== 'string' ||
				!buildNumber ||
				typeof currentVersion !== 'string' ||
				!currentVersion
			) {
				return false;
			}
			const validUrl = `https://mobile.${env}.in/api/download/${app}/android/latest`;

			await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
				PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
			]);

			const readGranted = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
			);
			const writeGranted = await PermissionsAndroid.check(
				PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
			);
			if (!readGranted || !writeGranted) {
				return false;
			}
			const envVersion = env === 'janisdev' ? '-beta' : env === 'janisqa' ? '-qa' : '';

			await RNFS.mkdir(`${RNFS.DownloadDirectoryPath}/${app}-apk`);

			const response = await RNFS.downloadFile({
				fromUrl: validUrl,
				toFile: `${RNFS.DownloadDirectoryPath}/${app}-apk/${app}${envVersion}.${currentVersion}.${buildNumber}.apk`,
			}).promise;

			return response.statusCode === 200;
		} catch (error) {
			if (isDevEnvironment) {
				// eslint-disable-next-line no-console
				console.error(error);
			}
			return false;
		}
	};
};

export default updateFromJanis;
