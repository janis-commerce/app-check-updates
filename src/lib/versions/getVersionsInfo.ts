import storage from '../storage';
import Crashlytics from '../crashlytics';
import {MinVersion} from '../minVersion/resolveVersionStatus';
import {isValidVersionsFile} from './validateVersionsFile';

export interface VersionsFile {
	currentVersion: string;
	currentBuildNumber: string;
	minVersions?: MinVersion[];
}

interface IgetVersionsInfo {
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
}

const VERSIONS_FILE_KEY = 'versionsFile';
const SERVER_TIME_KEY = 'lastServerTime';

// The CDN may answer from its cache: Age is the seconds elapsed since the origin stamped Date
const getServerTime = (headers: Headers) =>
	Date.parse(headers.get('date') ?? '') + Number(headers.get('age')) * 1000;

// The device clock alone can be set back to dodge the block, so it never goes below the last server time seen
const getFallbackTime = () => Math.max(Date.now(), storage.get<number>(SERVER_TIME_KEY) ?? 0);

/**
 * @name getVersionsInfo
 * @description gets versions.json and a trusted current time, falling back to the last saved file when offline
 * @param {string} env environment of janis
 * @param {string} app App name
 * @returns {object} { versionsFile: object | null, now: number, isVersionsFileFromCdn: boolean }
 */
const getVersionsInfo = async ({env, app}: IgetVersionsInfo) => {
	try {
		const validUrl = `https://cdn.mobile.${env}.in/${app}/android/versions.json`;
		Crashlytics.log('getVersionsInfo:', {validUrl});
		// RN's Android fetch keeps a disk cache that would replay stale Date and Age headers
		const response = await fetch(validUrl, {headers: {'Cache-Control': 'no-cache'}});

		if (!response.ok) {
			throw new Error(`versions.json responded with status ${response.status}`);
		}

		const versionsFile: unknown = await response.json();

		// An invalid file must not replace the last valid one saved for offline use
		if (!isValidVersionsFile(versionsFile)) {
			throw new Error('versions.json has an invalid format');
		}

		storage.set(VERSIONS_FILE_KEY, versionsFile);

		const serverTime = getServerTime(response.headers);
		if (Number.isNaN(serverTime)) {
			return {versionsFile, now: getFallbackTime(), isVersionsFileFromCdn: true};
		}

		storage.set(SERVER_TIME_KEY, serverTime);
		return {versionsFile, now: serverTime, isVersionsFileFromCdn: true};
	} catch (error: unknown) {
		Crashlytics.recordError(error, 'error getting versions file');
		return {
			versionsFile: storage.get<VersionsFile>(VERSIONS_FILE_KEY),
			now: getFallbackTime(),
			isVersionsFileFromCdn: false,
		};
	}
};

export default getVersionsInfo;
