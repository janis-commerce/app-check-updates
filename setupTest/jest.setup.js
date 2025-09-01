jest.mock('sp-react-native-in-app-updates', () => {
	return {
		__esModule: true,
		default: jest.fn(() => ({
			checkNeedsUpdate: jest.fn(),
			startUpdate: jest.fn(),
			addStatusUpdateListener: jest.fn(),
		})),
		IAUUpdateKind: {
			FLEXIBLE: 1,
		},
	};
});

jest.mock('react-native-fs', () => ({
	mkdir: jest.fn(),
	downloadFile: jest.fn(() => ({promise: {statusCode: 200}})),
	moveFile: jest.fn(),
	copyFile: jest.fn(),
	pathForBundle: jest.fn(),
	pathForGroup: jest.fn(),
	getFSInfo: jest.fn(),
	getAllExternalFilesDirs: jest.fn(),
	unlink: jest.fn(),
	exists: jest.fn(),
	stopDownload: jest.fn(),
	resumeDownload: jest.fn(),
	isResumable: jest.fn(),
	stopUpload: jest.fn(),
	completeHandlerIOS: jest.fn(),
	readDir: jest.fn(),
	readDirAssets: jest.fn(),
	existsAssets: jest.fn(),
	readdir: jest.fn(),
	setReadable: jest.fn(),
	stat: jest.fn(),
	readFile: jest.fn(),
	read: jest.fn(),
	readFileAssets: jest.fn(),
	hash: jest.fn(),
	copyFileAssets: jest.fn(),
	copyFileAssetsIOS: jest.fn(),
	copyAssetsVideoIOS: jest.fn(),
	writeFile: jest.fn(),
	appendFile: jest.fn(),
	write: jest.fn(),
	uploadFiles: jest.fn(),
	touch: jest.fn(),
	MainBundlePath: jest.fn(),
	CachesDirectoryPath: jest.fn(),
	DocumentDirectoryPath: jest.fn(),
	ExternalDirectoryPath: jest.fn(),
	ExternalStorageDirectoryPath: jest.fn(),
	TemporaryDirectoryPath: jest.fn(),
	LibraryDirectoryPath: jest.fn(),
	PicturesDirectoryPath: jest.fn(),
}));

jest.mock('@janiscommerce/app-crashlytics', () => ({
	__esModule: true,
	default: jest.fn(() => ({
		log: jest.fn(),
		recordError: jest.fn(),
	})),
}));

jest.mock('../src/utils/crashlytics/index.ts', () => ({
	__esModule: true,
	default: {
		log: jest.fn(),
		recordError: jest.fn(),
	},
}));
