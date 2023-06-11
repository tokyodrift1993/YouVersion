interface RequiredOptions {
  configFilePath: string;
}

export interface GetVersesOptions extends RequiredOptions {
  templateOutputFormat: string;
  youVersionApiUrl: string;
  youVersionApiPath: string;
  youVersionApiAdditionalParams: string;
}
