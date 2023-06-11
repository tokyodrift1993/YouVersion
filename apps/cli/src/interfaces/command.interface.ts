interface RequiredOptions {
  configFilePath: string;
}

export interface GetVersesOptions extends RequiredOptions {
  outputFormat: string;
  youVersionApiUrl: string;
  youVersionApiPath: string;
  youVersionApiAdditionalParams: string;
}
