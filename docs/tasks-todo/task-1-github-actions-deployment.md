# GitHub Actions Deployment with Playwright Support

https://github.com/dannysmith/dannyis-astro/issues/98

## Summary

Build the site in GitHub Actions and deploy to Vercel. This:

1. **Fixes mermaid diagrams** - Playwright can run in GitHub Actions (not on Vercel)
2. **Ensures portability** - `dist/` can be deployed anywhere, not locked to Vercel
3. **Enables quality gates** - Tests/checks run before every deploy
4. **Maintains zero-JS architecture** - Diagrams are static SVGs
5. **Provides on-demand previews** - Add a label to get preview deploys

## How It Works

```
Every push/PR:     checks → build → artifact
Main branch:       checks → build → deploy production
PRs with label:    checks → build → deploy preview
```

- **checks job:** Types, lint, format, tests (`pnpm run check:all`)
- **build job:** Installs Playwright, runs `astro build`, uploads `dist/` artifact
- **deploy jobs:** Downloads artifact, deploys to Vercel

Preview deploys are opt-in. Add a `preview` label to a PR to enable them.

## Implementation Steps

Steps marked with **[MANUAL]** require you to do something in a browser or terminal. Other steps can be done by Claude.

---

### Step 1: Get Vercel credentials [MANUAL] ✅

You need three values. Do this in your terminal:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login (opens browser)
vercel login

# Link this project (run in project root)
cd /Users/danny/dev/dannyis-astro
vercel link

# Get the IDs
cat .vercel/project.json
```

Note the `orgId` and `projectId` values from the JSON output.

Then create an API token:
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy the token immediately (shown once)

You now have three values:
- `VERCEL_TOKEN` (the API token you just created)
- `VERCEL_ORG_ID` (from project.json)
- `VERCEL_PROJECT_ID` (from project.json)

---

### Step 2: Add secrets to GitHub [MANUAL] ✅

1. Go to https://github.com/dannysmith/dannyis-astro/settings/secrets/actions
2. Click "New repository secret" for each:
   - Name: `VERCEL_TOKEN` → paste your token
   - Name: `VERCEL_ORG_ID` → paste the orgId
   - Name: `VERCEL_PROJECT_ID` → paste the projectId

---

### Step 3: Create the workflow file ✅

Create `.github/workflows/deploy.yml` with the content from the "Workflow File" section below.

---

### Step 4: Fix mermaid config ✅

In `astro.config.mjs`, change:

```javascript
// FROM:
[rehypeMermaid, { strategy: 'pre-mermaid' }]

// TO:
rehypeMermaid
```

This uses the default `inline-svg` strategy (build-time SVG generation).

---

### Step 5: Update .gitignore ✅

Add if not already present:

```
# Vercel local config
.vercel
```

---

### Step 6: Test locally ✅

```bash
pnpm exec playwright install --with-deps chromium
pnpm run build
```

Verify mermaid diagrams in `dist/` are SVGs, not code blocks.

---

### Step 7: Create PR and test [MANUAL] ✅

1. Create branch with these changes
2. Push to GitHub
3. Verify checks + build jobs pass in GitHub Actions
4. Add `preview` label to the PR (GitHub UI or `gh pr edit --add-label preview`)
5. Verify deploy-preview job runs and PR gets comment with URL
6. Visit the preview URL to confirm site works
7. Merge PR to main
8. Verify deploy-production job runs successfully

---

### Step 8: Disable Vercel auto-deploy [MANUAL]

Now that GitHub Actions is confirmed working, disable Vercel's automatic builds:

1. Go to https://vercel.com (your project)
2. Settings → Git → "Ignored Build Step"
3. Set the command to: `exit 0`
4. Save

This makes Vercel skip its own builds while still accepting CLI deployments from GitHub Actions.

**Alternative:** If you prefer, you can disconnect the Git integration entirely (Settings → Git → Disconnect). CLI deployments will still work.

## Workflow File

`.github/workflows/deploy.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, labeled]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    name: Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      - name: Cache Playwright
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium

      - run: pnpm run check:all

  build:
    name: Build
    needs: checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      - name: Cache Playwright
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}

      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium

      - name: Build site
        run: pnpm run build

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 30

  deploy-production:
    name: Deploy Production
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://danny.is
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Deploy to Vercel
        run: npx vercel deploy dist/ --prod --yes --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-preview:
    name: Deploy Preview
    needs: build
    if: github.event_name == 'pull_request' && contains(github.event.pull_request.labels.*.name, 'preview')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Deploy to Vercel
        id: deploy
        run: |
          URL=$(npx vercel deploy dist/ --yes --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$URL" >> $GITHUB_OUTPUT
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const url = '${{ steps.deploy.outputs.url }}';
            const sha = context.sha.substring(0, 7);
            const body = `**Preview deployed!**\n\n${url}\n\n_Commit: ${sha}_`;

            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const existing = comments.find(c =>
              c.user.type === 'Bot' && c.body.includes('Preview deployed')
            );

            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body
              });
            }
```

## Usage

### Triggering Preview Deploys

Add the `preview` label to any PR:

```bash
gh pr edit 123 --add-label preview
```

Or add it via GitHub UI. Every subsequent push to that PR will deploy a new preview and update the comment.

### Removing Preview Deploys

Remove the `preview` label. Subsequent pushes won't deploy. Existing preview URLs remain accessible until Vercel's retention policy cleans them up (typically 30-90 days).

### Downloading Build Artifacts

Each build uploads `dist/` as an artifact. Download from:
- GitHub Actions → workflow run → Artifacts section
- Useful for backups or deploying elsewhere

## Technical Notes

### Why not `vercel build`?

For a static Astro site without SSR or Vercel-specific features, `vercel build` provides no benefit. Plain `astro build` creates standard HTML/CSS/JS that deploys anywhere.

### Why label-based previews?

Most changes don't need preview deploys (content updates, small fixes). Label-based triggering keeps the workflow quiet for routine work while enabling previews for significant changes.

### Vercel preview retention

Preview deployments are NOT permanent. Vercel automatically cleans them up based on your plan's retention policy. No manual cleanup required.

### Playwright caching

The workflow caches Playwright browsers to speed up subsequent builds. First build installs browsers (~200MB), subsequent builds use cache.

## Files to Create/Modify

**Create:**
- `.github/workflows/deploy.yml`

**Modify:**
- `astro.config.mjs` - Change mermaid strategy
- `.gitignore` - Add `.vercel` if not present

## Acceptance Criteria

**Setup (Steps 1-2):**
- [ ] Vercel CLI linked to project locally
- [ ] VERCEL_TOKEN created and added to GitHub secrets
- [ ] VERCEL_ORG_ID added to GitHub secrets
- [ ] VERCEL_PROJECT_ID added to GitHub secrets

**Code Changes (Steps 3-5):**
- [ ] `.github/workflows/deploy.yml` created
- [ ] `astro.config.mjs` mermaid config updated
- [ ] `.vercel` in `.gitignore`

**Verification (Steps 6-7):**
- [ ] Local build succeeds with mermaid SVGs
- [ ] PR checks + build jobs pass
- [ ] Adding `preview` label triggers deploy-preview job
- [ ] PR comment appears with preview URL
- [ ] Merge to main triggers deploy-production job
- [ ] Production site works at danny.is

**Cleanup (Step 8):**
- [ ] Vercel auto-deploy disabled (Ignored Build Step = `exit 0`)

## References

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [How to Use GitHub Actions with Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid)
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
