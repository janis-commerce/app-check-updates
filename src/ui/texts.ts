export interface VersionCheckTexts {
	warningTitle: string;
	warningMessage: (blockingDate: Date) => string;
	blockingTitle: string;
	blockingMessage: (blockingDate: Date) => string;
	updateAvailableTitle: string;
	updateAvailableMessage: string;
	updateButton: string;
	laterButton: string;
	updateUnavailable: string;
	updateFailed: string;
}
