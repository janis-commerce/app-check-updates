import React, {ReactNode, createContext, useCallback, useContext, useMemo, useState} from 'react';
import getJanisAppInfo, {JanisAppInfo} from '../lib/appInfo';
import getVersionsInfo from '../lib/versions/getVersionsInfo';
import resolveVersionStatus from '../lib/minVersion/resolveVersionStatus';
import updateApp from '../lib/install/updateApp';
import isUpdateAvailable from '../lib/install/isUpdateAvailable';
import {DismissibleModal, dismiss, isDismissed} from '../lib/dismissals';
import {VersionCheckTexts} from '../ui/texts';
import UpdatePromptModal from '../ui/UpdatePromptModal';
import BlockingScreen from '../ui/BlockingScreen';

interface VersionCheckProviderProps {
	texts: VersionCheckTexts;
	warningTtl?: number;
	updateAvailableTtl?: number;
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
 */
export const VersionCheckProvider = ({
	texts,
	warningTtl = DEFAULT_TTL_MINUTES,
	updateAvailableTtl = DEFAULT_TTL_MINUTES,
	children,
}: VersionCheckProviderProps) => {
	const [visibleModal, setVisibleModal] = useState<VisibleModal | null>(null);
	const appInfo = useMemo(getJanisAppInfo, []);

	const checkVersion = useCallback(async () => {
		// Without a Janis bundle there is no versions.json to read
		if (!appInfo) {
			return;
		}

		const {env, app, buildNumber} = appInfo;
		// Once blocked the app stays blocked until it restarts, whatever a later check resolves
		const showModal = (modal: VisibleModal) =>
			setVisibleModal((current) => (current?.type === 'blocking' ? current : modal));

		const {versionsFile, now} = await getVersionsInfo({env, app});

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
			if (!isDismissed('warning')) {
				showModal({type: 'warning', blockingDate: versionStatus.blockingDate, newVersionNumber});
			}
			return;
		}

		if (isDismissed('updateAvailable')) {
			return;
		}

		if (
			await isUpdateAvailable({buildNumber, currentBuildNumber: versionsFile.currentBuildNumber})
		) {
			showModal({type: 'updateAvailable', newVersionNumber});
		}
	}, [appInfo]);

	const contextValue = useMemo(() => ({checkVersion}), [checkVersion]);

	// A modal is only shown after checkVersion found the app info
	const update = (newVersionNumber: string) =>
		updateApp({...(appInfo as JanisAppInfo), newVersionNumber});

	const postpone = (modal: DismissibleModal, ttl: number) => {
		dismiss(modal, ttl);
		setVisibleModal(null);
	};

	return (
		<VersionCheckContext.Provider value={contextValue}>
			{children}
			{visibleModal?.type === 'blocking' && (
				<BlockingScreen
					blockingDate={visibleModal.blockingDate}
					texts={texts}
					onUpdate={() => update(visibleModal.newVersionNumber)}
				/>
			)}
			{visibleModal?.type === 'warning' && (
				<UpdatePromptModal
					title={texts.warningTitle}
					message={texts.warningMessage(new Date(visibleModal.blockingDate))}
					texts={texts}
					onUpdate={() => update(visibleModal.newVersionNumber)}
					onClose={() => postpone('warning', warningTtl)}
				/>
			)}
			{visibleModal?.type === 'updateAvailable' && (
				<UpdatePromptModal
					title={texts.updateAvailableTitle}
					message={texts.updateAvailableMessage}
					texts={texts}
					onUpdate={() => update(visibleModal.newVersionNumber)}
					onClose={() => postpone('updateAvailable', updateAvailableTtl)}
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
