# YouVersion-CLI

Commandline helper for YouVersion.

# Building and Running

Install `pnpm`:

```
npm i --location=global pnpm@8
```

First step is of course installing the modules

```
pnpm i
```

## Building

To build I think you can just use the `tsc` command.

```bash
tsc
```

If you cannot use `tsc` try

```bash
npx tsc
```

## Running

First create a link inside `cli/node_modules/.bin`

```bash
pnpm link .
```

And to run use

```bash
npx youversion-cli
```

If you want to pass new-line character, ensure to use «ANSI-C Quoting» e.g.: `$'...'`. See example:

```shell
pnpm youversion-cli get-verses --template-output-format $'{0.passage}\n–\n{1.passage}\n\n{0.book} | {1.book} {0.chapter}:{0.verses}\n\n\n' --config-file-path CONFIG_FILE_PATH
```
