interface IappCheckUpdates {
    curVersion: string;
    isAndroid?: boolean;
    isDebug?: boolean;
}
declare const appCheckUpdates: ({ curVersion, isAndroid, isDebug, }: IappCheckUpdates) => Promise<null | undefined>;
export default appCheckUpdates;
