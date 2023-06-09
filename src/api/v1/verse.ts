import axios from 'axios';
import * as cheerio from 'cheerio';
import express, {Request, Response, Router} from 'express';

import bookList from './db/books.json';
import versions from './db/versions.json';

export const verse: Router = express.Router();

verse.get('/', async (req: Request, res: Response) => {
  const baseURL = 'https://www.bible.com/bible';

  const book = req.query.book as string;
  const chapter = Number((req.query.chapter ??= '1'));
  const verses = String((req.query.verses ??= '1'));
  const version = String((req.query.version ??= 'KJV'));

  type bookType = {
    book: string;
    aliases: Array<string>;
    chapters: number;
  };

  function apiError(code: number, message: string) {
    res.status(code).send({
      code: code,
      message: message,
    });
  }

  if (!book) return apiError(400, "Missing field 'book'");

  const versionFinder = {
    version: (Object.keys(versions)[Object.keys(versions).indexOf(version.toLocaleString().toLocaleUpperCase())] ??= 'NIV'),
    id: (Object.values(versions)[Object.keys(versions).indexOf(version.toLocaleString().toLocaleUpperCase())] ??= 1),
  };

  const bookFinder =
    bookList.books.find((o: bookType) => o.book.toLowerCase() === book.toLowerCase())
    || bookList.books.find((o: bookType) => o.aliases.includes(book.toUpperCase()));

  if (!bookFinder) return apiError(400, `Could not find book '${book}' by name or alias.`);

  const URL = `${baseURL}/${versionFinder.id}/${bookFinder.aliases[0]}.${chapter}.${verses}`;

  try {
    const {data} = await axios.get(URL);
    const $ = cheerio.load(data);

    const lastVerse = $('.ChapterContent_reader__UZc2K').eq(-1).text();
    if (lastVerse) return apiError(400, 'Verse not found');
    if (chapter > bookFinder.chapters) return apiError(400, 'Chapter not found.');

    const versesArray: Array<string> = [];
    const citationsArray: Array<string> = [];
    const wrapper = $('div.max-w-full.w-full div > p');
    const citationWrapper = $('div.max-w-full.w-full div > h2');

    await wrapper.each((i, p) => {
      const rawVerse = $(p).eq(0).text();
      const formattedVerse = rawVerse.replace(/\n/g, ' ');
      versesArray.push(formattedVerse);
    });

    await citationWrapper.each((i, p) => {
      const citation = $(p).eq(0).text();

      citationsArray.push(citation);
    });

    return res.status(200).send({
      citation: citationsArray[0],
      passage: versesArray[0],
    });
  } catch (err) {
    console.error(err);
  }
});