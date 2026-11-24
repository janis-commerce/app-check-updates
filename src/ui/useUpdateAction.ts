import {useState} from 'react';
import {VersionCheckTexts} from './texts';

import type {UpdateResult} from '../lib/install/updateApp';

export type {UpdateResult};

type FeedbackTexts = Pick<VersionCheckTexts, 'updateUnavailable' | 'updateFailed'>;

/**
 * @name useUpdateAction
 * @description runs the update and tells why it did not start, with loading while it runs
 * @param {function} onUpdate starts the update and resolves its result
 * @param {object} texts updateUnavailable and updateFailed texts
 * @returns {object} { isUpdating, feedback, handleUpdate }
 */
const useUpdateAction = (onUpdate: () => Promise<UpdateResult>, texts: FeedbackTexts) => {
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);

	const feedbackByResult: Partial<Record<UpdateResult, string>> = {
		unavailable: texts.updateUnavailable,
		failed: texts.updateFailed,
	};

	const handleUpdate = async () => {
		setIsUpdating(true);
		setUpdateResult(await onUpdate());
		setIsUpdating(false);
	};

	return {
		isUpdating,
		feedback: updateResult ? feedbackByResult[updateResult] : undefined,
		handleUpdate,
	};
};

export default useUpdateAction;
