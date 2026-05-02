export const ONBOARDING_STEPS = [
    {
        key: 'profession',
        title: 'What is Your Profession?',
        placeholder: '',
        field: 'profession',
        completedPercent: 0,
        defaultValue: '',
        validate: (value) => String(value || '').trim().length > 0,
    },
    {
        key: 'education',
        title: 'What is Your Highest level of Education?',
        placeholder: '',
        field: 'education',
        completedPercent: 15,
        defaultValue: '',
        validate: (value) => String(value || '').trim().length > 0,
    },
    {
        key: 'location',
        title: 'What is Your Location?',
        placeholder: '',
        field: 'location',
        completedPercent: 30,
        defaultValue: '',
        validate: (value) => String(value || '').trim().length > 0,
    },
    {
        key: 'maritalStatus',
        title: 'What is Your Marital Status?',
        placeholder: '',
        field: 'maritalStatus',
        completedPercent: 45,
        defaultValue: '',
        validate: (value) => String(value || '').trim().length > 0,
    },
    {
        key: 'sect',
        title: 'What is Your Sect?',
        placeholder: '',
        field: 'sect',
        completedPercent: 60,
        defaultValue: '',
        validate: (value) => String(value || '').trim().length > 0,
    },
    {
        key: 'interests',
        title: 'Select Top 3 Interests',
        placeholder: '',
        field: 'interests',
        completedPercent: 90,
        defaultValue: [],
        validate: (value) => Array.isArray(value) && value.length === 3,
    },
    {
        key: 'timeSpan',
        title: '',
        placeholder: '',
        field: 'timeSpan',
        completedPercent: 80,
        defaultValue: { knowing: '', marriage: '' },
        validate: (value) => Boolean(value?.knowing) && Boolean(value?.marriage),
    },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export const getStepIndexByKey = (key) => {
    if (!key) return 0;
    const idx = ONBOARDING_STEPS.findIndex((s) => s.key === key);
    return idx >= 0 ? idx : 0;
};

export const getStepKeyByIndex = (index) => {
    const i = Number.isFinite(index) ? index : 0;
    return ONBOARDING_STEPS[Math.min(Math.max(i, 0), TOTAL_STEPS - 1)]?.key ?? ONBOARDING_STEPS[0]?.key ?? 'profession';
};
