import { Container } from 'typedi';

import {
	IDataObject,
	INodeType,
	INodeTypeDescription, ITriggerFunctions, ITriggerResponse,
} from 'n8n-workflow';

const debug = require('debug')('telepilot-trigger')

import {TelePilotNodeConnectionManager, TelepilotAuthState} from "./TelePilotNodeConnectionManager";
import { TDLibUpdateEvents } from './tdlib/updateEvents';
import { TDLibUpdate } from './tdlib/types'
import {Client} from "@telepilotco/tdl";


export class TelePilotTrigger implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
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
					...TDLibUpdateEvents
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
	// The execute method will go here


	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('telePilotApi');

		const cM = Container.get(TelePilotNodeConnectionManager)

		let client: Client;
		const clientSession = await cM.createClientSetAuthHandlerForPhoneNumberLogin(
			credentials?.apiId as number,
			credentials?.apiHash as string,
			credentials?.phoneNumber as string,
		);
		debug("trigger.clientSession.authState: " + clientSession.authState)
		if (clientSession.authState != TelepilotAuthState.WAIT_READY) {
			await cM.closeLocalSession(credentials?.apiId as number)
			this.emit([this.helpers.returnJsonArray([{a: "Telegram account not logged in. " +
				"Please use ChatTrigger node together with loginWithPhoneNumber action. " +
				"Please check our guide at https://telepilot.co/login-howto"}])])
		}

		client = clientSession.client;

		const updateEventsArray = this.getNodeParameter('events', '') as string;
		const options = this.getNodeParameter('options', {}) as {
			ignoreGroups: boolean;
			filterChatIds?: string;
			filterMode?: 'include' | 'exclude';
		}

		// Parse chat IDs filter
		const filterChatIds = options.filterChatIds 
			? options.filterChatIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
			: [];
		const filterMode = options.filterMode || 'include';

		const _emit = (data: IDataObject) => {
			this.emit([this.helpers.returnJsonArray([data])]);
		}

		const _listener = (update: IDataObject | TDLibUpdate) => {
			const incomingEvent = update._ as string;
			if (updateEventsArray.includes(incomingEvent) || updateEventsArray.length == 0) {
				// Extract chat_id from various possible locations
				let chatId: number | undefined;
				const msg = update?.message;
				
				if (typeof msg === 'object' && msg !== null && 'chat_id' in msg) {
					chatId = msg.chat_id as number;
				} else if ('chat_id' in update) {
					chatId = update.chat_id as number;
				}

				// Apply ignore groups filter
				if (options.ignoreGroups) {
					if (typeof chatId === 'number' && chatId < 0) {
						return;
					}
				}

				// Apply chat ID filter (whitelist/blacklist)
				if (filterChatIds.length > 0 && typeof chatId === 'number') {
					const isInList = filterChatIds.includes(chatId);
					
					if (filterMode === 'include' && !isInList) {
						// Whitelist mode: only allow specified chat IDs
						debug(`Filtered out chat_id ${chatId} (not in whitelist)`);
						return;
					} else if (filterMode === 'exclude' && isInList) {
						// Blacklist mode: exclude specified chat IDs
						debug(`Filtered out chat_id ${chatId} (in blacklist)`);
						return;
					}
				}

				debug('Got update: ' + JSON.stringify(update, null, 2));
				_emit(update);
			}
		}

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
					reject(
						new Error(
							'Aborted, no message received within 30secs. This 30sec timeout is only set for "manually triggered execution". Active Workflows will listen indefinitely.',
						),
					);
				}, 30000);

				const _listener2 = (update: IDataObject) => {
					const incomingEvent = update._ as string;
					if (updateEventsArray.includes(incomingEvent) || updateEventsArray.length == 0) {
						debug('Got update in manual: ' + JSON.stringify(update, null, 2));
						_emit(update);

						clearTimeout(timeoutHandler);
						client.removeListener('update', _listener2);
						resolve(true);
					}
				}
				client.on('update',	_listener2);
			});
		};

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}

exports.TelePilotTrigger = TelePilotTrigger;
