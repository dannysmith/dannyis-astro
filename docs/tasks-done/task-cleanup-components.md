# Task: Clean up Components

This task is about restructuring up the components which are used for layout, predominantly the navigation and footer.

IMPORTANT: DO NOT TOUCH COMPNENTS IN `src/components/mdx` AT ALL

Firstly, `MAinNAvigation.astro` uses `'@astropub/icons/HamburgerMenu'` rather than the new heroicons via astro-icons. We should change that.

But and also potential opportunities to abstract some of the code here into reusable components. Now we don't want to over abstract when it isn't necessary but if there's any stuff in here that's either shared between the footer or the Main Navigation, which is sufficiently complex in its styling or how it looks that we think we should abstract this. Let's do that now before we go on to a bunch of other things. It's okay if we choose to make almost no changes here. I just want to review all of these components to make sure they're in a good state.

## Plan

After critically analyzing both `MainNavigation.astro` and `Footer.astro`, here are my recommendations:

### 1. Icon System Cleanup (Required)

- **Replace HamburgerMenu import**: Change `import HamburgerMenu from '@astropub/icons/HamburgerMenu'` to use heroicons via astro-icon
- **Use**: `<Icon name="heroicons:bars-3" />` (hamburger menu equivalent in heroicons)
- **Update**: Change `<HamburgerMenu />` to `<Icon name="heroicons:bars-3" />` in MainNavigation.astro

### 2. Component Abstractions (Recommended)

#### A. Create `PersonalLogo.astro` Component

Both navigation and footer have identical author identification sections:

```html
<section class="[nav|footer]-name">
  <div class="circle"></div>
  <div class="name">Danny Smith</div>
</section>
```

**Worth abstracting because:**

- Complex responsive styling (clamp values, gap, alignment)
- Identical across components
- Clear semantic purpose (site author identification)
- Single source of truth for personal branding

#### B. Create `SocialLinks.astro` Component

Footer's social media links are prime for reuse:

```html
<section class="footer-social-links">
  <ul>
    <li>
      <a href="/linkedin"><Icon name="social/linkedin" /></a>
    </li>
    <li>
      <a href="/youtube"><Icon name="social/youtube" /></a>
    </li>
    <li>
      <a href="https://instagram.com/dannysmith" target="_blank" rel="noopener noreferrer">
        <Icon name="social/instagram" />
      </a>
    </li>
  </ul>
</section>
```

**High reuse potential:**

- Author bio sections
- About page
- Contact page
- Article author boxes

#### C. Use NavLink in Footer Navigation

Footer navigation currently lacks active state indication that NavLink provides.

**Safety check:** Footer has additional links (Now, Work, Toolbox) that main nav doesn't have, but NavLink's active state logic will work correctly for all links.

### 3. Implementation Priority

1. **High**: Fix HamburgerMenu icon
2. **Medium**: Create SocialLinks component (high reuse value)
3. **Medium**: Create PersonalLogo component (good abstraction)
4. **Low**: Use NavLink in footer (UX improvement)

### 4. Components NOT Worth Extracting

**RSS Links Section**: Self-contained but unlikely to be reused elsewhere. The complexity doesn't justify extraction - would be abstracting for abstraction's sake.

### 5. Files to Create/Modify

1. `src/components/layout/MainNavigation.astro` - Icon fix
2. `src/components/layout/Footer.astro` - Use components, NavLink
3. `src/components/ui/PersonalLogo.astro` - New component
4. `src/components/ui/SocialLinks.astro` - New component
5. `src/components/ui/index.ts` - Export new components

### Critical Assessment

These abstractions pass the test:

- **PersonalLogo**: Complex styling + clear semantic meaning + guaranteed reuse
- **SocialLinks**: High reuse potential + self-contained logic + complex link handling
- **NavLink adoption**: Low risk + clear UX benefit + maintains consistency

Skip RSS extraction - it's not complex enough and has no reuse potential.
