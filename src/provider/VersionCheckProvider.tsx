import React, {ReactNode, createContext, useCallback, useContext, useMemo, useState} from 'react';
import getJanisAppInfo, {JanisAppInfo} from '../lib/appInfo';
import getVersionsInfo from '../lib/versions/getVersionsInfo';
import resolveVersionStatus from '../lib/minVersion/resolveVersionStatus';
import updateApp, {UpdateMode} from '../lib/install/updateApp';
import isUpdateAvailable from '../lib/install/isUpdateAvailable';
import getInstallSource from '../lib/install/getInstallSource';
import {
	isNewVersionPostponed,
	isWarningPostponed,
	postponeNewVersion,
	postponeWarning,
} from '../lib/postponements';
import {VersionCheckTexts} from '../ui/texts';
import UpdatePrompt from '../ui/UpdatePrompt';
import BlockingScreen from '../ui/BlockingScreen';

interface VersionCheckProviderProps {
	texts: VersionCheckTexts;
	warningTtl?: number;
	updateAvailableTtl?: number;
	debug?: boolean;
	children: ReactNode;
}

type VisibleModal =
	| {type: 'blocking'; blockingDate: string; newVersionNumber: string}
	| {type: 'warning'; blockingDate: string; newVersionNumber: string}
	| {type: 'updateAvailable'; newVersionNumber: string};

const DEFAULT_TTL_MINUTES = 120;

const VersionCheckContext = createContext({checkVersion: async () => {}});

/**
 * @name VersionCheckProvider
 * @description wraps the logged-in app and, when checkVersion is called, shows the blocking screen, the min version warning or the new version modal, in that priority
 * @param {object} texts translated texts; the min version messages receive the blocking date to format it
 * @param {number} warningTtl minutes the warning stays hidden after the user postpones it (default 120)
 * @param {number} updateAvailableTtl minutes the new version modal stays hidden after the user postpones it (default 120)
 * @param {boolean} debug checks also on development builds (__DEV__), to try the flows (default false)
 */
export const VersionCheckProvider = ({
	texts,
	warningTtl = DEFAULT_TTL_MINUTES,
	updateAvailableTtl = DEFAULT_TTL_MINUTES,
	debug = false,
	children,
}: VersionCheckProviderProps) => {
	const [visibleModal, setVisibleModal] = useState<VisibleModal | null>(null);
	const appInfo = useMemo(getJanisAppInfo, []);

	// Only called once checkVersion found the app info
	const update = useCallback(
		(newVersionNumber: string, mode: UpdateMode) =>
			updateApp({...(appInfo as JanisAppInfo), newVersionNumber, mode}),
		[appInfo]
	);

	const checkVersion = useCallback(async () => {
		// Without a Janis bundle there is no versions.json to read
		if (!appInfo) {
			return;
		}

		const {env, app, buildNumber} = appInfo;

		// Local builds are below every published version, so they would always be offered updates or
		// blocked; debug turns the check on to try the flows. Published builds are never __DEV__
		if (__DEV__ && !debug) {
			return;
		}
		// Once blocked the app stays blocked until it restarts, whatever a later check resolves
		const showModal = (modal: VisibleModal) =>
			setVisibleModal((current) => (current?.type === 'blocking' ? current : modal));

		const {versionsFile, now, isVersionsFileFromCdn} = await getVersionsInfo({env, app});

		// Never fetched and offline: there is nothing to enforce yet
		if (!versionsFile) {
			return;
		}

		const newVersionNumber = `${versionsFile.currentVersion}.${versionsFile.currentBuildNumber}`;
		const versionStatus = resolveVersionStatus({
			minVersions: versionsFile.minVersions ?? [],
			buildNumber,
			now,
		});

		if (versionStatus.status === 'blocked') {
			showModal({type: 'blocking', blockingDate: versionStatus.blockingDate, newVersionNumber});
			return;
		}

		// The warning already asks to update, so it replaces the new version modal even when postponed
		if (versionStatus.status === 'warning') {
			if (!isWarningPostponed()) {
				showModal({type: 'warning', blockingDate: versionStatus.blockingDate, newVersionNumber});
			}
			return;
		}

		// A saved file can't be downloaded offline, so only one just downloaded from the CDN offers the new version
		if (!isVersionsFileFromCdn || isNewVersionPostponed()) {
			return;
		}

		const hasNewVersion = await isUpdateAvailable({
			buildNumber,
			currentBuildNumber: versionsFile.currentBuildNumber,
		});
		if (!hasNewVersion) {
			return;
		}

		const source = await getInstallSource().catch(() => 'janis');

		// Play shows its own dialog, which has no memory of a rejection, so the TTL is what keeps it from
		// popping up on every check
		if (source === 'playStore') {
			postponeNewVersion(updateAvailableTtl);
			await update(newVersionNumber, 'flexible');
			return;
		}

		showModal({type: 'updateAvailable', newVersionNumber});
	}, [appInfo, debug, updateAvailableTtl, update]);

	const contextValue = useMemo(() => ({checkVersion}), [checkVersion]);

	const postponeWarningPrompt = () => {
		postponeWarning(warningTtl);
		setVisibleModal(null);
	};

	const postponeNewVersionPrompt = () => {
		postponeNewVersion(updateAvailableTtl);
		setVisibleModal(null);
	};

	// Once the update started it goes on in the background, so the prompt gets out of the way until its TTL
	const updateFromPrompt = async (newVersionNumber: string, postponePrompt: () => void) => {
		const result = await update(newVersionNumber, 'flexible');
		if (result === 'started') {
			postponePrompt();
		}
		return result;
	};

	return (
		<VersionCheckContext.Provider value={contextValue}>
			{children}
			{visibleModal?.type === 'blocking' && (
				<BlockingScreen
					blockingDate={visibleModal.blockingDate}
					texts={texts}
					onUpdate={() => update(visibleModal.newVersionNumber, 'immediate')}
				/>
			)}
			{visibleModal?.type === 'warning' && (
				<UpdatePrompt
					title={texts.warningTitle}
					message={texts.warningMessage(new Date(visibleModal.blockingDate))}
					texts={texts}
					onUpdate={() => updateFromPrompt(visibleModal.newVersionNumber, postponeWarningPrompt)}
					onClose={postponeWarningPrompt}
				/>
			)}
			{visibleModal?.type === 'updateAvailable' && (
				<UpdatePrompt
					title={texts.updateAvailableTitle}
					message={texts.updateAvailableMessage}
					texts={texts}
					onUpdate={() => updateFromPrompt(visibleModal.newVersionNumber, postponeNewVersionPrompt)}
					onClose={postponeNewVersionPrompt}
				/>
			)}
		</VersionCheckContext.Provider>
	);
};

/**
 * @name useVersionCheck
 * @description gives access to checkVersion, to be called on the safe points of the app (Home and lists before starting a job)
 * @returns {object} { checkVersion: () => Promise<void> }
 */
export const useVersionCheck = () => useContext(VersionCheckContext);
