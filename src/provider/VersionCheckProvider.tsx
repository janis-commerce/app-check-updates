import React, {
	ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';
import getVersionsInfo from '../lib/versions/getVersionsInfo';
import resolveVersionStatus from '../lib/minVersion/resolveVersionStatus';
import updateApp from '../lib/install/updateApp';
import {VersionCheckTexts} from '../ui/texts';
import WarningModal from '../ui/WarningModal';
import BlockingScreen from '../ui/BlockingScreen';

interface VersionCheckProviderProps {
	env: 'janisdev' | 'janisqa' | 'janis';
	app: 'picking' | 'delivery' | 'wms';
	buildNumber: string;
	texts: VersionCheckTexts;
	children: ReactNode;
}

interface Blocking {
	blockingDate: string;
	newVersionNumber: string;
}

const VersionCheckContext = createContext({checkVersion: async () => {}});

/**
 * @name VersionCheckProvider
 * @description wraps the logged-in app and shows the min version warning or blocking when checkVersion is called
 * @param {string} env environment of janis
 * @param {string} app App name
 * @param {string} buildNumber current build number of the App
 * @param {object} texts translated texts; the messages receive the blocking date to format it
 */
export const VersionCheckProvider = ({
	env,
	app,
	buildNumber,
	texts,
	children,
}: VersionCheckProviderProps) => {
	const [warningDate, setWarningDate] = useState<string | null>(null);
	const [blocking, setBlocking] = useState<Blocking | null>(null);
	const hasShownWarning = useRef(false);

	const checkVersion = useCallback(async () => {
		const {versionsFile, now} = await getVersionsInfo({env, app});

		// Never fetched and offline: there is nothing to enforce yet
		if (!versionsFile) {
			return;
		}

		const versionStatus = resolveVersionStatus({
			minVersions: versionsFile.minVersions ?? [],
			buildNumber,
			now,
		});

		if (versionStatus.status === 'blocked') {
			setBlocking({
				blockingDate: versionStatus.blockingDate,
				newVersionNumber: `${versionsFile.currentVersion}.${versionsFile.currentBuildNumber}`,
			});
			return;
		}

		if (versionStatus.status === 'warning' && !hasShownWarning.current) {
			hasShownWarning.current = true;
			setWarningDate(versionStatus.blockingDate);
		}
	}, [env, app, buildNumber]);

	const contextValue = useMemo(() => ({checkVersion}), [checkVersion]);

	return (
		<VersionCheckContext.Provider value={contextValue}>
			{children}
			{blocking ? (
				<BlockingScreen
					blockingDate={blocking.blockingDate}
					texts={texts}
					onUpdate={() =>
						updateApp({env, app, buildNumber, newVersionNumber: blocking.newVersionNumber})
					}
				/>
			) : (
				!!warningDate && (
					<WarningModal
						blockingDate={warningDate}
						texts={texts}
						onClose={() => setWarningDate(null)}
					/>
				)
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
