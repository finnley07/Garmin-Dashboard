# Contributing

Thanks for considering a contribution. This is a personal, spare-time project,
so please keep expectations about review turnaround modest – but PRs and
issues are genuinely welcome.

## Before you start

For anything beyond a small fix (a new panel, a new setting, a behavior
change), please open an issue first to discuss the approach. It's a lot less
frustrating for everyone than writing a PR that turns out to not fit the
project's direction.

For security issues, see [SECURITY.md](SECURITY.md) instead of opening a
public issue.

## Setup

```bash
git clone https://github.com/finnley07/GarminActivityDashboard.git
cd GarminActivityDashboard
npm install
npm run dev
```

You'll need real (or test) Garmin Connect credentials to see live data – the
setup wizard on first launch walks you through it. See the
[README](README.md#installation--setup) for the full setup flow, including
the optional Claude CLI integration.

## Before opening a PR

```bash
npm run type-check
npm run test
npm run build
```

All three must pass. There is no linter configured yet, so please match the
existing code style (see below) rather than introducing a new one.

- **Tests**: server logic and `src/utils/*` are covered by Vitest
  (`server/**/*.test.ts`, `src/utils/**/*.test.ts`). There is currently no
  component-testing setup for `.vue` files – if you add one, please open an
  issue first so the approach can be agreed on before a large dependency
  lands.
- **i18n**: every user-facing string needs both a German and an English
  entry in `src/i18n/de.ts` / `src/i18n/en.ts`. Server-generated text (the
  local rule-based recommendations in `server/analysis.ts`) should go through
  the `tr(de, en)` helper
  in `server/lang.ts` rather than being hardcoded in one language.
- **Comments**: only where the _why_ isn't obvious from the code (a Garmin
  API quirk, a workaround, a non-obvious invariant). Please don't add
  comments that restate what the code already says.
- **Scope**: keep PRs focused. A bug fix doesn't need an accompanying
  refactor of the surrounding code.

## Reporting bugs

Please use the bug report issue template and include:

- What you expected vs. what happened
- Your OS and Node version
- Relevant server log output (from the terminal running `npm run dev` /
  `npm start`) – redact any tokens or personal data first

## Code of conduct

Be respectful. Disagreements about approach are fine and expected;
personal attacks are not.
