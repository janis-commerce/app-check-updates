interface IcheckUpdateNeeded {
    curVersion: string;
    isAndroid?: boolean;
    isDebug?: boolean;
}
declare const checkUpdateNeeded: ({ curVersion, isAndroid, isDebug, }: IcheckUpdateNeeded) => Promise<void>;
export { checkUpdateNeeded };
