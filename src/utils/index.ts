/* istanbul ignore next */
/**
 * @name isDevEnv
 * @returns true if node env is development
 */
export const isDevEnv = () => {
	const {env} = process;
	const {NODE_ENV} = env;
	return NODE_ENV !== 'production';
};

export const customVersionComparator = (newAppV: string, appVersion: string): 0 | 1 | -1 => {
	if (newAppV > appVersion) {
		return 1;
	}

	if (newAppV < appVersion) {
		return -1;
	}
	return 0;
};
