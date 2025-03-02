import { arg, nonNull } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Reaction, ReactionToggleInput } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const query = (t: ObjectDefinitionBlock<'Query'>) => {};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('toggleReaction', {
        type: Reaction,
        args: {
            data: nonNull(arg({ type: ReactionToggleInput })),
        },
        resolve: async (_, { data: { emoji, goalId, commentId } }, { db, activity }) => {
            if (!activity) return null;

            const existingReaction = await db.reaction.findFirst({
                where: { emoji, goalId, commentId },
            });

            const isUserReaction = existingReaction && existingReaction.activityId === activity.id;
            const isReactionForCurrentGoal = isUserReaction && existingReaction.goalId === goalId;
            const isReactionForCurrentComment = isUserReaction && existingReaction.commentId === commentId;

            try {
                if (isReactionForCurrentGoal || isReactionForCurrentComment) {
                    return db.reaction.delete({
                        where: {
                            id: existingReaction.id,
                        },
                    });
                }

                return db.reaction.create({
                    data: {
                        emoji,
                        goalId,
                        commentId,
                        activityId: activity.id,
                    },
                });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
