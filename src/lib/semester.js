/**
 * Utility functions for handling Taiwan Academic Semesters
 */

/**
 * Get the Taiwan academic semester string for a given date.
 * Formats as \"YYYS\" where YYY is Taiwan year (CE - 1911) and S is semester (1 or 2).
 * 
 * Rules:
 * - Aug 1 to Jan 31: 1st semester (e.g., 2026.8 = 1151) -> (Year - 1911) + '1'
 * - Feb 1 to Jul 31: 2nd semester (e.g., 2026.2 = 1142) -> (Year - 1912) + '2'
 * 
 * @param {Date|string} inputDate - Date object or ISO string
 * @returns {string} Semester string, e.g., "1142"
 */
export function getCurrentSemester(inputDate = new Date()) {
    const d = new Date(inputDate);
    const year = d.getFullYear(); // e.g., 2026
    const month = d.getMonth() + 1; // 1 to 12

    // Feb 1 to Jul 31 -> 2nd semester of previous academic year
    if (month >= 2 && month <= 7) {
        const twYear = year - 1912;
        return `${twYear}2`;
    }
    // Aug 1 to Jan 31 -> 1st semester of current academic year
    else {
        // If Jan, it belongs to the previous CE year's academic year start
        const adjustedYear = month === 1 ? year - 1 : year;
        const twYear = adjustedYear - 1911;
        return `${twYear}1`;
    }
}

/**
 * Get the start and end dates for a given academic semester.
 * 
 * @param {string} semesterStr - Semester string, e.g., "1142"
 * @returns {{ start: string, end: string }} Start and End dates in ISO format (YYYY-MM-DD)
 */
export function getSemesterDates(semesterStr) {
    if (!semesterStr || semesterStr.length < 4) return null;

    // Last char is semester (1 or 2), the rest is TW year
    const s = semesterStr.slice(-1);
    const twYearStr = semesterStr.slice(0, -1);

    const twYear = parseInt(twYearStr, 10);
    const ceYear = twYear + 1911;

    if (s === '1') {
        // 1st semester: Aug 1 to Jan 31 of NEXT year
        return {
            start: `${ceYear}-08-01`,
            end: `${ceYear + 1}-01-31`
        };
    } else if (s === '2') {
        // 2nd semester: Feb 1 to Jul 31 of THIS year (note: ceYear was derived from twYear + 1911, but for 2nd semester the CE year is twYear + 1912)
        const actualCeYear = twYear + 1912;
        return {
            start: `${actualCeYear}-02-01`,
            end: `${actualCeYear}-07-31`
        };
    }

    return null;
}

/**
 * Calculates the progress percentage of the current semester.
 * 
 * @param {Date|string} inputDate - Current date
 * @returns {number} Percentage between 0 and 100
 */
export function getSemesterProgress(inputDate = new Date()) {
    const d = new Date(inputDate);
    const semester = getCurrentSemester(d);
    const dates = getSemesterDates(semester);

    if (!dates) return 0;

    const start = new Date(dates.start).getTime();
    const end = new Date(dates.end).getTime();
    const current = d.getTime();

    if (current <= start) return 0;
    if (current >= end) return 100;

    return Math.round(((current - start) / (end - start)) * 100);
}

/**
 * Helper to get week number of current semester.
 */
export function getSemesterWeek(inputDate = new Date()) {
    const d = new Date(inputDate);
    const semester = getCurrentSemester(d);
    const dates = getSemesterDates(semester);

    if (!dates) return 0;

    const start = new Date(dates.start).getTime();
    const current = d.getTime();

    if (current <= start) return 1;

    const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
}
