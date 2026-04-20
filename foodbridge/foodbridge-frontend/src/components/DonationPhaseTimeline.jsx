const phaseConfig = [
    { key: 'publishedAt', label: 'Published' },
    { key: 'claimedAt', label: 'Claimed' },
    { key: 'pickupOutAt', label: 'Pickup Out' },
    { key: 'receivedAt', label: 'Received' },
    { key: 'completedAt', label: 'Completed' },
];

const formatTime = (value) => {
    if (!value) {
        return 'Pending';
    }

    return new Date(value).toLocaleString();
};

const DonationPhaseTimeline = ({ donation, compact = false }) => {
    if (!donation) {
        return null;
    }

    return (
        <div className={`rounded border border-slate-200 bg-slate-50 ${compact ? 'p-2' : 'p-3'}`}>
            <p className={`font-semibold text-slate-700 ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
                Pickup Timeline
            </p>

            <div className="space-y-2">
                {phaseConfig.map((phase) => {
                    const done = Boolean(donation[phase.key]);
                    return (
                        <div key={phase.key} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                />
                                <span className={`${compact ? 'text-xs' : 'text-sm'} ${done ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {phase.label}
                                </span>
                            </div>
                            {!compact && (
                                <span className={`text-xs ${done ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {formatTime(donation[phase.key])}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {donation.status === 'EXPIRED' && (
                <p className="mt-2 text-xs font-semibold text-amber-700">This listing expired before claim.</p>
            )}
        </div>
    );
};

export default DonationPhaseTimeline;
