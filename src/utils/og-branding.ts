import { CONFIG } from '@config/site';

const authorName = `${CONFIG.author.givenName} ${CONFIG.author.familyName}`;
export const OG_AUTHOR_NAME = authorName;
export const OG_PROFILE_IMAGE = `${CONFIG.site.url}${CONFIG.author.avatarCircle}`;
