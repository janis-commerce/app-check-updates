// @ts-ignore the package ships no type declarations
import {getAppInfo, getBuildNumber, getBundleId} from '@janiscommerce/app-device-info';

export type JanisEnv = 'janisdev' | 'janisqa' | 'janis';
export type JanisApp = 'picking' | 'delivery' | 'wms';

export interface JanisAppInfo {
	env: JanisEnv;
	app: JanisApp;
	buildNumber: string;
}

const JANIS_APPS: string[] = ['picking', 'delivery', 'wms'];

/**
 * @name getJanisAppInfo
 * @description reads the Janis env, app and build from the installed package, so the app does not have to pass them
 * @returns {object | null} { env, app, buildNumber }, or null when the package is not a Janis app
 */
const getJanisAppInfo = (): JanisAppInfo | null => {
	const {janisEnv} = getAppInfo();
	// The bundle id is in.janis.<app>, with .beta or .qa appended outside production
	const app = String(getBundleId() ?? '').split('.')[2];

	if (!janisEnv || !JANIS_APPS.includes(app)) {
		return null;
	}

	return {env: janisEnv, app: app as JanisApp, buildNumber: String(getBuildNumber())};
};

export default getJanisAppInfo;
