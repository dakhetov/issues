import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import useSWR from 'swr';
import dynamic from 'next/dynamic';

import { gapM } from '../design/@generated/themes';
import { createFetcher } from '../utils/createFetcher';
import { State as StateModel } from '../../graphql/@generated/genql';
import { useKeyPress } from '../hooks/useKeyPress';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { usePageContext } from '../hooks/usePageContext';

import { State } from './State';

const Popup = dynamic(() => import('./Popup'));

interface StateSwitchProps {
    state: StateModel;
    flowId?: string;

    onClick?: (state: StateModel) => void;
}

const StyledStates = styled.div`
    padding-left: ${gapM};
`;

const fetcher = createFetcher((_, id: string) => ({
    flow: [
        {
            id,
        },
        {
            id: true,
            title: true,
            states: {
                id: true,
                title: true,
                hue: true,
                default: true,
            },
        },
    ],
}));

const StateSwitch: React.FC<StateSwitchProps> = ({ state, flowId, onClick }) => {
    const { user } = usePageContext();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const downPress = useKeyPress('ArrowDown');
    const upPress = useKeyPress('ArrowUp');
    const [cursor, setCursor] = useState<number>();
    const { data } = useSWR(flowId, (id) => fetcher(user, id));

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(!popupVisible);
    }, [popupVisible]);

    const onItemClick = useCallback(
        (s: StateModel) => () => {
            setPopupVisibility(false);
            onClick && onClick(s);
        },
        [onClick],
    );

    const [onESC] = useKeyboard([KeyCode.Escape], () => popupVisible && setPopupVisibility(false));

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        if (data?.flow?.states?.length && cursor) {
            onItemClick(data?.flow?.states[cursor])();
            setPopupVisibility(false);
        }
    });

    useEffect(() => {
        const states = data?.flow?.states;

        if (states?.length && downPress) {
            setCursor((prevState = 0) => (prevState < states.length - 1 ? prevState + 1 : prevState));
        }
    }, [data?.flow, downPress]);

    useEffect(() => {
        if (data?.flow?.states?.length && upPress) {
            setCursor((prevState = 0) => (prevState > 0 ? prevState - 1 : prevState));
        }
    }, [data?.flow, upPress]);

    useEffect(() => {
        if (data?.flow?.states?.length && state) {
            for (let currCursor = 0; currCursor < data?.flow?.states.length; currCursor++) {
                if (data?.flow?.states[currCursor].id === state.id) {
                    setCursor(currCursor);
                    break;
                }
            }
        }
    }, [data?.flow, state]);

    return (
        <>
            <span ref={popupRef} {...onESC} {...onENTER}>
                <State ref={buttonRef} title={state?.title} hue={state?.hue} onClick={onButtonClick} />
            </span>

            <Popup
                placement="right"
                overflow="hidden"
                visible={popupVisible && Boolean(data?.flow?.states?.length)}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                offset={[0, 4]}
            >
                <StyledStates>
                    {data?.flow?.states
                        ?.filter((s) => s.id !== state.id)
                        .map((s) => (
                            <State
                                key={s.id}
                                hue={s.hue}
                                title={s.title}
                                // focused={s.id === state?.id || cursor === i}
                                onClick={onItemClick(s)}
                            />
                        ))}
                </StyledStates>
            </Popup>
        </>
    );
};

export default StateSwitch;
