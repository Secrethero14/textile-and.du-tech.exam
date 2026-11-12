// Shared exam schedule date parser and lifecycle state resolver (used by main.js and exam.html).

/**
 * Parse ISO, DD/MM/YYYY, or YYYY-MM-DD (with optional 12h/24h time and Bengali digits) into a Date.
 */
function parseExamScheduleDate(str) {
    if (!str) return null;
    let s = String(str).trim();
    if (!s) return null;

    const bnMap = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
    s = s.replace(/[০-৯]/g, function(m) { return bnMap[m]; });

    // Parse explicit DD/MM/YYYY or DD-MM-YYYY as local time first (prevents MM/DD swap).
    const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(AM|PM))?)?$/i);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        let hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
        const min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
        const sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
        const ampm = dmyMatch[7] ? dmyMatch[7].toUpperCase() : null;
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        const d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) return d;
    }

    // Parse YYYY-MM-DD or YYYY/MM/DD without ISO 'T'/'Z' as local time (prevents UTC midnight shift).
    const ymdMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\s*(AM|PM))?)?$/i);
    if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        let hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
        const min = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
        const sec = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
        const ampm = ymdMatch[7] ? ymdMatch[7].toUpperCase() : null;
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        const d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) return d;
    }

    const fallback = new Date(s);
    return !isNaN(fallback.getTime()) ? fallback : null;
}

/**
 * Determine exam lifecycle phase: 'upcoming' | 'live' | 'practice' | 'open'.
 * Start/End times are optional; once End Time passes, exam NEVER locks (always transitions to 'practice').
 */
function getExamPhaseState(opts) {
    const o = opts || {};
    const now = o.now instanceof Date ? o.now : new Date();
    const startDate = parseExamScheduleDate(o.startTime);
    const endDate = parseExamScheduleDate(o.endTime);

    let statusStr = String(o.status || '').trim().toLowerCase();
    if (statusStr.startsWith('{') || statusStr.startsWith('[') || /^\d+$/.test(statusStr)) {
        statusStr = '';
    }

    if (statusStr === 'practice' || statusStr === 'ended' || statusStr === 'unlocked') {
        return { phase: 'practice', startDate: startDate, endDate: endDate };
    }

    if (statusStr === 'live' || statusStr === 'active') {
        if (endDate && now > endDate) {
            return { phase: 'practice', startDate: startDate, endDate: endDate };
        }
        return { phase: 'live', startDate: startDate, endDate: endDate };
    }

    if (statusStr === 'upcoming' || statusStr === 'scheduled') {
        if (startDate && now >= startDate) {
            if (endDate && now > endDate) return { phase: 'practice', startDate: startDate, endDate: endDate };
            if (endDate && now <= endDate) return { phase: 'live', startDate: startDate, endDate: endDate };
            return { phase: 'open', startDate: startDate, endDate: endDate };
        }
        return { phase: 'upcoming', startDate: startDate, endDate: endDate };
    }

    if (startDate && now < startDate) {
        return { phase: 'upcoming', startDate: startDate, endDate: endDate };
    }
    if (endDate && now <= endDate && (!startDate || now >= startDate)) {
        return { phase: 'live', startDate: startDate, endDate: endDate };
    }
    if (endDate && now > endDate) {
        return { phase: 'practice', startDate: startDate, endDate: endDate };
    }

    return { phase: 'open', startDate: startDate, endDate: endDate };
}
