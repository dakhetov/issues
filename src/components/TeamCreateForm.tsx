import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';
import useSWR from 'swr';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { gapS, gray6, star0 } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { nullable } from '../utils/nullable';
import { gql } from '../utils/gql';
import { submitKeys } from '../utils/hotkeys';
import { errorsProvider } from '../utils/forms';
import { keyPredictor } from '../utils/keyPredictor';
import { routes, useRouter } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';

import { Icon } from './Icon';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { FormTitle } from './FormTitle';
import { Link } from './Link';
import { ModalContent, ModalHeader } from './Modal';
import { InputContainer } from './InputContaier';
import { Text } from './Text';
import { FlowComboBox } from './FlowComboBox';

const KeyInput = dynamic(() => import('./KeyInput'));

const flowFetcher = createFetcher(() => ({
    flowRecommended: {
        id: true,
        title: true,
        states: {
            id: true,
            title: true,
        },
    },
}));
const teamsFetcher = createFetcher((_, title: string) => ({
    teams: [
        {
            data: {
                title,
            },
        },
        {
            title: true,
        },
    ],
}));

const StyledTitleContainer = styled.div`
    display: flex;
    position: relative;
`;

const StyledTeamKeyContainer = styled.div`
    position: relative;
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const StyledTeamKeyInputContainer = styled(InputContainer)`
    box-sizing: border-box;
    width: fit-content;
    padding-right: ${gapS};
`;

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        key: z.string().min(3),
        title: z
            .string({
                required_error: t("Team's title is required"),
                invalid_type_error: t("Team's title must be a string"),
            })
            .min(2, {
                message: t("Team's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
        flow: z.object({
            id: z.string(),
        }),
    });

export type TeamFormType = z.infer<ReturnType<typeof schemaProvider>>;

const TeamCreateForm: React.FC = () => {
    const t = useTranslations('teams.new');

    const router = useRouter();
    const { locale, user } = usePageContext();

    const [focusedInput, setFocusedInput] = useState(false);
    const [hoveredInput, setHoveredInput] = useState(false);
    const [busy, setBusy] = useState(false);

    const schema = schemaProvider(t);

    const {
        register,
        handleSubmit,
        watch,
        setFocus,
        setValue,
        control,
        formState: { errors, isValid, isSubmitted },
    } = useForm<TeamFormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: false,
    });

    useEffect(() => {
        setTimeout(() => setFocus('title'), 0);
    }, [setFocus]);

    const errorsResolver = errorsProvider(errors, isSubmitted);
    const titleWatcher = watch('title');
    const keyWatcher = watch('key');

    useDebouncedEffect(
        () => {
            setValue('key', titleWatcher && titleWatcher !== '' ? keyPredictor(titleWatcher) : '');
        },
        300,
        [setValue, titleWatcher],
    );

    const { data: flowData } = useSWR('flow', () => flowFetcher(user));
    const { data: teamsData } = useSWR(titleWatcher && titleWatcher !== '' ? [user, titleWatcher] : null, (...args) =>
        teamsFetcher(...args),
    );

    useEffect(() => {
        if (flowData?.flowRecommended) {
            setValue('flow', flowData?.flowRecommended[0]);
        }
    }, [setValue, flowData?.flowRecommended]);

    const createTeam = async (form: TeamFormType) => {
        setBusy(true);

        const promise = gql.mutation({
            createTeam: [
                {
                    data: {
                        key: form.key,
                        title: form.title,
                        description: form.description,
                        flowId: form.flow.id,
                    },
                },
                {
                    slug: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new team'),
            success: t('Voila! Team is here 🎉'),
        });

        const res = await promise;

        res.createTeam?.slug && router.team(res.createTeam.slug);
        dispatchModalEvent(ModalEvent.TeamCreateModal)();
    };

    const isTeamTitleAvailable = Boolean(teamsData?.teams?.length === 0);
    const richProps = {
        b: (c: React.ReactNode) => (
            <Text as="span" size="s" weight="bolder">
                {c}
            </Text>
        ),
        key: () => keyWatcher,
    };

    return (
        <>
            <ModalHeader>
                <FormTitle>{t('Create new team')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Form onSubmit={handleSubmit(createTeam)} submitHotkey={submitKeys}>
                    <StyledTitleContainer>
                        <FormInput
                            {...register('title')}
                            placeholder={t("Team's title")}
                            flat="bottom"
                            brick="right"
                            disabled={busy}
                            error={errorsResolver('title')}
                            onMouseEnter={() => setHoveredInput(true)}
                            onMouseLeave={() => setHoveredInput(false)}
                            onFocus={() => setFocusedInput(true)}
                            onBlur={() => setFocusedInput(false)}
                        />

                        {nullable(titleWatcher, () => (
                            <StyledTeamKeyContainer>
                                <Controller
                                    name="key"
                                    control={control}
                                    render={({ field }) => (
                                        <StyledTeamKeyInputContainer
                                            brick="left"
                                            hovered={hoveredInput}
                                            focused={focusedInput}
                                        >
                                            <KeyInput
                                                disabled={busy}
                                                available={isTeamTitleAvailable}
                                                tooltip={
                                                    isTeamTitleAvailable
                                                        ? t.rich(
                                                              'Perfect! Issues in your team will look like',
                                                              richProps,
                                                          )
                                                        : t.rich('Team with key already exists', richProps)
                                                }
                                                {...field}
                                            />
                                        </StyledTeamKeyInputContainer>
                                    )}
                                />
                            </StyledTeamKeyContainer>
                        ))}
                    </StyledTitleContainer>

                    <FormTextarea
                        {...register('description')}
                        placeholder={t('And its description')}
                        flat="both"
                        disabled={busy}
                        error={errorsResolver('description')}
                    />

                    <FormActions flat="top">
                        <FormAction left inline>
                            <Controller
                                name="flow"
                                control={control}
                                render={({ field }) => (
                                    <FlowComboBox
                                        disabled
                                        text={t('Flow')}
                                        placeholder={t('Flow or state title')}
                                        error={errorsResolver(field.name)}
                                        {...field}
                                    />
                                )}
                            />
                        </FormAction>
                        <FormAction right inline>
                            <Button
                                view="primary"
                                disabled={busy}
                                outline={!isValid}
                                type="submit"
                                text={t('Create team')}
                            />
                        </FormAction>
                    </FormActions>
                </Form>

                <StyledFormBottom>
                    <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                        {t.rich('Press key to create the team', {
                            key: () => <Keyboard command enter />,
                        })}
                    </Tip>

                    <Link href={routes.help(locale, 'teams')}>
                        <Icon type="question" size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            </ModalContent>
        </>
    );
};

export default TeamCreateForm;
