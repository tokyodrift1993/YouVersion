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
youversion-cli
```
