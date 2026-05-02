import { LocationStep } from '../components/steps/LocationStep';
import { ProfessionStep } from '../components/steps/ProfessionStep';
import { EducationStep } from '../components/steps/EducationStep';
import { SectStep } from '../components/steps/SectStep';
import { MaritalStatusStep } from '../components/steps/MaritalStatusStep';

const STEP_COMPONENTS = {
    location: LocationStep,
    profession: ProfessionStep,
    education: EducationStep,
    maritalStatus: MaritalStatusStep,
    sect: SectStep,
};

export class StepFactory {
    static create(stepKey) {
        return STEP_COMPONENTS[stepKey] || LocationStep;
    }
}
