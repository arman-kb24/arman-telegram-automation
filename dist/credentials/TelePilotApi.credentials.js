"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelePilotApi = void 0;
class TelePilotApi {
    constructor() {
        this.name = 'telePilotApi';
        this.displayName = 'Arman Telegram Automation API';
        this.properties = [
            {
                displayName: 'App api_id',
                name: 'apiId',
                type: 'string',
                placeholder: '12348745646878',
                default: '',
                description: 'TBD',
                required: true,
            },
            {
                displayName: 'App api_hash',
                name: 'apiHash',
                type: 'string',
                placeholder: '17d2f8ab587',
                default: '',
                description: 'TBD',
                required: true,
            },
            {
                displayName: 'Phone Number',
                name: 'phoneNumber',
                type: 'string',
                default: '00123456789',
                description: 'Telegram Account Phone Number, used as Login',
                required: true,
            },
        ];
        this.test = {
            request: {
                baseURL: 'http://ls.telepilot.co:4413',
                url: '?key=empty',
                method: 'POST',
            },
        };
    }
}
exports.TelePilotApi = TelePilotApi;
//# sourceMappingURL=TelePilotApi.credentials.js.map