export const adaptOnboardingToProfilePayload = (formData) => {
    const profileSummary = [
        `Location: ${formData.location || '-'}`,
        `Profession: ${formData.profession || '-'}`,
        `Education: ${formData.education || '-'}`,
        `Interests: ${(Array.isArray(formData.interests) && formData.interests.length > 0) ? formData.interests.join(', ') : '-'}`,
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
                interests: Array.isArray(formData.interests) ? formData.interests : [],
                timeSpan: formData.timeSpan || { knowing: '', marriage: '' },
            },
        },
    };
};
