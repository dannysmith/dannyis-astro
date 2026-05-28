/**
 * Site Redirects
 *
 * Short URLs and external redirects.
 * Edit this file to add/remove redirects.
 */

export const redirects: Record<string, string> = {
  '/meeting': 'https://cal.com/dannysmith',

  '/cv': '/cv-danny-smith.pdf',
  // Note: /cv.pdf is handled as a real HTTP 308 in vercel.output-config.json
  // (not here as a meta-refresh) so that tools fetching it as a PDF get a
  // proper redirect rather than HTML.
  '/linkedin': 'https://www.linkedin.com/in/dannyasmith',
  '/working': 'https://betterat.work',
  '/toolbox': 'https://betterat.work/toolbox',

  '/remote': 'https://dannysmith.notion.site/Remote-Working-Tips-821f025d73cb4d93a661abc93822fb14',
  '/rtotd': 'https://dannysmith.notion.site/Remote-Working-Tips-821f025d73cb4d93a661abc93822fb14',
  '/using': 'https://www.notion.so/dannysmith/Danny-Uses-72544bdecd144ca5ab3864d92dcd119b',

  '/youtube': 'https://www.youtube.com/channel/UCp0vO-4tetByUhsVijyt2jA',
  '/music': 'https://youtube.com/dannysmithblues',
  '/singing': 'https://youtube.com/dannysmithblues',
};
