# Security Policy

## Reporting a vulnerability

If you find a security issue, please **do not open a public GitHub issue**.
Instead, report it privately via
[GitHub Security Advisories](https://github.com/finnley07/GarminActivityDashboard/security/advisories/new)
for this repository, or email the maintainer directly. Include:

- A description of the issue and its impact
- Steps to reproduce (or a PoC, if applicable)
- The version/commit you tested against

You should get an initial response within a few days. There is no bug bounty –
this is a personal open-source project run in spare time.

## Supported versions

There is no long-term-support branch. Security fixes land on `main`; please
run the latest commit.

## Threat model – please read before relying on this in a shared environment

This dashboard is built for **one person, running it on their own machine**.
It intentionally does not implement several things a multi-user, internet-
facing service would need:

- **No authentication.** Anyone who can reach the configured port has full
  access: reading your Garmin data, changing settings, and triggering
  syncs. There is no login screen and no API token.
- **No rate limiting.** Endpoints that spawn a process or call an external
  service (Garmin login test, the Claude CLI test and the
  manual "Check data" re-analysis) can be called repeatedly with no cooldown.
- **Garmin passwords are stored in plaintext** in
  `data/app-config.json` on disk, because the underlying MCP/API integrations
  need the raw credentials to log in. They are never returned by the API
  (only a `hasGarminPassword` boolean is returned), but anyone with
  filesystem access to that machine can read them.
- **By default the server binds to `127.0.0.1` only** (see `HOST` in
  [Environment variables](README.md#environment-variables)) so it is not
  reachable from other devices unless you explicitly opt in. If you do bind
  it to `0.0.0.0` (or forward the port through your router), you are exposing
  an unauthenticated admin panel with your training and health data to
  whatever network can reach it — do this only on a network you trust, and
  ideally behind your own reverse proxy with authentication in front.

If you need multi-user access, authentication, or internet exposure, this
project is not (yet) the right fit without putting a reverse proxy with its
own auth in front of it.

## Reporting non-security bugs

For anything that is not a security issue, please use the normal
[issue tracker](https://github.com/finnley07/GarminActivityDashboard/issues) instead.
