import axios, {AxiosError} from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import express, {Request, Response, Router} from 'express';
import {Error} from 'mongoose';

import bookList from '@tokyodrift1993/library/assets/books.json';
import versions from '@tokyodrift1993/library/assets/versions.json';
import {ApiVerseRequestParams, ApiVerseResponse} from '@tokyodrift1993/library/interfaces/api.interface';

import {getMongoDb} from '../../helpers/mongo.helper';
import {getRedisClient, REDIS_VERSE_EXPIRATION} from '../../helpers/redis.helper';
import {VerseModel} from '../../models/verse';

axiosRetry(axios, {
  retries: 10,
  retryDelay: (retryCount) => retryCount * 100,
  retryCondition: (err) => /^5\d{2}$/.test(err.response?.status.toString() || ''),
});

interface ApiErrorResponse {
  statusCode: number;
  message: string;
}

const apiError = (res: Response<ApiErrorResponse>, statusCode: number, message: string) => {
  res.status(statusCode).send({statusCode, message});
};

export const verse: Router = express.Router();

verse.get(
  '/',
  async (
    req: Request<Record<string, string>, unknown, unknown, ApiVerseRequestParams>,
    res: Response<ApiErrorResponse | ApiVerseResponse>,
  ) => {
    const redisClient = await getRedisClient();
    const mongo = await getMongoDb();

    const baseURL = 'https://www.bible.com/bible';

    const book = req.query.book;
    const chapter = (req.query.chapter ??= 1);
    const verses = (req.query.verses ??= '1');
    const version = (req.query.version ??= 'KJV');
    const force = (req.query.force = req.query?.force === true || req.query?.force === 'true');

    type bookType = {
      book: string;
      aliases: Array<string>;
      chapters: number;
    };

    if (!book) {
      return apiError(res, 400, "Missing field 'book'");
    }

    const versionFinder = {
      version: (Object.keys(versions)[Object.keys(versions).indexOf(version.toLocaleString().toLocaleUpperCase())] ??= 'KJV'),
      id: (Object.values(versions)[Object.keys(versions).indexOf(version.toLocaleString().toLocaleUpperCase())] ??= 1),
    };

    const bookFinder =
      bookList.find((o: bookType) => o.book.toLowerCase() === book.toLowerCase())
      || bookList.find((o: bookType) => o.aliases.find((a) => a.toLowerCase() === book.toLowerCase()));

    if (!bookFinder) {
      return apiError(res, 400, `Could not find book '${book}' by name or alias.`);
    }

    const URL = `${baseURL}/${versionFinder.id}/${bookFinder.book}.${chapter}.${verses}`;

    console.log('🖥️[Web]: get content for link:', URL);

    const getResultsFromCache = async () => {
      if (redisClient) {
        return redisClient.get(URL);
      }

      if (mongo) {
        try {
          return (await VerseModel.findOne({url: URL}).exec())?.html;
        } catch (e) {
          if (e instanceof Error && e.message !== 'Authentication failed') {
            throw e;
          }
        }
      }
    };

    try {
      let data;
      const resultsFromCache = await getResultsFromCache();

      if (!force && resultsFromCache) {
        data = resultsFromCache;
        console.log('🖥️[Web]: get content from cache');
      } else {
        if (force && (redisClient || mongo)) {
          console.log('🖥️[Web]: get content live (forced)!');
        }

        data = (await axios.get<string>(URL, {maxRedirects: 0})).data;
      }

      const $ = cheerio.load(data);

      if (chapter > bookFinder.chapters) {
        return apiError(res, 400, 'Chapter not found.');
      }

      if (!resultsFromCache || force) {
        if (redisClient) {
          await redisClient.set(URL, data, {EX: REDIS_VERSE_EXPIRATION()});
        }

        if (mongo) {
          await new VerseModel({url: URL, html: data}).save();
        }
      }

      const versesArray: Array<string> = [];
      const citationsArray: Array<string> = [];
      const wrapper = $('div.max-w-full.w-full > div > div > div > div:nth-child(1) > a > p');
      const citationWrapper = $('div.max-w-full.w-full > div > div > div > div:nth-child(1) > h2');

      wrapper.each((i, p) => {
        const rawVerse = $(p).eq(0).text();
        const formattedVerse = rawVerse.replace(/\n/g, ' ');
        versesArray.push(formattedVerse);
      });

      citationWrapper.each((i, p) => {
        const citation = $(p).eq(0).text();

        citationsArray.push(citation);
      });

      const citation = citationsArray?.[0];
      const passage = versesArray?.[0];

      if (!passage) {
        return apiError(res, 404, 'Verse not found');
      }

      return res.status(200).send({
        citation: citation || '',
        passage: passage || '',
        book: citation?.match(new RegExp(`(.*) ${chapter}:`))?.[1] || bookFinder.book,
        chapter,
        verses,
      });
    } catch (err) {
      let statusCode = 500;
      let message = 'An error has occurred';

      if (err instanceof AxiosError && err.response) {
        statusCode = err.response.status || statusCode;
        message = err.response.data || message;
      } else {
        console.error(err);
      }

      return res.status(statusCode).send({statusCode, message});
    }
  },
);
