interface ConfigurationFileVerses {
  book: string;
  chapter: number;
  verses: string;
  force?: boolean;
}

export interface ConfigurationFile {
  version: string[];
  verses: ConfigurationFileVerses[];
}
