interface ConfigurationFileVerses {
  book: string;
  chapter: number;
  verses: string;
  force?: boolean;
  options?: Record<string, {verseOffset: number}>;
}

export interface ConfigurationFile {
  version: string[];
  verses: ConfigurationFileVerses[];
}
