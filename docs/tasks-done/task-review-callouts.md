# Task: Review Callouts

https://github.com/dannysmith/dannyis-astro/issues/75

Review Callout component and make it's API similar to Starlight's Aside component. I think we should change the props but we should look at restructuring the Callout component so it's a little bit more similar to Starlight's implementation. We should also make it possible for the icon to be either an emoji which is just like pasted in plain as text OR an icon from astro-icons (and therefore heroicons). I'm not sure the best way of achieving this, it may well be that we need two separate props for it.

## The Starlight `Aside` component.

```astro
---
import { AstroError } from 'astro/errors';
import Icon from './Icon.astro';
import { Icons, type StarlightIcon } from '../components/Icons';
import { throwInvalidAsideIconError } from '../integrations/asides-error';

const asideVariants = ['note', 'tip', 'caution', 'danger'] as const;
const icons = { note: 'information', tip: 'rocket', caution: 'warning', danger: 'error' } as const;

interface Props {
	type?: (typeof asideVariants)[number];
	title?: string;
	icon?: StarlightIcon;
}

let { type = 'note', title, icon } = Astro.props;

if (!asideVariants.includes(type)) {
	throw new AstroError(
		'Invalid `type` prop passed to the `<Aside>` component.\n',
		`Received: ${JSON.stringify(type)}\n` +
			`Expected one of ${asideVariants.map((i) => JSON.stringify(i)).join(', ')}`
	);
}

if (icon && !Icons[icon]) throwInvalidAsideIconError(icon);

if (!title) {
	title = Astro.locals.t(`aside.${type}`);
}
---

<aside aria-label={title} class={`starlight-aside starlight-aside--${type}`}>
	<p class="starlight-aside__title" aria-hidden="true">
		<Icon name={icon || icons[type]} class="starlight-aside__icon" />{title}
	</p>
	<div class="starlight-aside__content">
		<slot />
	</div>
</aside>
```

## Plan

**Current state analysis:**

- Callout uses color-based types (`red`, `blue`, etc.) which works well for the use case
- Icon is just a string (emoji) with no astro-icon support
- No validation or fallback handling

**Changes needed:**

1. **Keep existing color type system** - No changes to `'default' | 'red' | 'blue' | 'green' | 'orange' | 'yellow' | 'purple'`

2. **Enhance icon support** - Support both emoji and astro-icon:
   - Add `emoji?: string` prop for plain text emojis
   - Keep `icon?: string` prop for astro-icon names
   - Priority: custom astro-icon > emoji > no icon

3. **Add Icon component** - Import from astro-icon like SocialLinks.astro does

4. **Add validation** - Graceful fallback for invalid astro-icon names

**Implementation approach:**

- Keep all existing props and behavior
- Add emoji prop as separate option
- Use astro-icon's `Icon` component when icon prop is provided
- Fall back to emoji if icon fails to render
- Maintain existing CSS and styling unchanged
