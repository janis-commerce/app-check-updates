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

/**
 * @function isString
 * @param {any} str - Value to validate.
 * @description If the type of the argument is a string, return true, otherwise return false.
 * @returns {bool}
 */

export const isString = (str: any) => typeof str === 'string';
