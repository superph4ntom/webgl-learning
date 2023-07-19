import enUS from '@/locales/en-us.json';
import nlNL from '@/locales/nl-nl.json';
import ptPT from '@/locales/pt-pt.json';
import { useRouter } from 'next/router';
import { Fragment } from 'react';

type JSONValue = {
  [x: string]: string;
};

export function useLocale() {
  const router = useRouter();

  const locales: { [key: string]: JSONValue } = {
    'en-us': enUS,
    'nl-nl': nlNL,
    'pt-pt': ptPT,
  };

  return (copyId: string) => {
    const locale: string = router.locale || 'en-us';
    const selectedLocaleContent = locales[locale] || enUS;
    const copy = selectedLocaleContent[copyId];

    if (copy && copy.includes('\n')) {
      return copy.split('\n').map((line: string, index: number) => (
        <Fragment key={index}>
          {line}
          {index !== copy.length && <br />}
        </Fragment>
      ));
    }
    return copy;
  };
}
