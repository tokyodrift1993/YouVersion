import axios, {AxiosError} from 'axios';
import * as cheerio from 'cheerio';
import express, {Request, Response, Router} from 'express';

import {getRedisClient, REDIS_VERSE_EXPIRATION} from '../../helpers/redis.helper';
import bookList from './db/books.json';
import versions from './db/versions.json';

interface ApiErrorResponse {
  statusCode: number;
  message: string;
}

const apiError = (res: Response<ApiErrorResponse>, statusCode: number, message: string) => {
  res.status(statusCode).send({statusCode, message});
};

interface ApiVerseResponse {
  citation: string;
  passage: string;
  book: string;
  chapter: number;
  verses: string;
}

interface ApiVerseRequestParams {
  book: string;
  chapter: number;
  verses: string;
  version: string;
  force?: string | boolean;
}

export const verse: Router = express.Router();

verse.get(
  '/',
  async (
    req: Request<Record<string, string>, unknown, unknown, ApiVerseRequestParams>,
    res: Response<ApiErrorResponse | ApiVerseResponse>,
  ) => {
    const redisClient = await getRedisClient();

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
      bookList.books.find((o: bookType) => o.book.toLowerCase() === book.toLowerCase())
      || bookList.books.find((o: bookType) => o.aliases.includes(book.toUpperCase()));

    if (!bookFinder) {
      return apiError(res, 400, `Could not find book '${book}' by name or alias.`);
    }

    const URL = `${baseURL}/${versionFinder.id}/${bookFinder.aliases[0]}.${chapter}.${verses}`;

    console.log('🖥️[Web]: get content for link:', URL);

    try {
      let data;
      const resultsFromCache = redisClient && (await redisClient.get(URL));

      if (!force && resultsFromCache) {
        data = resultsFromCache;
        console.log('🖥️[Web]: get content from cache');
      } else {
        if (force && redisClient) {
          console.log('🖥️[Web]: get content live (forced)!');
        }

        data = (await axios.get<string>(URL)).data;
      }

      const $ = cheerio.load(data);

      const lastVerse = $('.ChapterContent_reader__UZc2K').eq(-1).text();

      if (lastVerse) {
        return apiError(res, 400, 'Verse not found');
      }

      if (chapter > bookFinder.chapters) {
        return apiError(res, 400, 'Chapter not found.');
      }

      if (!resultsFromCache && redisClient) {
        await redisClient.set(URL, data, {EX: REDIS_VERSE_EXPIRATION()});
      }

      const versesArray: Array<string> = [];
      const citationsArray: Array<string> = [];
      const wrapper = $('div.max-w-full.w-full div > p');
      const citationWrapper = $('div.max-w-full.w-full div > h2');

      wrapper.each((i, p) => {
        const rawVerse = $(p).eq(0).text();
        const formattedVerse = rawVerse.replace(/\n/g, ' ');
        versesArray.push(formattedVerse);
      });

      citationWrapper.each((i, p) => {
        const citation = $(p).eq(0).text();

        citationsArray.push(citation);
      });

      const citation = citationsArray[0];

      return res.status(200).send({
        citation: citation,
        passage: versesArray[0],
        book: citation.match(new RegExp(`(.*) ${chapter}:`))?.[1] || bookFinder.book,
        chapter,
        verses,
      });
    } catch (err) {
      console.error(err);

      let statusCode = 500;
      let message = 'An error has occurred';

      if (err instanceof AxiosError && err.response) {
        statusCode = err.response.status || statusCode;
        message = err.response.data || message;
      }

      return res.status(statusCode).send({statusCode, message});
    }
  },
);
