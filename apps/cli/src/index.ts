import {Command} from 'commander';
import dotEnvExtended from 'dotenv-extended';

import {getVerses} from './commands/get-verses';

dotEnvExtended.load();
const program = new Command();

program
  .description('Commandline helper for YouVersion.')
  .addCommand(getVerses)
  .parseAsync(process.argv)
  .catch((e) => console.error(e));
