# GitHub Actions Deployment with Playwright Support

## Context

Mermaid diagrams are currently broken on the site. They display as raw code instead of rendered diagrams.

### Root Cause

The site uses `rehype-mermaid` for build-time diagram rendering, which requires Playwright to run a headless browser. Currently configured with `strategy: 'pre-mermaid'` which requires runtime JavaScript (violates zero-JS architecture).

The fix is simple - change to `strategy: 'inline-svg'` (or just use default) in `astro.config.mjs`:

```javascript
// Current (broken - requires runtime JS)
[rehypeMermaid, { strategy: 'pre-mermaid' }]

// Fixed (build-time SVG generation)
rehypeMermaid  // Uses default 'inline-svg' strategy
```

### The Problem

This fix works in local development but **will break on Vercel** because:
- `rehype-mermaid` uses Playwright for SVG rendering
- Playwright requires system dependencies (`libnss3`, `libgbm1`, etc.)
- Vercel's build environment doesn't provide these dependencies
- Build will fail with "Host system is missing dependencies to run browsers"

### The Solution

Build the site in GitHub Actions (where we can install system dependencies) and deploy pre-built artifacts to Vercel. This maintains preview environments and gives us full control over the build process.

## Benefits

1. **Fixes mermaid diagrams** - Playwright can run in GitHub Actions
2. **Future-proof** - Can add any build-time tools that need system packages
3. **Maintains preview environments** - PRs still get preview URLs via Vercel
4. **Better control** - Can add tests, linting, checks before deployment
5. **Zero-JS architecture** - Diagrams are static SVGs, no runtime JavaScript

## QUESTIONS TO LOOK INTO FIRST (from Danny)

- Does it make sense to use the Vercel command line tool to do this build here? This is just an Astro site. Vercel is only used as the platform to deploy it on. So I feel like the actual build commands we should be doing here ought to be not dependent on Vercel. However, I'm aware that since we're building to put it on Vercel, maybe there's some specific stuff that the Vercel build does with Astro Sights that it needs in order to work seamlessly, in which case that's fine. 
- Since we're having a GitHub action, we may as well include the check all command here to run the tests and not continue with the deploy as part of this action if any of them fail. It may be sensible to have this as a separate GitHub Action. I don't know enough about GitHub Actions to know the best way of doing this. 
- It feels kind of hacky what we're doing in the implementation plan below when it comes to manually sending our own comments once we've created a preview environment. I'd like to know if there's a better way of achieving these preview environments on Vercel and having Vercel, once it's deployed them, automatically update the GitHub pull request. 
- If it really does complicate things, we don't necessarily need preview deploys of pull requests. It's really a nice to have feature. 

## Implementation Plan

### Phase 1: Get Vercel Credentials

Need three secrets from Vercel to enable CLI deployments:

1. **VERCEL_TOKEN**
   - Go to https://vercel.com/account/tokens
   - Create token named "GitHub Actions Deploy"
   - Copy immediately (won't be shown again)

2. **VERCEL_ORG_ID and VERCEL_PROJECT_ID**
   - Run locally: `vercel link && cat .vercel/project.json`
   - Or find in Vercel dashboard URLs and settings

3. **Add to GitHub Secrets**
   - Repo Settings → Secrets and variables → Actions
   - Add all three secrets

### Phase 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

**Key features:**
- Runs on all branches and PRs
- Installs Playwright with system dependencies
- Uses `vercel pull` to get project config
- Uses `vercel build` to create build artifacts
- Uses `vercel deploy --prebuilt` to upload pre-built files
- Automatically determines production vs preview based on branch
- Comments preview URL on PRs

**Critical commands:**
```bash
# Install Playwright with system deps
pnpm exec playwright install --with-deps chromium

# Pull Vercel config (production or preview)
vercel pull --yes --environment=preview --token=$TOKEN

# Build (creates .vercel/output)
vercel build --token=$TOKEN

# Deploy prebuilt artifacts
vercel deploy --prebuilt --token=$TOKEN
```

### Phase 3: Disable Vercel Auto-Deployments

Since GitHub Actions will handle all builds, disable Vercel's Git integration:

**Option A:** Set ignored build step to `exit 0`
**Option B:** Disconnect Git integration entirely

Either way, CLI deployments via GitHub Actions will still work.

### Phase 4: Update Configuration

1. **Fix mermaid config** in `astro.config.mjs`:
   ```javascript
   rehypePlugins: [
     [rehypeHeadingIds, { headingIdCompat: true }],
     rehypeAutolinkHeadings,
     [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
     rehypeMermaid,  // Changed from [rehypeMermaid, { strategy: 'pre-mermaid' }]
   ],
   ```

2. **Add to .gitignore:**
   ```
   # Vercel
   .vercel
   ```

### Phase 5: Test Deployment

1. Create test branch
2. Push changes
3. Verify GitHub Actions:
   - Installs Playwright successfully
   - Builds without errors
   - Deploys to Vercel
4. Check PR comment has preview URL
5. Merge to main and verify production deployment

### Phase 6: Documentation

Create `docs/developer/github-actions-deployment.md` with:
- Full setup instructions
- How the workflow determines production vs preview
- Troubleshooting guide
- How to add future build steps (tests, linting, etc.)
- Cost breakdown

## Technical Details

### How Vercel CLI Works with Prebuilt

1. **`vercel build`** runs your build command and transforms output to Vercel's Build Output API format
2. **Creates `.vercel/output/`** directory with proper structure
3. **`vercel deploy --prebuilt`** uploads this directory, skipping Vercel's build process
4. **Vercel serves** the static files normally (no difference from Git deployments)

### Production vs Preview Logic

```yaml
if [ "${{ github.ref }}" = "refs/heads/main" ]; then
  vercel pull --yes --environment=production --token=$TOKEN
  vercel build --prod --token=$TOKEN
  vercel deploy --prebuilt --prod --token=$TOKEN
else
  vercel pull --yes --environment=preview --token=$TOKEN
  vercel build --token=$TOKEN
  vercel deploy --prebuilt --token=$TOKEN
fi
```

### PR Preview URL Commenting

Uses `actions/github-script@v7` to:
- Find existing bot comment on PR (if any)
- Update existing comment or create new one
- Include deployment URL from deploy step output

## Resources & References

**Official Docs:**
- [How to Use GitHub Actions to Deploy to Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [rehype-mermaid GitHub](https://github.com/remcohaszing/rehype-mermaid)

**Community Guides:**
- [Automate Vercel Preview Deployments with GitHub Actions](https://dev.to/dantonelli/automate-vercel-preview-deployments-with-github-actions-a-step-by-step-guide-38fb)
- [Take Control Over CI/CD with GitHub Actions & Vercel](https://techhub.iodigital.com/articles/take-control-over-your-ci-cd-process-with-github-actions-vercel)
- [Adding Mermaid Diagrams to Astro](https://dteather.com/blogs/astro-uml-diagrams/)

**Why Playwright Fails on Vercel:**
- [The Vercel Playwright Puzzle](https://www.rafay99.com/blog/vercel-playwright-deployment-error-debugging)
- [How to Deploy Playwright on Vercel](https://www.zenrows.com/blog/playwright-vercel)
- [Mermaid support discussion - Astro Starlight](https://github.com/withastro/starlight/discussions/1259)

## Known Issues & Gotchas

1. **Don't forget `--with-deps`** when installing Playwright - needs system libraries
2. **Must disable Vercel Git builds** - otherwise both systems try to deploy
3. **`.vercel/` must be gitignored** - contains local config only
4. **Token needs correct scope** - must have deploy permissions for the project
5. **Bot needs PR write permission** - for commenting deployment URLs

## Current Status

**Not Started** - Mermaid diagrams are broken, awaiting implementation of GitHub Actions deployment.

**Current Workaround:** Mermaid diagrams display as raw code. Not critical since we don't actively use them yet.

**Priority:** Medium - Not blocking, but needed before we can use mermaid diagrams in content.

## Acceptance Criteria

- [ ] GitHub Actions workflow created and committed
- [ ] Vercel secrets added to GitHub repository
- [ ] Vercel auto-deployments disabled
- [ ] Test deployment succeeds on non-main branch
- [ ] PR receives automated comment with preview URL
- [ ] Production deployment succeeds from main branch
- [ ] Mermaid diagrams render correctly as static SVGs
- [ ] Documentation created in `docs/developer/`
- [ ] `.vercel` added to `.gitignore`
- [ ] Zero runtime JavaScript (verify with browser DevTools)

## Future Enhancements

Once this is working, we can add:
- **Type checking** before build (`pnpm run check:types`)
- **Linting** before build (`pnpm run check:lint`)
- **Tests** before deploy (`pnpm run test:all`)
- **Lighthouse CI** for performance audits on previews
- **Visual regression testing** comparing screenshots
- **Build time optimizations** using GitHub Actions cache

## Files to Create/Modify

**Create:**
- `.github/workflows/deploy.yml` - Main deployment workflow
- `docs/developer/github-actions-deployment.md` - Setup documentation

**Modify:**
- `astro.config.mjs` - Fix mermaid strategy (line 56)
- `.gitignore` - Add `.vercel`

## Estimated Effort

- **Setup time:** 15-20 minutes (mostly getting secrets)
- **Testing time:** 10-15 minutes (test PR and production deploy)
- **Documentation:** Already written, just needs to be added

**Total:** ~30-45 minutes for initial setup and verification.
