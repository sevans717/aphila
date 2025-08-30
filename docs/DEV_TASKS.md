# Developer Tasks and NPM Scripts

- `npm run dev` - run Netlify dev server (local functions + frontend proxy)
- `npm run route:map` - run `scripts/generate-route-map.js` to extract express routes
- `npm run route:enrich` - enrich route map with handler resolution
- `npm run route:resolve` - resolve handler exports to files
- `npm run route:full` - run the full route map pipeline (map -> enrich -> resolve)
- `npm run lint` - run ESLint across the repo
- `npm run format` - run Prettier to format code and docs
- `npm run typecheck` - run TypeScript compiler in typecheck-only mode
- `npm run prisma:generate` - run `prisma generate`
- `npm run prisma:migrate:dev` - run `prisma migrate dev`
- `npm run smoke` - run `systematic-tester.ts` (requires `ts-node`)
  `npm run docs:lint` - run markdownlint on `docs/` (currently disabled by repo config)

Notes

Markdownlint configuration

- The repository currently disables markdownlint checks for `.md` files by default.
- To re-enable markdownlint: remove or edit the `.markdownlintignore` file at the repo root and update the `docs:lint` script in `package.json` to run `markdownlint docs/**/*.md`.
