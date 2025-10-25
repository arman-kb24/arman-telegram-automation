"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelePilotNodeConnectionManager = exports.sleep = exports.TelepilotAuthState = void 0;
require("reflect-metadata");
const typedi_1 = require("typedi");
const { Client } = require('@telepilotco/tdl');
const tdl = require('@telepilotco/tdl');
const debug = require('debug')('telepilot-cm');
const fs = require('fs/promises');
var pjson = require('../../package.json');
const nodeVersion = pjson.version;
const binaryVersion = pjson.dependencies["@telepilotco/tdlib-binaries-prebuilt"].replace("^", "");
const addonVersion = pjson.dependencies["@telepilotco/tdl"].replace("^", "");
var TelepilotAuthState;
(function (TelepilotAuthState) {
    TelepilotAuthState["NO_CONNECTION"] = "NO_CONNECTION";
    TelepilotAuthState["WAIT_TDLIB_PARAMS"] = "authorizationStateWaitTdlibParameters";
    TelepilotAuthState["WAIT_ENCRYPTION_KEY"] = "authorizationStateWaitEncryptionKey";
    TelepilotAuthState["WAIT_PHONE_NUMBER"] = "authorizationStateWaitPhoneNumber";
    TelepilotAuthState["WAIT_CODE"] = "authorizationStateWaitCode";
    TelepilotAuthState["WAIT_DEVICE_CONFIRMATION"] = "authorizationStateWaitOtherDeviceConfirmation";
    TelepilotAuthState["WAIT_REGISTRATION"] = "authorizationStateWaitRegistration";
    TelepilotAuthState["WAIT_PASSWORD"] = "authorizationStateWaitPassword";
    TelepilotAuthState["WAIT_READY"] = "authorizationStateReady";
    TelepilotAuthState["WAIT_LOGGING_OUT"] = "authorizationStateLoggingOut";
    TelepilotAuthState["WAIT_CLOSING"] = "authorizationStateClosing";
    TelepilotAuthState["WAIT_CLOSED"] = "authorizationStateClosed";
})(TelepilotAuthState = exports.TelepilotAuthState || (exports.TelepilotAuthState = {}));
function getEnumFromString(enumObj, str) {
    for (const key in enumObj) {
        if (enumObj.hasOwnProperty(key) && enumObj[key] === str) {
            return enumObj[key];
        }
    }
    return undefined;
}
class ClientSession {
    constructor(client, authState, phoneNumber) {
        this.client = client;
        this.authState = authState;
        this.phoneNumber = phoneNumber;
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
let TelePilotNodeConnectionManager = class TelePilotNodeConnectionManager {
    constructor() {
        this.clientSessions = {};
        this.tdlConfigured = false;
        this.TD_DATABASE_PATH_PREFIX = process.env.HOME + "/.n8n/nodes/node_modules/@telepilotco/n8n-nodes-telepilot/db";
        this.TD_FILES_PATH_PREFIX = process.env.HOME + "/.n8n/nodes/node_modules/@telepilotco/n8n-nodes-telepilot/db";
    }
    async closeLocalSession(apiId) {
        debug("closeLocalSession apiId:" + apiId);
        let clients_keys = Object.keys(this.clientSessions);
        if (!clients_keys.includes(apiId.toString()) || this.clientSessions[apiId] === undefined) {
            throw new Error("You need to login first, please check our guide at https://telepilot.co/login-howto");
        }
        const clientSession = this.clientSessions[apiId];
        clientSession.client.off;
        let result = clientSession.client.close();
        delete this.clientSessions[apiId];
        debug(Object.keys(this.clientSessions));
        return result;
    }
    async deleteLocalInstance(apiId) {
        let clients_keys = Object.keys(this.clientSessions);
        if (!clients_keys.includes(apiId.toString()) || this.clientSessions[apiId] === undefined) {
            throw new Error("You need to login first, please check our guide at https://telepilot.co/login-howto");
        }
        const clientSession = this.clientSessions[apiId];
        try {
            await clientSession.client.invoke({
                _: 'close'
            });
        }
        catch (e) {
            debug("Connection was already closed");
        }
        let result = {};
        const removeDir = async (dirPath) => {
            await fs.rm(dirPath, { recursive: true });
        };
        const db_database_path = this.getTdDatabasePathForClient(apiId);
        await removeDir(db_database_path);
        result["db_database"] = `Removed ${db_database_path}`;
        const db_files_path = this.getTdFilesPathForClient(apiId);
        await removeDir(db_files_path);
        result["db_files"] = `Removed ${db_files_path}`;
        delete this.clientSessions[apiId];
        return result;
    }
    getTdDatabasePathForClient(apiId) {
        return `${this.TD_DATABASE_PATH_PREFIX}/${apiId}/_td_database`;
    }
    getTdFilesPathForClient(apiId) {
        return `${this.TD_FILES_PATH_PREFIX}/${apiId}/_td_files`;
    }
    async clientLoginWithPhoneNumber(apiId, apiHash, phone_number) {
        debug("clientLoginWithPhoneNumber");
        let clientSession = this.clientSessions[apiId];
        debug("clientLoginWithPhoneNumber.authState:" + clientSession.authState);
        if (clientSession.authState == TelepilotAuthState.WAIT_PHONE_NUMBER) {
            let result = await clientSession.client.invoke({
                _: 'setAuthenticationPhoneNumber',
                phone_number
            });
            return result;
        }
        return "";
    }
    async clientLoginSendAuthenticationCode(apiId, code) {
        debug("clientLoginSendAuthenticationCode");
        let clientSession = this.clientSessions[apiId];
        let result = await clientSession.client.invoke({
            _: 'checkAuthenticationCode',
            code
        });
        return result;
    }
    async clientLoginSendAuthenticationPassword(apiId, password) {
        debug("clientLoginSendAuthenticationPassword");
        let clientSession = this.clientSessions[apiId];
        let result = await clientSession.client.invoke({
            _: 'checkAuthenticationPassword',
            password
        });
        return result;
    }
    async createClientSetAuthHandlerForPhoneNumberLogin(apiId, apiHash, phoneNumber) {
        let client;
        if (this.clientSessions[apiId] === undefined) {
            client = this.initClient(apiId, apiHash);
            let clientSession = new ClientSession(client, TelepilotAuthState.NO_CONNECTION, phoneNumber);
            this.clientSessions[apiId] = clientSession;
        }
        const authHandler = (update) => {
            if (update._ === "updateAuthorizationState") {
                debug('authHandler.Got updateAuthorizationState:', JSON.stringify(update, null, 2));
                const authorization_state = update.authorization_state;
                if (this.clientSessions[apiId] !== undefined) {
                    this.clientSessions[apiId].authState = getEnumFromString(TelepilotAuthState, authorization_state._);
                    debug("set clientSession.authState to " + this.clientSessions[apiId].authState);
                }
            }
        };
        this.clientSessions[apiId].client
            .on('update', authHandler);
        await sleep(1000);
        return this.clientSessions[apiId];
    }
    initClient(apiId, apiHash) {
        let clients_keys = Object.keys(this.clientSessions);
        let { libFolder, libFile } = this.locateBinaryModules();
        debug("nodeVersion:", nodeVersion);
        debug("binaryVersion:", binaryVersion);
        debug("addonVersion:", addonVersion);
        if (!clients_keys.includes(apiId.toString()) || this.clientSessions[apiId] === undefined) {
            if (!this.tdlConfigured) {
                tdl.configure({
                    libdir: libFolder,
                    tdjson: libFile
                });
                this.tdlConfigured = true;
            }
            return tdl.createClient({
                apiId,
                apiHash,
                databaseDirectory: this.getTdDatabasePathForClient(apiId),
                filesDirectory: this.getTdFilesPathForClient(apiId),
                nodeVersion,
                binaryVersion,
                addonVersion
            });
        }
        else {
            return this.clientSessions[apiId].client;
        }
    }
    locateBinaryModules() {
        let _lib_prebuilt_package = "@telepilotco/tdlib-binaries-prebuilt/prebuilds/";
        let libFile = "";
        const libFolder = __dirname + "/../../../../" + _lib_prebuilt_package;
        if (process.arch === "x64") {
            switch (process.platform) {
                case "win32":
                    throw new Error("Your n8n installation is currently not supported, " +
                        "please refer to https://telepilot.co/nodes/telepilot/#win-x64");
                    break;
                case 'darwin':
                    throw new Error("Your n8n installation is currently not supported, " +
                        "please refer to https://telepilot.co/nodes/telepilot/#macos-x64");
                    break;
                case 'linux':
                    libFile = "libtdjson" + ".so";
                    break;
                default:
                    throw new Error("Not implemented for " + process.platform);
            }
        }
        else if (process.arch == "arm64") {
            switch (process.platform) {
                case "darwin":
                    libFile = "libtdjson" + ".dylib";
                    break;
                case "linux":
                    libFile = "libtdjson" + ".so";
                    break;
                default:
                    throw new Error("Your n8n installation is currently not supported, " +
                        "please refer to https://telepilot.co/nodes/telepilot/#win-arm64");
            }
        }
        return { libFolder, libFile };
    }
    markClientAsClosed(apiId) {
        debug("markClientAsClosed apiId:" + apiId);
        this.closeLocalSession(apiId);
    }
    getAuthStateForCredential(apiId) {
        if (this.clientSessions[apiId] === undefined) {
            return TelepilotAuthState.NO_CONNECTION;
        }
        else {
            const clientSession = this.clientSessions[apiId];
            return clientSession.authState;
        }
    }
    getAllClientSessions() {
        return Object.entries(this.clientSessions).map(([key, value]) => {
            return {
                apiId: key,
                authState: value.authState,
                phoneNumber: value.phoneNumber
            };
        });
    }
};
TelePilotNodeConnectionManager = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], TelePilotNodeConnectionManager);
exports.TelePilotNodeConnectionManager = TelePilotNodeConnectionManager;
//# sourceMappingURL=TelePilotNodeConnectionManager.js.map