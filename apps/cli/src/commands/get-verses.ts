import axios from 'axios';
import {Command, Option} from 'commander';
import querystring from 'querystring';
import format from 'string-format';

import {GetVersesOptions} from '../interfaces/command.interface';
import {getConfigurationFile} from '../utils/filer.helper';

// DKTODO: create a shared library
interface ApiVerseRequestParams {
  book: string;
  chapter: number;
  verses: string;
  version: string;
  force?: boolean;
}
interface ApiVerseResponse {
  citation: string;
  passage: string;
  book: string;
  chapter: number;
  verses: string;
}

export const getVerses = new Command();

interface GetVersesCommandOptions extends GetVersesOptions, Command {}

const buildVerseApiUrl = ({baseUrl, book, chapter, verses, version, force = false}: ApiVerseRequestParams & {baseUrl: string}) =>
  [baseUrl, `?${querystring.stringify({book, chapter, verses, version, force})}`].join('');

getVerses
  .name('get-verses')
  .description('Gets verses over the YouVersion Express Api defined in the env file.')
  .requiredOption('--config-file-path <config-file-path>', 'Path to config file')
  .addOption(new Option('--you-version-api-url <you-version-api-url>', 'turn off colour output').env('YOU_VERSION_API_URL'))
  .addOption(new Option('--you-version-api-path <you-version-api-path>', 'turn off colour output').env('YOU_VERSION_API_PATH'))
  .option('--output-format <output-format>', 'Format', '{0.passage}\n–\n{1.passage}\n{0.book} | {1.book} {0.chapter}:{0.verses}\n\n')
  .action(async (opts: GetVersesCommandOptions) => {
    const youVersionApiUrl = opts.youVersionApiUrl;
    const youVersionApiPath = opts.youVersionApiPath;

    // ===> pre checks
    if (!(youVersionApiUrl && youVersionApiPath)) {
      console.error(
        'ENV variable "YOU_VERSION_API_URL" and/or "YOU_VERSION_API_PATH" or parameter "--you-version-api-url" and/or "--you-version-api-path" must be set!',
      );

      return;
    }

    const config = await getConfigurationFile(opts.configFilePath);

    const results: string[] = [];

    for (const verse of Object.values(config.verses)) {
      const apiVerseResponses: Record<string, ApiVerseResponse> = {};

      for (const [innerIndex, version] of Object.entries(config.version)) {
        apiVerseResponses[innerIndex] = (
          await axios.get<ApiVerseResponse>(
            buildVerseApiUrl({
              baseUrl: [youVersionApiUrl, youVersionApiPath].join(''),
              book: verse.book,
              chapter: verse.chapter,
              verses: verse.verses,
              version: version,
              force: verse.force,
            }),
          )
        ).data;
      }

      results.push(format(`${opts.outputFormat}`, ...Object.values(apiVerseResponses)));
    }

    console.log(results.join('').trim());
  });
