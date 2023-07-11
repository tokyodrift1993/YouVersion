import {model, Schema} from 'mongoose';

export const VerseModel = model(
  'Verse',
  new Schema({
    url: {required: true, type: String, index: true},
    html: {required: true, type: String},
  }),
);
