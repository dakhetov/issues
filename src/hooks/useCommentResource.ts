import { z } from 'zod';
import toast from 'react-hot-toast';

import { gql } from '../utils/gql';
import { Comment, CommentDeleteInput } from '../../graphql/@generated/genql';

import { usePageContext } from './usePageContext';

type i18n = (key: string) => string;

// FIXME: problem with passing this errors
const createSchemaProvider = (t: i18n) =>
    z.object({
        description: z
            .string({
                required_error: t("Comments's description is required"),
                invalid_type_error: t("Comments's description must be a string"),
            })
            .min(1, {
                message: t("Comments's description must be longer than 1 symbol"),
            }),
        goalId: z.string().min(1),
    });

const updateSchemaProvider = (t: (key: string) => string) =>
    z.object({
        id: z.string().min(1),
        description: z
            .string({
                required_error: t("Comments's description is required"),
                invalid_type_error: t("Comments's description must be a string"),
            })
            .min(1, {
                message: t("Comments's description must be longer than 1 symbol"),
            }),
    });

export type CreateFormType = z.infer<ReturnType<typeof createSchemaProvider>>;
export type UpdateFormType = z.infer<ReturnType<typeof updateSchemaProvider>>;

interface UseCommentResourceParams {
    t: i18n;
}

export const useCommentResource = ({ t }: UseCommentResourceParams) => {
    const { user } = usePageContext();

    const create =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ goalId, description }: CreateFormType) => {
            if (!user) return;

            const promise = gql.mutation({
                createComment: [
                    {
                        data: {
                            goalId,
                            description,
                            activityId: user.id,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: t('Something went wrong 😿'),
                loading: t('We are publishing your comment'),
                success: t('Voila! Comment is here 🎉'),
            });

            const data = await promise;

            data?.createComment && cb(data.createComment);
        };

    const update =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ id, description }: UpdateFormType) => {
            const promise = gql.mutation({
                updateComment: [
                    {
                        data: {
                            id,
                            description,
                        },
                    },
                    {
                        id: true,
                        description: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: t('Something went wrong 😿'),
                loading: t('We are updating your comment'),
                success: t('Comment updated'),
            });

            const data = await promise;

            data.updateComment && cb(data.updateComment);
        };

    const remove =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ id }: CommentDeleteInput) => {
            const promise = gql.mutation({
                deleteComment: [
                    {
                        data: {
                            id,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: t('Something went wrong 😿'),
                loading: t('We are deleting your comment'),
                success: t('Comment removed'),
            });

            const data = await promise;

            data.deleteComment && cb(data.deleteComment);
        };

    return { createSchema: createSchemaProvider(t), updateSchema: updateSchemaProvider(t), create, update, remove };
};
