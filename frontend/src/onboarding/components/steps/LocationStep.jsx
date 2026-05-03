import { StepQuestion } from './StepQuestion';

export const LocationStep = (props) => (
    <StepQuestion {...props} options={props.optionLists?.locations} />
);
