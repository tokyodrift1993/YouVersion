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

const buildVerseApiUrl = ({
  baseUrl,
  additionalParams,
  book,
  chapter,
  verses,
  version,
  force = false,
}: ApiVerseRequestParams & {baseUrl: string; additionalParams?: string}) =>
  [baseUrl, `?${querystring.stringify({book, chapter, verses, version, force})}`, additionalParams ? `&${additionalParams}` : ''].join('');

getVerses
  .name('get-verses')
  .description('Gets verses over the YouVersion Express Api defined in the env file.')
  .requiredOption('--config-file-path <config-file-path>', 'Path to config file')
  .addOption(new Option('--you-version-api-url <you-version-api-url>', 'turn off colour output').env('YOU_VERSION_CLI_API_URL'))
  .addOption(new Option('--you-version-api-path <you-version-api-path>', 'turn off colour output').env('YOU_VERSION_CLI_API_PATH'))
  .addOption(
    new Option('--you-version-api-additional-params <you-version-api-additional-params>', 'turn off colour output').env(
      'YOU_VERSION_CLI_API_ADDITIONAL_PARAMS',
    ),
  )
  .addOption(
    new Option('--template-output-format <template-output-format>', 'Template for output format').env(
      'YOU_VERSION_CLI_TEMPLATE_OUTPUT_FORMAT',
    ),
  )
  .action(async (opts: GetVersesCommandOptions) => {
    const youVersionApiUrl = opts.youVersionApiUrl;
    const youVersionApiPath = opts.youVersionApiPath;
    const youVersionApiAdditionalParams = opts.youVersionApiAdditionalParams;

    // ===> pre checks
    if (!(youVersionApiUrl && youVersionApiPath)) {
      console.error(
        'ENV variable "YOU_VERSION_CLI_API_URL" and/or "YOU_VERSION_CLI_API_PATH" or parameter "--you-version-api-url" and/or "--you-version-api-path" must be set!',
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
              additionalParams: youVersionApiAdditionalParams,
              book: verse.book,
              chapter: verse.chapter,
              verses: verse.verses + (verse.options?.[version]?.verseOffset || 0),
              version: version,
              force: verse.force,
            }),
          )
        ).data;
      }

      results.push(format(`${opts.templateOutputFormat}`, ...Object.values(apiVerseResponses)));
    }

    console.log(results.join('').trim());
  });
