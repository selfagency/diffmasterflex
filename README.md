# DiffMasterFlex

Get a list of files that differ between the specified commit and Git ref.

## Setup

Checkout your repo with a `fetch-depth` of `0`. Then it's as simple as:

```
  # ...
    steps:
      - id: diff
        uses: 'selfagency/diffmasterflex@v1.0.2'
  # ...
```

## Options

- `sha`: The SHA of the commit to compare against. Defaults to HEAD of the
  branch that triggered the workflow.
- `ref`: Ther ref to compare against. Defaults to `origin/main`.

## Outputs

- `diff`: A list of filenames.
- `changed`: Whether any changes were detected.

## Example

```
jobs:
  diff:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: 'actions/checkout@v2'
        with:
          fetch-depth: 0

      - name: Diff against `master`
        id: diff
        uses: 'selfagency/diffmasterflex@v1.0.2'
        with:
          ref: 'origin/master'

      - name: Check for changes
        id: changes
        if: ${{ steps.diff.outputs.changed == 'true' }}
        run:
          DIFF="${{ steps.diff.outputs.diff }}"

          if [[ $DIFF =~ "backend" ]]; then
            BACKEND="true"
          else
            BACKEND="false"
          fi

          if [[ $DIFF =~ "frontend" ]]; then
            FRONTEND="true"
          else
            FRONTEND="false"
          fi

          echo "::set-output name=backend::$BACKEND"
          echo "::set-output name=frontend::$FRONTEND"

      - name: Test backend
        if: ${{ steps.changes.outputs.backend == 'true' }}
        run: 'npm run test:backend'

      - name: Test frontend
        if: ${{ steps.changes.outputs.fronted == 'true }}
        run: 'npm run test:frontend'
```
