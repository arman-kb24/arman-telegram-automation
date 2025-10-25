import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class TelePilotApi implements ICredentialType {
    name: string;
    displayName: string;
    properties: INodeProperties[];
    test: ICredentialTestRequest;
}
