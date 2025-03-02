import fs from 'fs';
import matter from 'gray-matter';
import NextLink from 'next/link';
import dynamic from 'next/dynamic';

import { ExternalPageProps } from '../../../utils/declareSsrProps';
import { Page } from '../../../components/Page';
import { TLocale } from '../../../types/locale';
import { routes } from '../../../hooks/router';
import { AvailableHelpPages } from '../../../types/@generated/help';

const Md = dynamic(() => import('../../../components/Md'));

const safeUrl = (url: string) => url.replace('/', '__');
const sourcesDir = (locale: TLocale) => `${process.cwd()}/src/pages/help/source/${locale}`;
const sourcesExt = '.md';

interface YmlProps {
    title: string;
}

interface HelpMenuProps {
    slug: string;
    link: string;
}

export async function getStaticPaths({ locales }: { locales: TLocale[] }) {
    const sourcesNames: Array<Record<string, string>> = [];

    for (const locale of locales) {
        sourcesNames.push(...fs.readdirSync(sourcesDir(locale)).map((fileName) => ({ locale, fileName })));
    }

    return {
        paths: sourcesNames.map(({ locale, fileName }) => ({
            params: { locale, slug: safeUrl(fileName.replace(sourcesExt, '')) },
        })),
        fallback: false,
    };
}

export async function getStaticProps({ params: { locale, slug } }: { params: { locale: TLocale; slug: string } }) {
    const filePath = `${sourcesDir(locale || 'en')}/${slug}${sourcesExt}`;
    const orig = fs.readFileSync(filePath, 'utf-8');
    const stat = JSON.parse(JSON.stringify(fs.statSync(filePath)));
    const { data: yml, content: source } = matter(orig);
    const menu = fs.readdirSync(sourcesDir(locale)).map((fileName) => {
        const linkSlug = fileName.replace(sourcesExt, '') as AvailableHelpPages;
        return { slug: linkSlug, link: routes.help(locale, linkSlug) };
    });

    return {
        props: {
            source,
            stat,
            yml,
            menu,
            i18n: (await import(`../../../../i18n/${locale}.json`)).default,
        },
        revalidate: 10,
    };
}

const HomePage = ({
    user,
    locale,
    ssrTime,
    source,
    stat,
    yml,
    menu,
}: ExternalPageProps<{ source: string; stat: fs.Stats; yml: YmlProps }>) => {
    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={yml.title}>
            Created: {stat.ctime}
            <br />
            Modified: {stat.mtime}
            <br />
            <Md>{source}</Md>
            <div>
                {menu.map(({ slug, link }: HelpMenuProps) => (
                    <NextLink key={slug} href={link}>
                        {slug}
                    </NextLink>
                ))}
            </div>
        </Page>
    );
};

export default HomePage;
