import axios from 'axios';
import {Command} from 'commander';
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
  .option('--output-format <output-format>', 'Format', '{0.passage}\n–\n{1.passage}\n{0.book} | {1.book} {0.chapter}:{0.verses}\n\n')
  .action(async (opts: GetVersesCommandOptions) => {
    const YOU_VERSION_API_URL = process.env.YOU_VERSION_API_URL;
    const YOU_VERSION_API_PATH = process.env.YOU_VERSION_API_PATH;

    // ===> pre checks
    if (!(YOU_VERSION_API_URL && YOU_VERSION_API_PATH)) {
      console.error('ENV variable "YOU_VERSION_API_URL" adn "YOU_VERSION_API_PATH" must be set!');

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
              baseUrl: [YOU_VERSION_API_URL, YOU_VERSION_API_PATH].join(''),
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
