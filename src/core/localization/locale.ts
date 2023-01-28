import * as i18n from 'i18n';

i18n.configure({
  directory: __dirname,
  locales: ['en'],
  defaultLocale: 'en',
  updateFiles: false,
});

export const text = i18n.__;
