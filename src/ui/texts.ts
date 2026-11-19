export interface VersionCheckTexts {
	warningTitle: string;
	warningMessage: (blockingDate: Date) => string;
	warningButton: string;
	blockingTitle: string;
	blockingMessage: (blockingDate: Date) => string;
	updateButton: string;
	updateUnavailable: string;
	updateFailed: string;
}
