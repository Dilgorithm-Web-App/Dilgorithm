export const adaptOnboardingToProfilePayload = (formData) => {
    const profileSummary = [
        `Location: ${formData.location || '-'}`,
        `Profession: ${formData.profession || '-'}`,
        `Education: ${formData.education || '-'}`,
    ].join(' | ');

    return {
        bio: profileSummary,
        identityDocs: {
            onboarding: {
                location: formData.location || '',
                profession: formData.profession || '',
                education: formData.education || '',
                sect: formData.sect || '',
                maritalStatus: formData.maritalStatus || '',
            },
        },
    };
};
