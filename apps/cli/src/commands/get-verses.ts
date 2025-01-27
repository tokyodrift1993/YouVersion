import * as process from 'process';
import querystring from 'querystring';
import axios, {AxiosError} from 'axios';
import {Command, Option} from 'commander';
import format from 'string-format';

import {ApiVerseResponse} from '@tokyodrift1993/library/interfaces/api.interface';

import {GetVersesOptions} from '../interfaces/command.interface';
import {buildVerseApiUrl} from '../utils/api.helper';
import {getConfigurationFile} from '../utils/filer.helper';

export const getVerses = new Command();

interface GetVersesCommandOptions extends GetVersesOptions, Command {}

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
    new Option('--template-output-format <template-output-format>', 'Template for output format')
      .default('{0.passage}\n{0.book} {0.chapter}:{0.verses}\n\n')
      .env('YOU_VERSION_CLI_TEMPLATE_OUTPUT_FORMAT'),
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

    try {
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
    } catch (e) {
      console.error(
        'Error happened:',
        e instanceof AxiosError && e?.response?.data
          ? JSON.stringify(
              {
                response: e.response.data,
                request: querystring.parse('path' in e.request ? e.request.path.match(/\?(.*)/)?.[1] : ''),
              },
              null,
              4,
            )
          : e instanceof Error
          ? e?.message
          : '',
      );
      process.exit(1);
    }
  });
