import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

const i18n = new I18n({
  en,
  te,
  hi,
});

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Set the locale once at the beginning of your app.
const deviceLocales = getLocales();
if (deviceLocales && deviceLocales.length > 0) {
  i18n.locale = deviceLocales[0].languageCode ?? 'en';
}

export default i18n;
