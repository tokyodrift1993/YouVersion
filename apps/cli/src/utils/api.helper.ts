import querystring from 'querystring';

import {ApiVerseRequestParams} from '@tokyodrift1993/library/interfaces/api.interface';

export const buildVerseApiUrl = ({
  baseUrl,
  additionalParams,
  book,
  chapter,
  verses,
  version,
  force = false,
}: ApiVerseRequestParams & {baseUrl: string; additionalParams?: string}) =>
  [baseUrl, `?${querystring.stringify({book, chapter, verses, version, force})}`, additionalParams ? `&${additionalParams}` : ''].join('');
