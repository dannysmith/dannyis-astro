import { getConfig } from '@config/config';

const config = getConfig();

export const OG_AUTHOR_NAME = config.author.fullName;
export const OG_PROFILE_IMAGE = config.author.avatarCircleUrl;
export const OG_HANDLE = config.author.twitter;
