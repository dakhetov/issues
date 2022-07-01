/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import styled, { css } from 'styled-components';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

import { Goal, EstimateInput, GoalInput, UserAnyKind, State } from '../../../graphql/@generated/genql';
import { gql } from '../../utils/gql';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { estimatedMeta } from '../../utils/dateTime';
import { nullable } from '../../utils/nullable';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { useMounted } from '../../hooks/useMounted';
import { gapS, star0 } from '../../design/@generated/themes';
import { Page, PageContent } from '../../components/Page';
import { Tag } from '../../components/Tag';
import { PageSep } from '../../components/PageSep';
import { Link } from '../../components/Link';
import { Card, CardInfo, CardContent, CardActions } from '../../components/Card';
import { IssueTitle } from '../../components/IssueTitle';
import { IssueKey } from '../../components/IssueKey';
import { IssueStats } from '../../components/IssueStats';
import { IssueMeta } from '../../components/IssueMeta';
import { IssueListItem } from '../../components/IssueListItem';
import { RelativeTime } from '../../components/RelativeTime';
import { Md } from '../../components/Md';
import { UserCompletion } from '../../components/UserCompletion';
import { EstimateDropdown } from '../../components/EstimateDropdown';
import { UserPic } from '../../components/UserPic';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { StateSwitch } from '../../components/StateSwitch';
import { Reactions } from '../../components/Reactions';

const GoalEditModal = dynamic(() => import('../../components/GoalEditModal'));

const refreshInterval = 3000;

const fetcher = createFetcher((_, id: string) => ({
    goal: [
        {
            id,
        },
        {
            id: true,
            title: true,
            description: true,
            state: {
                id: true,
                title: true,
                hue: true,
            },
            estimate: {
                date: true,
                q: true,
                y: true,
            },
            createdAt: true,
            updatedAt: true,
            project: {
                id: true,
                key: true,
                title: true,
                description: true,
                flow: {
                    id: true,
                },
            },
            computedIssuer: {
                id: true,
                name: true,
                email: true,
            },
            computedOwner: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
            tags: {
                id: true,
                title: true,
                description: true,
            },
            reactions: {
                id: true,
                emoji: true,
                author: {
                    user: {
                        id: true,
                        name: true,
                    },
                },
            },
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
            },
            dependsOn: {
                id: true,
                title: true,
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
            },
            relatedTo: {
                id: true,
                title: true,
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
            },
            blocks: {
                id: true,
                title: true,
                state: {
                    id: true,
                    title: true,
                    hue: true,
                },
            },
        },
    ],
}));

const IssueHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const IssueContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
`;

const StyledIssueInfo = styled.div<{ align: 'left' | 'right' }>`
    ${({ align }) => css`
        justify-self: ${align};
    `}

    ${({ align }) =>
        align === 'right' &&
        css`
            display: grid;
            justify-items: end;
            align-content: space-between;
        `}
`;

const StyledIssueInfoRow = styled.div``;

const ActionButton = styled(Button)`
    margin-left: ${gapS};
`;

const IssueAction = styled.div`
    margin-right: ${gapS};
`;

const IssueBaseActions = styled.div`
    display: flex;
    align-items: center;
`;

const StyledIssueTags = styled.span`
    padding-left: ${gapS};
`;

const IssueTags: React.FC<{ tags: Goal['tags'] }> = ({ tags }) => (
    <StyledIssueTags>
        {tags?.map((tag) => nullable(tag, (t) => <Tag key={t.id} title={t.title} description={t.description} />))}
    </StyledIssueTags>
);

const StyledIssueDeps = styled.div``;

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id } }) => ({
        ssrData: await fetcher(user, id),
    }),
    {
        private: true,
    },
);

const GoalPage = ({ user, locale, ssrData, params: { id } }: ExternalPageProps<{ goal: Goal }, { id: string }>) => {
    const t = useTranslations('goals.id');
    const mounted = useMounted(refreshInterval);

    const { data, mutate } = useSWR(mounted ? [user, id] : null, (...args) => fetcher(...args), {
        refreshInterval,
    });

    // this line is compensation for first render before delayed swr will bring updates
    const goal: Goal = data?.goal ?? ssrData.goal;

    const isUserAllowedToEdit = user?.id === goal?.computedIssuer?.id || user?.id === goal?.computedOwner?.id;
    // @ts-ignore unexpectable trouble with filter
    const [watcher, setWatcher] = useState(goal.watchers?.filter(({ id }) => id === user.activityId).length > 0);
    const [stargizer, setStargizer] = useState(
        // @ts-ignore unexpectable trouble with filter
        goal.stargizers?.filter(({ id }) => id === user.activityId).length > 0,
    );

    const refresh = useCallback(() => mutate(), [mutate]);

    const triggerUpdate = useCallback(
        (goal: GoalInput) => {
            const promise = gql.mutation({
                updateGoal: [
                    {
                        goal,
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: t('Something went wrong 😿'),
                loading: t('We are updating the goal'),
                success: t('Voila! Goal is up to date 🎉'),
            });

            return promise;
        },
        [t],
    );

    const [issueOwner, setIssueOwner] = useState(goal.computedOwner);
    const issueOwnerName = issueOwner?.name || issueOwner?.email;
    const onIssueOwnerChange = useCallback(
        async (owner: UserAnyKind) => {
            setIssueOwner(owner);

            await triggerUpdate({
                id: goal.id,
                ownerId: owner.activity?.id,
            });
        },
        [triggerUpdate, goal],
    );

    const [issueState, setIssueState] = useState(goal.state);
    const onIssueStateChange = useCallback(
        async (state: State) => {
            setIssueState(state);

            await triggerUpdate({
                id: goal.id,
                stateId: state.id,
            });

            refresh();
        },
        [triggerUpdate, goal, refresh],
    );

    const [issueEstimate, setIssueEstimate] = useState<EstimateInput | undefined>(
        goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined,
    );
    const onIssueEstimateChange = useCallback(
        async (estimate?: EstimateInput) => {
            setIssueEstimate(estimate);

            await triggerUpdate({
                id: goal.id,
                estimate,
            });
        },
        [triggerUpdate, goal],
    );

    const onWatchToggle = useCallback(async () => {
        setWatcher((w) => !w);

        await triggerUpdate({
            id: goal.id,
            watch: !watcher,
        });
    }, [triggerUpdate, goal, watcher]);

    const onStarToggle = useCallback(async () => {
        setStargizer((s) => !s);

        await triggerUpdate({
            id: goal.id,
            star: !stargizer,
        });
    }, [triggerUpdate, goal, stargizer]);

    const onReactionsToggle = useCallback(
        async (emoji?: string) => {
            if (!emoji) return;

            await gql.mutation({
                toggleReaction: [
                    {
                        reaction: {
                            emoji,
                            goalId: goal.id,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            refresh();
        },
        [goal, refresh],
    );

    return (
        <Page locale={locale} title={goal.title}>
            <IssueHeader>
                <StyledIssueInfo align="left">
                    <IssueKey id={goal.id}>
                        <IssueTags tags={goal.tags} />
                    </IssueKey>

                    <IssueTitle title={goal.title} project={goal.project} />

                    <IssueStats
                        state={nullable(issueState, (s) => (
                            <StateSwitch state={s} flowId={goal.project?.flow?.id} onClick={onIssueStateChange} />
                        ))}
                        comments={0}
                        updatedAt={goal.updatedAt}
                    />
                </StyledIssueInfo>

                <StyledIssueInfo align="right">
                    <StyledIssueInfoRow>
                        <ActionButton
                            text={t(watcher ? 'Unwatch' : 'Watch')}
                            iconLeft={<Icon noWrap type={watcher ? 'eye' : 'eyeClosed'} size="s" />}
                            onClick={onWatchToggle}
                        />
                        <ActionButton
                            text={t(stargizer ? 'Unstar' : 'Star')}
                            iconLeft={
                                <Icon
                                    noWrap
                                    type={stargizer ? 'starFilled' : 'star'}
                                    color={stargizer ? star0 : undefined}
                                    size="s"
                                />
                            }
                            onClick={onStarToggle}
                        />
                    </StyledIssueInfoRow>

                    {/* TODO: set curr project in form */}
                    {/* TODO: open create form with `C` hotkey */}
                    <StyledIssueInfoRow>
                        <Button
                            view="primary"
                            text={t('New goal')}
                            onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                        />
                    </StyledIssueInfoRow>
                </StyledIssueInfo>
            </IssueHeader>

            <PageSep />

            <IssueContent>
                <Card>
                    <CardInfo>
                        <Link inline>{goal.computedIssuer!.name}</Link> — <RelativeTime date={goal.createdAt} />
                    </CardInfo>

                    <CardContent>
                        <Md>{goal.description}</Md>
                    </CardContent>

                    <CardActions>
                        <IssueBaseActions>
                            <IssueAction>
                                <UserCompletion
                                    text={issueOwnerName}
                                    placeholder={t('Set owner')}
                                    title={t('Set owner')}
                                    query={issueOwnerName}
                                    userPic={<UserPic src={issueOwner?.image} size={16} />}
                                    onClick={isUserAllowedToEdit ? onIssueOwnerChange : undefined}
                                />
                            </IssueAction>

                            <IssueAction>
                                <EstimateDropdown
                                    size="m"
                                    text={t('Schedule')}
                                    placeholder={t('Date input mask placeholder')}
                                    mask={t('Date input mask')}
                                    value={issueEstimate}
                                    defaultValuePlaceholder={issueEstimate ?? estimatedMeta()}
                                    onClose={isUserAllowedToEdit ? onIssueEstimateChange : undefined}
                                />
                            </IssueAction>
                            <IssueAction>
                                <Reactions reactions={goal.reactions} onClick={onReactionsToggle} />
                            </IssueAction>
                        </IssueBaseActions>

                        {nullable(isUserAllowedToEdit, () => (
                            <Button text={t('Edit goal')} onClick={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                        ))}
                    </CardActions>
                </Card>

                <StyledIssueDeps>
                    {nullable(goal.dependsOn?.length, () => (
                        <IssueMeta title={t('Depends on')}>
                            {goal.dependsOn?.map((d) =>
                                nullable(d, (dep) => <IssueListItem key={d?.id} issue={dep} />),
                            )}
                        </IssueMeta>
                    ))}

                    {nullable(goal.blocks?.length, () => (
                        <IssueMeta title={t('Blocks')}>
                            {goal.blocks?.map((d) => nullable(d, (dep) => <IssueListItem key={d?.id} issue={dep} />))}
                        </IssueMeta>
                    ))}

                    {nullable(goal.relatedTo?.length, () => (
                        <IssueMeta title={t('Related')}>
                            {goal.relatedTo?.map((d) =>
                                nullable(d, (dep) => <IssueListItem key={d?.id} issue={dep} />),
                            )}
                        </IssueMeta>
                    ))}
                </StyledIssueDeps>
            </IssueContent>

            <PageContent>
                <pre>{JSON.stringify(goal, null, 2)}</pre>
            </PageContent>

            {nullable(isUserAllowedToEdit, () => (
                <GoalEditModal goal={goal} onSubmit={refresh} />
            ))}
        </Page>
    );
};

export default GoalPage;
