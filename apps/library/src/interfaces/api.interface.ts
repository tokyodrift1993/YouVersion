export interface ApiVerseRequestParams {
  book: string;
  chapter: number;
  verses: string;
  version: string;
  force?: boolean | string;
}

export interface ApiVerseResponse {
  citation: string;
  passage: string;
  book: string;
  chapter: number;
  verses: string;
}
