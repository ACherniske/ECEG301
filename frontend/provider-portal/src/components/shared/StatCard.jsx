export const StatCard = ({ label, value, bgColor, textColor, borderColor, icon: Icon }) => {
    return (
        <div className={`${bgColor} p-6 rounded-lg border-2 shadow-sm ${borderColor}`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className={`text-sm font-medium mb-2 ${textColor}`}>{label}</div>
                    <div className={`text-4xl font-bold ${textColor}`}>{value}</div>
                </div>
                {Icon && <Icon size={32} className={textColor} />}
            </div>
        </div>
    )
}