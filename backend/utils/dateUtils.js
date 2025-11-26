export const isToday = (dateString) => {
    if (!dateString) return false
    try {
        const today = new Date()
        const checkDate = new Date(dateString)
        return today.getDate() === checkDate.getDate() &&
                     today.getMonth() === checkDate.getMonth() &&
                     today.getFullYear() === checkDate.getFullYear()
    } catch {
        return false
    }
}