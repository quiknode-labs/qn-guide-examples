# Instructions (Delete this section after completing)

When creating a new example, copy the contents of this template into a new `README.md` file in the example directory and fill in the required pieces of information. All example `README` files should include the following:

- [ ] `INSERT_TITLE`
- [ ] `INSERT_GUIDE_NAME`
- [ ] `INSERT_GUIDE_LINK`
- [ ] `INSERT_AUTHOR`
- [ ] `INSERT_CHAIN`
- [ ] `INSERT_PROJECT`

After that some sections may or may not be applicable depending on the given project. Make sure to delete any unnecessary sections.

- [ ] `ENVIRONMENT VARIABLES` - Not all projects will include environment variables but we highly recommend setting up your project to use them with something like `dotenv` if secrets are included in the code (for example an endpoint or private key).
- [ ] `DEPENDENCIES` - Some projects will not require installing dependencies.
- [ ] `SCRIPT` - Not all projects will have a script to run.
  - [ ] `START` - However, if a Node script is included we recommend following the `start` naming convention when possible.
- [ ] `PACKAGE MANAGERS` - We recommend doing your best to support the main three package managers, `npm`, `yarn`, and `pnpm` when possible:
  - [ ] `YARN` - Include a blank `.yarnrc.yml` file to prevent Yarn 3 from breaking. We recommend example maintainers use Yarn 1 when testing projects on their local machine.
  - [ ] `PNPM` - Include a `.npmrc` file with `auto-install-peers=true` and `strict-peer-dependencies=false` to prevent `pnpm` from breaking.
- [ ] `TYPESCRIPT` - Make sure to create a `tsconfig.json` file and install the following development dependencies when using TypeScript: `@types/node`, `ts-node`, `typescript`.

# INSERT_TITLE

This project is based on the guide, [INSERT_GUIDE_NAME](INSERT_GUIDE_LINK) by INSERT_AUTHOR.

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/INSERT_CHAIN/INSERT_PROJECT
```

## Add Environment Variables

```bash
cp .env.example .env
```

## Install Dependencies

Either `npm`, `yarn`, or `pnpm` can be used to install the project's dependencies.

```bash
npm i
yarn
pnpm i
```

## Run Script

```bash
npm start
yarn start
pnpm start
```