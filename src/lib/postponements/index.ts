import storage from '../storage';

const WARNING_KEY = 'postponed.warning';
const NEW_VERSION_KEY = 'postponed.newVersion';

const postpone = (key: string, ttlMinutes: number) =>
	storage.set(key, true, {expiresAt: ttlMinutes});

const isPostponed = (key: string) => storage.get<boolean>(key) === true;

/**
 * @name postponeWarning
 * @description hides the min version warning until the TTL expires, even after a restart
 * @param {number} ttlMinutes minutes until the warning can be shown again
 */
export const postponeWarning = (ttlMinutes: number) => postpone(WARNING_KEY, ttlMinutes);

/**
 * @name isWarningPostponed
 * @returns {boolean} whether the user postponed the min version warning and its TTL has not expired yet
 */
export const isWarningPostponed = () => isPostponed(WARNING_KEY);

/**
 * @name postponeNewVersion
 * @description hides the new version modal, or Play's dialog, until the TTL expires, even after a restart
 * @param {number} ttlMinutes minutes until the new version can be offered again
 */
export const postponeNewVersion = (ttlMinutes: number) => postpone(NEW_VERSION_KEY, ttlMinutes);

/**
 * @name isNewVersionPostponed
 * @returns {boolean} whether the user postponed the new version and its TTL has not expired yet
 */
export const isNewVersionPostponed = () => isPostponed(NEW_VERSION_KEY);
