export const getApiErrorMessage = (error, fallbackMessage = 'Something went wrong. Please try again.') => {
    if (!error) {
        return fallbackMessage;
    }

    // Network errors are common during local dev when backend is down.
    if (error.code === 'ERR_NETWORK' || !error.response) {
        return 'Cannot reach server right now. Please check if backend is running.';
    }

    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) {
        return data;
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
    }

    if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
};
