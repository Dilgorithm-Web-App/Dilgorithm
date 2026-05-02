import { LocationStep } from '../components/steps/LocationStep';
import { ProfessionStep } from '../components/steps/ProfessionStep';
import { EducationStep } from '../components/steps/EducationStep';
import { SectStep } from '../components/steps/SectStep';
import { MaritalStatusStep } from '../components/steps/MaritalStatusStep';
import { InterestsStep } from '../components/steps/InterestsStep';
import { TimeSpanStep } from '../components/steps/TimeSpanStep';

const STEP_COMPONENTS = {
    location: LocationStep,
    profession: ProfessionStep,
    education: EducationStep,
    maritalStatus: MaritalStatusStep,
    sect: SectStep,
    timeSpan: TimeSpanStep,
    interests: InterestsStep,
};

export class StepFactory {
    static create(stepKey) {
        return STEP_COMPONENTS[stepKey] || LocationStep;
    }
}
