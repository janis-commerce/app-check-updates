import {NativeModules} from 'react-native';

const {ApkInstaller} = NativeModules;

const PLAY_STORE_INSTALLER = 'com.android.vending';

export type InstallSource = 'playStore' | 'janis';

/**
 * @name getInstallSource
 * @description resolves where the app was installed from, by the installer package Android recorded
 * @returns {string} 'playStore' | 'janis'
 */
const getInstallSource = async (): Promise<InstallSource> => {
	const installer = await ApkInstaller.getInstallerPackageName();

	// Anything but Play Store (APK opened from Downloads, adb, MDM) can only be updated from Janis
	return installer === PLAY_STORE_INSTALLER ? 'playStore' : 'janis';
};

export default getInstallSource;
