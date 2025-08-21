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
