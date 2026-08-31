const lightCodeTheme = require('prism-react-renderer').themes.github;
require('dotenv').config({ quiet: true });
const path = require('path');
const fs = require("fs");

const presets = [
  [
    '@docusaurus/preset-classic',
    /** @type {import('@docusaurus/preset-classic').Options} */
    ({
      docs: {
        sidebarPath: require.resolve('./sidebars.js'),
        editUrl:
          'https://github.com/hwgilbert16/scholarsome/tree/develop/apps/docs',
        routeBasePath: '/',
      },
      theme: {
        customCss: require.resolve('./src/css/custom.css'),
      },
      blog: false,
    }),
  ],
];

const specPath = path.join(__dirname, '..', '..', 'dist', 'api-spec.json');

if (fs.existsSync(specPath)) {
  presets.push([
    'redocusaurus',
    {
      // Plugin Options for loading OpenAPI files
      specs: [
        {
          spec: specPath,
          route: '/api/',
        },
      ],
      // Theme Options for modifying how redoc renders them
      theme: {
        primaryColor: '#8338ff',
      },
    },
  ]);
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Scholarsome Handbook',
  // HOST is a runtime deployment variable and is not set when the handbook is
  // built (e.g. in the Docker image build), so fall back to a valid URL.
  url: `http://${process.env.HOST ?? 'localhost'}`,
  baseUrl: '/handbook/',
  onBrokenLinks: 'log',
  favicon: 'img/favicon.ico',
  organizationName: 'Scholarsome',
  projectName: 'Scholarsome',
  trailingSlash: true,
  staticDirectories: ['public', 'static'],
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets,

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        logo: {
          alt: 'Scholarsome',
          src: 'img/logo.svg',
          href: '/',
        },
        items: [
          {
            to: `/`,
            position: 'left',
            label: 'Handbook',
            activeBaseRegex: '^(?!.*\\bapi\\b).*$'
          },
          {
            to: `/api`,
            position: 'left',
            label: 'API',
            activeBasePath: 'api'
          },
          {
            // A plain <a> pointing at the site root, so the link works no
            // matter which host serves the handbook. A default navbar item
            // would not work here: Docusaurus rewrites internal hrefs to the
            // docs base URL and navigates them client-side.
            type: 'html',
            position: 'right',
            value: '<a class="navbar__link menu__link" href="/">Back to Scholarsome</a>'
          }
        ],
      },
      prism: {
        theme: lightCodeTheme,
      },
      colorMode: {
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
    }),
};

module.exports = config;
