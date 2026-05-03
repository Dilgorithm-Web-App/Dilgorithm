import { StepQuestion } from './StepQuestion';

export const EducationStep = (props) => (
    <StepQuestion {...props} options={props.optionLists?.education} />
);
