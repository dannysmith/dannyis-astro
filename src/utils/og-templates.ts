import { OG_AUTHOR_NAME, OG_PROFILE_IMAGE } from './og-branding';

export interface OGTemplateData {
  title: string;
  description?: string;
  site?: string;
  type?: 'article' | 'note' | 'page';
  url: string;
}

export const templates = {
  article: (data: OGTemplateData) => ({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
        overflow: 'hidden',
        position: 'relative',
        background: '#191919',
      },
      children: [
        // Accent color bar on the left
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '100%',
              background: '#ff7369',
            },
          },
        },
        // Top bar (profile image + name)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '40px 56px 0 56px',
              position: 'relative',
            },
            children: [
              // Profile image + name
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                  },
                  children: [
                    {
                      type: 'img',
                      props: {
                        src: OG_PROFILE_IMAGE,
                        width: 72,
                        height: 72,
                        style: {
                          borderRadius: '50%',
                          border: '4px solid #fff',
                          marginRight: '20px',
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontFamily: 'League Spartan',
                          fontWeight: 700,
                          fontSize: '36px',
                          color: '#ff7369',
                          letterSpacing: '2px',
                        },
                        children: OG_AUTHOR_NAME.toUpperCase(),
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Main title area (centered block)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0 56px',
            },
            children: [
              {
                type: 'h1',
                props: {
                  style: {
                    fontFamily: 'League Spartan',
                    fontWeight: 800,
                    fontSize: '84px',
                    color: '#fff',
                    lineHeight: '1.1',
                    textAlign: 'center',
                    textShadow: '0 2px 16px rgba(0,0,0,0.32)',
                    margin: 0,
                    maxWidth: 900,
                  },
                  children: data.title,
                },
              },
            ],
          },
        },
        // URL at the bottom left
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: '36px',
              bottom: '32px',
              fontFamily: 'League Spartan',
              fontWeight: 400,
              fontSize: '24px',
              color: '#b0b0b0',
              letterSpacing: '0.5px',
              maxWidth: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
            children: data.url,
          },
        },
      ],
    },
  }),

  note: (data: OGTemplateData) => ({
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
        overflow: 'hidden',
        position: 'relative',
        background: '#191919',
      },
      children: [
        // Accent color bar on the left
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '100%',
              background: '#ff7369',
            },
          },
        },
        // Top bar (profile image + name + NOTE label)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '40px 56px 0 56px',
              position: 'relative',
            },
            children: [
              // Profile image + name
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                  },
                  children: [
                    {
                      type: 'img',
                      props: {
                        src: OG_PROFILE_IMAGE,
                        width: 72,
                        height: 72,
                        style: {
                          borderRadius: '50%',
                          border: '4px solid #fff',
                          marginRight: '20px',
                        },
                      },
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontFamily: 'League Spartan',
                          fontWeight: 700,
                          fontSize: '36px',
                          color: '#ff7369',
                          letterSpacing: '2px',
                        },
                        children: OG_AUTHOR_NAME.toUpperCase(),
                      },
                    },
                  ],
                },
              },
              // NOTE label box
              {
                type: 'div',
                props: {
                  style: {
                    marginLeft: 'auto',
                    background: '#dfab01',
                    color: '#191919',
                    fontFamily: 'League Spartan',
                    fontWeight: 700,
                    fontSize: '28px',
                    letterSpacing: '2px',
                    borderRadius: 4,
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  children: 'NOTE',
                },
              },
            ],
          },
        },
        // Main title area (centered block)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0 56px',
            },
            children: [
              {
                type: 'h1',
                props: {
                  style: {
                    fontFamily: 'League Spartan',
                    fontWeight: 800,
                    fontSize: '72px',
                    color: '#fff',
                    lineHeight: '1.1',
                    textAlign: 'center',
                    textShadow: '0 2px 16px rgba(0,0,0,0.32)',
                    margin: 0,
                    maxWidth: 900,
                  },
                  children: data.title,
                },
              },
            ],
          },
        },
        // URL at the bottom left
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: '36px',
              bottom: '32px',
              fontFamily: 'League Spartan',
              fontWeight: 400,
              fontSize: '24px',
              color: '#b0b0b0',
              letterSpacing: '0.5px',
              maxWidth: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
            children: data.url,
          },
        },
      ],
    },
  }),

  default: (data: OGTemplateData) => {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
          overflow: 'hidden',
          position: 'relative',
          background: '#191919',
        },
        children: [
          // Accent color bar on the left
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '20px',
                height: '100%',
                background: '#ff7369',
                },
            },
          },
          // Top bar (profile image + name)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '40px 56px 0 56px',
                  position: 'relative',
              },
              children: [
                // Profile image + name
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                    },
                    children: [
                      {
                        type: 'img',
                        props: {
                          src: OG_PROFILE_IMAGE,
                          width: 72,
                          height: 72,
                          style: {
                            borderRadius: '50%',
                            border: '4px solid #fff',
                            marginRight: '20px',
                          },
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontFamily: 'League Spartan',
                            fontWeight: 700,
                            fontSize: '36px',
                            color: '#ff7369',
                            letterSpacing: '2px',
                          },
                          children: OG_AUTHOR_NAME.toUpperCase(),
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          // Main title area (centered block)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                  position: 'relative',
                padding: '0 56px',
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontFamily: 'League Spartan',
                      fontWeight: 800,
                      fontSize: '84px',
                      color: '#fff',
                      lineHeight: '1.1',
                      textAlign: 'center',
                      textShadow: '0 2px 16px rgba(0,0,0,0.32)',
                      margin: 0,
                      maxWidth: 900,
                    },
                    children: data.title || 'danny.is',
                  },
                },
              ],
            },
          },
          // URL at the bottom left
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: '36px',
                bottom: '32px',
                fontFamily: 'League Spartan',
                fontWeight: 400,
                fontSize: '24px',
                color: '#b0b0b0',
                letterSpacing: '0.5px',
                maxWidth: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
              children: data.url || 'danny.is',
            },
          },
        ],
      },
    };
  },
};
