# Privacy model

## What exists where

| Place | Contains | Who can see it |
| --- | --- | --- |
| This Git repository (public) | Code and the **public seed** (`src/seed/public.ts`) | Anyone |
| The deployed site (public URL) | The same public seed, compiled | Anyone who opens the URL |
| Your browser's IndexedDB | Everything you type, plus anything you import | Whoever can use that browser profile |
| `private/` on your machine (gitignored) | The private seed file `krish.private.json` and the script that makes it | You |
| Export files | Whatever you chose to export | Wherever you put them |

There is no server, no account, no analytics and no third-party request (fonts are self-hosted).

## The private seed

The handoff contained health history, medication history, lab results, family and financial circumstances,
psychological self-observations and body measurements. None of that is committed or bundled. It lives in
`private/krish.private.json`, which you import yourself (Settings → Data → Import → **Merge**). Every
record in it is marked `private`, and almost all are marked *historical* or *unverified*: they record what
was reported, not what is true now.

If the file is lost, regenerate it with `node private/make-private-seed.mjs` (that script is gitignored too),
or restore from an export that included private records.

## Guards

- `.gitignore` excludes `private/` and any `*.private.json`.
- A unit test asserts the public seed contains no private records and none of the private-only kinds
  (observations, hypotheses, logs, medication, routines, items, reviews).
- `npm run build` ends with `scripts/check-privacy.mjs`, which fails the build if any distinctive string
  (title, sentence or id) from a local private file appears in `dist/`. The script itself contains no
  sensitive words.

## What the privacy screen is, and isn't

Settings → Privacy → *Hide private records* removes private records from every view, which is useful when
screen-sharing. **It is not security.** Anyone with access to the browser profile can turn it off, open the
developer tools, or read IndexedDB directly. Real protection means device and browser-profile security.

## If you later add sync

A sync backend would move private data off the device. It would need real authentication, server-side
access control, encryption in transit and at rest, and ideally end-to-end encryption of private records.
Client-side hiding would not be enough.
