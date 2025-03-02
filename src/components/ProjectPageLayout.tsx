import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { routes } from '../hooks/router';
import { useProjectResource } from '../hooks/useProjectResource';
import { usePageContext } from '../hooks/usePageContext';
import { Project } from '../../graphql/@generated/genql';
import { gapM, gapS, gray6, gray9 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { PageContent, PageActions } from './Page';
import { Text } from './Text';
import { TabsMenu, TabsMenuItem } from './TabsMenu';
import { Link } from './Link';
import { WatchButton } from './WatchButton';
import { StarButton } from './StarButton';

interface ProjectPageLayoutProps {
    project: Project;
    children: React.ReactNode;
    actions?: boolean;
}

const ProjectHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const StyledProjectHeaderTitle = styled(Text)`
    width: 850px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-top: ${gapM};
`;

const StyledProjectTeamsTitle = styled(Text)`
    display: inline-block;
    padding-top: ${gapM};
`;

export const ProjectPageLayout: React.FC<ProjectPageLayoutProps> = ({ project, children, actions }) => {
    const { user } = usePageContext();
    const t = useTranslations('projects');
    const router = useRouter();
    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(project.id);

    const tabsMenuOptions: Array<[string, string, boolean]> = [
        [t('Goals'), routes.project(project.key), false],
        [t('Settings'), routes.projectSettings(project.key), true],
    ];

    const [watcher, setWatcher] = useState(project._isWatching);
    const onWatchToggle = useCallback(() => {
        setWatcher(!watcher);
    }, [watcher]);

    const [stargizer, setStargizer] = useState(project._isStarred);
    const onStarToggle = useCallback(() => {
        setStargizer(!stargizer);
    }, [stargizer]);

    return (
        <>
            <ProjectHeader>
                <div>
                    {nullable(project.teams?.length, () => (
                        <StyledProjectTeamsTitle weight="bold" color={gray9}>
                            {t('Teams')}:{' '}
                            {project.teams?.map((team, i) =>
                                nullable(team, (te) => (
                                    <span key={te.title}>
                                        <NextLink key={te.slug} passHref href={routes.team(te.slug)}>
                                            <Link inline title={te.description}>
                                                {te.title}
                                            </Link>
                                        </NextLink>
                                        {i < (project.teams ?? []).length - 1 ? ', ' : ''}
                                    </span>
                                )),
                            )}
                        </StyledProjectTeamsTitle>
                    ))}

                    <StyledProjectHeaderTitle size="xxl" weight="bolder" title={project.title}>
                        {project.title}
                    </StyledProjectHeaderTitle>

                    {nullable(project.description, (d) => (
                        <Text size="m" color={gray6} style={{ paddingTop: gapS }}>
                            {d}
                        </Text>
                    ))}
                </div>

                {nullable(actions, () => (
                    <PageActions>
                        <WatchButton watcher={watcher} onToggle={toggleProjectWatching(onWatchToggle, t, watcher)} />
                        <StarButton
                            stargizer={stargizer}
                            count={project._count?.stargizers}
                            onToggle={toggleProjectStar(onStarToggle, t, stargizer)}
                        />
                    </PageActions>
                ))}

                <TabsMenu>
                    {tabsMenuOptions.map(([title, href, ownerOnly]) =>
                        nullable(ownerOnly ? user?.activityId === project.activityId : true, () => (
                            <NextLink key={title} href={href} passHref>
                                <TabsMenuItem active={router.asPath === href}>{title}</TabsMenuItem>
                            </NextLink>
                        )),
                    )}
                </TabsMenu>
            </ProjectHeader>

            {children}
        </>
    );
};
