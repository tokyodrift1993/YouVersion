interface RequiredOptions {
  configFilePath: string;
}

export interface GetVersesOptions extends RequiredOptions {
  templateOutputFormat: string;
  youVersionApiUrl: string;
  youVersionApiPath: string;
  youVersionApiAdditionalParams: string;
}

export type RetrieveAllVersesVersesOptions = Omit<GetVersesOptions, 'templateOutputFormat'>;
