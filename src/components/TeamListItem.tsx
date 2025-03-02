import styled from 'styled-components';
import Link from 'next/link';

import { routes } from '../hooks/router';
import type { Activity } from '../../graphql/@generated/genql';
import { gray4, textColor, gray10, gapM, gapS, gray7 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { Text } from './Text';
import { UserPic } from './UserPic';

interface TeamListItemProps {
    title: string;
    slug: string;
    description?: string;
    owner?: Activity;
}

const StyledTeamListItem = styled.a`
    display: grid;
    grid-template-columns: 500px 40px;
    align-items: center;

    color: ${textColor};
    text-decoration: none;

    transition: background-color 150ms ease-in;

    &:hover {
        background-color: ${gray4};
    }

    &:visited {
        color: ${textColor};
    }

    padding: ${gapM} 40px;
    margin: 0 -40px;
`;

const StyledName = styled.div`
    width: 800px;
    max-width: 100%;
`;

const StyledDescription = styled(Text)`
    margin-top: ${gapS};
`;

const StyledAddon = styled.div`
    justify-self: center;
    align-self: center;
    vertical-align: middle;
`;

const StyledSubTitle = styled(Text)`
    color: ${gray10};
    width: 100%;
    padding-top: ${gapS};
`;

export const TeamListItem: React.FC<TeamListItemProps> = ({ slug, title, description, owner }) => {
    return (
        <Link href={routes.team(slug)} passHref>
            <StyledTeamListItem>
                <StyledName>
                    <Text size="m" weight="bold">
                        {title}
                    </Text>

                    {nullable(description, (d) => (
                        <StyledDescription size="s" color={gray7}>
                            {d}
                        </StyledDescription>
                    ))}

                    <StyledSubTitle size="s"></StyledSubTitle>
                </StyledName>

                <StyledAddon>
                    <UserPic src={owner?.user?.image} email={owner?.user?.email || owner?.ghost?.email} size={24} />
                </StyledAddon>
            </StyledTeamListItem>
        </Link>
    );
};
