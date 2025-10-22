declare module 'ApkInstaller' {
	export interface ApkInstallerInterface {
		install(filePath: string): Promise<boolean>;
	}
}
