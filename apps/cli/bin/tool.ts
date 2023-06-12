#!/usr/bin/env ts-node
import 'module-alias/register';

import axios, {AxiosError} from 'axios';
import axiosRetry from 'axios-retry';
import {Command, Option} from 'commander';
import dotEnvExtended from 'dotenv-extended';
import PQueue from 'p-queue';

import bookList from '@tokyodrift1993/library/assets/books.json';
import {ApiVerseResponse} from '@tokyodrift1993/library/interfaces/api.interface';

import {RetrieveAllVersesVersesOptions} from '../src/interfaces/command.interface';
import {buildVerseApiUrl} from '../src/utils/api.helper';

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 100,
  retryCondition: (err) => /^5\d{2}$/.test(err.response?.status.toString() || ''),
});

interface RetrieveAllVersesVersesCommandOptions extends RetrieveAllVersesVersesOptions, Command {}

dotEnvExtended.load();
const program = new Command();

program
  .description('Commandline helper tool.')
  .addCommand(
    new Command()
      .name('retrieve-all-verses')
      .description('Retrieves all verses through express api.')
      .addOption(new Option('--you-version-api-url <you-version-api-url>', 'turn off colour output').env('YOU_VERSION_CLI_API_URL'))
      .addOption(new Option('--you-version-api-path <you-version-api-path>', 'turn off colour output').env('YOU_VERSION_CLI_API_PATH'))
      .addOption(
        new Option('--you-version-api-additional-params <you-version-api-additional-params>', 'turn off colour output').env(
          'YOU_VERSION_CLI_API_ADDITIONAL_PARAMS',
        ),
      )
      .action(async (opts: RetrieveAllVersesVersesCommandOptions) => {
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

        const queue = new PQueue({concurrency: 20, autoStart: false});
        let count = 0;
        queue.on('active', () => console.log(`Working on item #${++count}.  Size: ${queue.size}  Pending: ${queue.pending}`));

        const statistics: Record<string, Record<number, number>> = {};

        for (const version of ['SCH2000', 'TAOVBSI']) {
          for (const book of Object.values(bookList)) {
            statistics[book.book] = statistics?.[book.book] || {};

            for (let chapter = 1; chapter <= book.chapters; chapter++) {
              statistics[book.book][chapter] = statistics[book.book][chapter] || 0;

              void queue.add(() => {
                return axios
                  .get<ApiVerseResponse>(
                    buildVerseApiUrl({
                      baseUrl: [youVersionApiUrl, youVersionApiPath].join(''),
                      additionalParams: youVersionApiAdditionalParams,
                      book: book.book,
                      chapter: chapter,
                      verses: '1',
                      version: version,
                      force: false,
                    }),
                  )
                  .then(({data: apiVerseResponse}) => {
                    void queue.add(async () => {
                      statistics[book.book][chapter] =
                        statistics[book.book][chapter] > Number(apiVerseResponse.verses)
                          ? statistics[book.book][chapter]
                          : Number(apiVerseResponse.verses);

                      let noRedirectError = true;
                      let verse = 1;

                      while (noRedirectError) {
                        try {
                          await axios.get<ApiVerseResponse>(
                            buildVerseApiUrl({
                              baseUrl: [youVersionApiUrl, youVersionApiPath].join(''),
                              additionalParams: youVersionApiAdditionalParams,
                              book: book.book,
                              chapter: chapter,
                              verses: String(verse),
                              version: version,
                              force: false,
                            }),
                          );
                        } catch (e) {
                          if (e instanceof AxiosError) {
                            if (e.response?.status === 307 || e.response?.data?.message === 'Verse not found') {
                              // console.log(`Book ${book.book} Chapter ${chapter} has total ${verse}.`);

                              statistics[book.book][chapter] =
                                statistics[book.book][chapter] > verse ? statistics[book.book][chapter] : verse;
                              noRedirectError = false;
                            }
                          } else {
                            console.error('Error found', e);
                          }
                        } finally {
                          verse = verse + 1;
                        }
                      }
                    });
                  })
                  .catch((err) => {
                    console.error('Error', err);
                  });
              });
            }
          }
        }

        console.log('Amount of works', queue.size);

        await queue.start();
      }),
  )
  .parseAsync(process.argv)
  .catch((e) => console.error(e));
