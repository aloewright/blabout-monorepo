/// <reference types="react" />
import { SurveyAppearanceTheme } from '../surveys-utils';
export declare function BottomSection({ text, submitDisabled, appearance, onSubmit, link, }: {
    text: string;
    submitDisabled: boolean;
    appearance: SurveyAppearanceTheme;
    onSubmit: () => void;
    link?: string | null;
}): JSX.Element;
