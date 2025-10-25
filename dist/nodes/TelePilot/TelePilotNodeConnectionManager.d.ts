import 'reflect-metadata';
declare const Client: any;
export declare enum TelepilotAuthState {
    NO_CONNECTION = "NO_CONNECTION",
    WAIT_TDLIB_PARAMS = "authorizationStateWaitTdlibParameters",
    WAIT_ENCRYPTION_KEY = "authorizationStateWaitEncryptionKey",
    WAIT_PHONE_NUMBER = "authorizationStateWaitPhoneNumber",
    WAIT_CODE = "authorizationStateWaitCode",
    WAIT_DEVICE_CONFIRMATION = "authorizationStateWaitOtherDeviceConfirmation",
    WAIT_REGISTRATION = "authorizationStateWaitRegistration",
    WAIT_PASSWORD = "authorizationStateWaitPassword",
    WAIT_READY = "authorizationStateReady",
    WAIT_LOGGING_OUT = "authorizationStateLoggingOut",
    WAIT_CLOSING = "authorizationStateClosing",
    WAIT_CLOSED = "authorizationStateClosed"
}
declare class ClientSession {
    client: typeof Client;
    authState: TelepilotAuthState;
    phoneNumber: string;
    constructor(client: typeof Client, authState: TelepilotAuthState, phoneNumber: string);
}
export declare function sleep(ms: number): Promise<unknown>;
export declare class TelePilotNodeConnectionManager {
    private clientSessions;
    private tdlConfigured;
    private TD_DATABASE_PATH_PREFIX;
    private TD_FILES_PATH_PREFIX;
    constructor();
    closeLocalSession(apiId: number): Promise<any>;
    deleteLocalInstance(apiId: number): Promise<Record<string, string>>;
    getTdDatabasePathForClient(apiId: number): string;
    getTdFilesPathForClient(apiId: number): string;
    clientLoginWithPhoneNumber(apiId: number, apiHash: string, phone_number: string): Promise<string>;
    clientLoginSendAuthenticationCode(apiId: number, code: string): Promise<string>;
    clientLoginSendAuthenticationPassword(apiId: number, password: string): Promise<string>;
    createClientSetAuthHandlerForPhoneNumberLogin(apiId: number, apiHash: string, phoneNumber: string): Promise<ClientSession>;
    private initClient;
    private locateBinaryModules;
    markClientAsClosed(apiId: number): void;
    getAuthStateForCredential(apiId: number): TelepilotAuthState;
    getAllClientSessions(): {
        apiId: string;
        authState: TelepilotAuthState;
        phoneNumber: string;
    }[];
}
export {};
