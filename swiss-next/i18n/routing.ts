import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['ro', 'ru', 'en'],
    defaultLocale: 'ro',
    localePrefix: 'as-needed', // /ro is hidden, /ru and /en are shown
});
