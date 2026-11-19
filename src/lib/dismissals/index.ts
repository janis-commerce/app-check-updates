import storage from '../storage';

export type DismissibleModal = 'warning' | 'updateAvailable';

const getKey = (modal: DismissibleModal) => `dismissed.${modal}`;

/**
 * @name dismiss
 * @description remembers that the user postponed a modal, so it is not shown again until the TTL expires, even after a restart
 * @param {string} modal 'warning' | 'updateAvailable'
 * @param {number} ttlMinutes minutes until the modal can be shown again
 */
export const dismiss = (modal: DismissibleModal, ttlMinutes: number) =>
	storage.set(getKey(modal), true, {expiresAt: ttlMinutes});

/**
 * @name isDismissed
 * @description whether the user postponed the modal and its TTL has not expired yet
 * @param {string} modal 'warning' | 'updateAvailable'
 * @returns {boolean}
 */
export const isDismissed = (modal: DismissibleModal) =>
	storage.get<boolean>(getKey(modal)) === true;
