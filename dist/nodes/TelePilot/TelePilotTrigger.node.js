"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelePilotTrigger = void 0;
const typedi_1 = require("typedi");
const debug = require('debug')('telepilot-trigger');
const TelePilotNodeConnectionManager_1 = require("./TelePilotNodeConnectionManager");
const updateEvents_1 = require("./tdlib/updateEvents");
class TelePilotTrigger {
    constructor() {
        this.description = {
            displayName: 'Arman Telegram Trigger',
            name: 'armanTelegramTrigger',
            icon: 'file:TelePilot.svg',
            group: ['trigger'],
            version: 1,
            description: 'Arman\'s Telegram User Automation - Listen to Telegram events with advanced filtering',
            defaults: {
                name: 'Arman Telegram Trigger',
            },
            inputs: [],
            outputs: ['main'],
            credentials: [
                {
                    name: 'telePilotApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Events',
                    name: 'events',
                    type: 'multiOptions',
                    options: [
                        {
                            name: '*',
                            value: '*',
                        },
                        ...updateEvents_1.TDLibUpdateEvents
                    ],
                    default: ['updateNewMessage', 'updateMessageContent'],
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add option',
                    default: {},
                    options: [
                        {
                            displayName: 'Ignore Groups Events',
                            description: 'Whether to ignore events for negative chat_ids',
                            name: 'ignoreGroups',
                            type: 'boolean',
                            default: false,
                        },
                        {
                            displayName: 'Filter by Chat IDs',
                            description: 'Only trigger for specific chat/channel IDs (comma-separated). Leave empty to receive all.',
                            name: 'filterChatIds',
                            type: 'string',
                            default: '',
                            placeholder: '-1001234567890, -1009876543210',
                        },
                        {
                            displayName: 'Filter Mode',
                            description: 'Choose whether to include or exclude the specified chat IDs',
                            name: 'filterMode',
                            type: 'options',
                            options: [
                                {
                                    name: 'Include Only (Whitelist)',
                                    value: 'include',
                                    description: 'Only trigger for the specified chat IDs',
                                },
                                {
                                    name: 'Exclude (Blacklist)',
                                    value: 'exclude',
                                    description: 'Trigger for all except the specified chat IDs',
                                },
                            ],
                            default: 'include',
                            displayOptions: {
                                show: {
                                    filterChatIds: [/.+/],
                                },
                            },
                        },
                    ]
                }
            ],
        };
    }
    async trigger() {
        const credentials = await this.getCredentials('telePilotApi');
        const cM = typedi_1.Container.get(TelePilotNodeConnectionManager_1.TelePilotNodeConnectionManager);
        let client;
        const clientSession = await cM.createClientSetAuthHandlerForPhoneNumberLogin(credentials === null || credentials === void 0 ? void 0 : credentials.apiId, credentials === null || credentials === void 0 ? void 0 : credentials.apiHash, credentials === null || credentials === void 0 ? void 0 : credentials.phoneNumber);
        debug("trigger.clientSession.authState: " + clientSession.authState);
        if (clientSession.authState != TelePilotNodeConnectionManager_1.TelepilotAuthState.WAIT_READY) {
            await cM.closeLocalSession(credentials === null || credentials === void 0 ? void 0 : credentials.apiId);
            this.emit([this.helpers.returnJsonArray([{ a: "Telegram account not logged in. " +
                            "Please use ChatTrigger node together with loginWithPhoneNumber action. " +
                            "Please check our guide at https://telepilot.co/login-howto" }])]);
        }
        client = clientSession.client;
        const updateEventsArray = this.getNodeParameter('events', '');
        const options = this.getNodeParameter('options', {});
        const filterChatIds = options.filterChatIds
            ? options.filterChatIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : [];
        const filterMode = options.filterMode || 'include';
        const _emit = (data) => {
            this.emit([this.helpers.returnJsonArray([data])]);
        };
        const _listener = (update) => {
            const incomingEvent = update._;
            if (updateEventsArray.includes(incomingEvent) || updateEventsArray.length == 0) {
                let chatId;
                const msg = update === null || update === void 0 ? void 0 : update.message;
                if (typeof msg === 'object' && msg !== null && 'chat_id' in msg) {
                    chatId = msg.chat_id;
                }
                else if ('chat_id' in update) {
                    chatId = update.chat_id;
                }
                if (options.ignoreGroups) {
                    if (typeof chatId === 'number' && chatId < 0) {
                        return;
                    }
                }
                if (filterChatIds.length > 0 && typeof chatId === 'number') {
                    const isInList = filterChatIds.includes(chatId);
                    if (filterMode === 'include' && !isInList) {
                        debug(`Filtered out chat_id ${chatId} (not in whitelist)`);
                        return;
                    }
                    else if (filterMode === 'exclude' && isInList) {
                        debug(`Filtered out chat_id ${chatId} (in blacklist)`);
                        return;
                    }
                }
                debug('Got update: ' + JSON.stringify(update, null, 2));
                _emit(update);
            }
        };
        if (this.getMode() !== 'manual') {
            client.on('update', _listener);
            client.on('error', debug);
        }
        async function closeFunction() {
            debug('closeFunction(' + updateEventsArray + ')');
            client.removeListener('update', _listener);
        }
        const manualTriggerFunction = async () => {
            await new Promise((resolve, reject) => {
                const timeoutHandler = setTimeout(() => {
                    reject(new Error('Aborted, no message received within 30secs. This 30sec timeout is only set for "manually triggered execution". Active Workflows will listen indefinitely.'));
                }, 30000);
                const _listener2 = (update) => {
                    const incomingEvent = update._;
                    if (updateEventsArray.includes(incomingEvent) || updateEventsArray.length == 0) {
                        debug('Got update in manual: ' + JSON.stringify(update, null, 2));
                        _emit(update);
                        clearTimeout(timeoutHandler);
                        client.removeListener('update', _listener2);
                        resolve(true);
                    }
                };
                client.on('update', _listener2);
            });
        };
        return {
            closeFunction,
            manualTriggerFunction,
        };
    }
}
exports.TelePilotTrigger = TelePilotTrigger;
exports.TelePilotTrigger = TelePilotTrigger;
//# sourceMappingURL=TelePilotTrigger.node.js.map