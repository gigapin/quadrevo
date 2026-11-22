## Task

Describe the functional goal in English. Do not include internal planning identifiers.

## Changes

- Describe the resulting behavior and relevant implementation decisions.

## Validation

- List the commands run and their results, plus any manual verification.
- Explain any checks that could not be completed.

## Definition of Done

- [ ] The changes address one functional goal and use English throughout.
- [ ] Code comments and branch names contain no internal planning references.
- [ ] `make check` passes locally, and the PR's `check` and `docker` jobs pass.
- [ ] Behavior changes have appropriate tests, including database integrity checks where applicable.
- [ ] Relevant documentation and decision records are updated.
- [ ] Any database migrations are reviewed; no `db push` is used.
- [ ] Any library or extension installation received the owner's explicit consent.
- [ ] No secrets or generated artifacts are included.
- [ ] Local planning status is updated without publishing ignored planning documents.
