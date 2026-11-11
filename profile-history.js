// --- SYNC LIVE MISTAKE BANK STATS ---
async function updateMistakeBankStat(email) {
    try {
        if (!email) return;
        const cleanEmail = String(email).trim().toLowerCase();
        
        let snapshot = await db.collection("user_mistakes")
            .where("email", "==", cleanEmail)
            .where("status", "==", "wrong")
            .get();

        // ফলব্যাক: যদি লোয়ারকেসে কিছু না পায়, কিন্তু আসল email অন্য কেসিং-এ থাকে
        if (snapshot.empty && email !== cleanEmail) {
            snapshot = await db.collection("user_mistakes")
                .where("email", "==", email)
                .where("status", "==", "wrong")
                .get();
        }

        const uniqueMistakes = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            const key = (data.question || '').trim().replace(/\s+/g, ' ');
            if (key) {
                uniqueMistakes.add(key);
            }
        });

        const statWrongEl = document.getElementById('statWrong');
        if (statWrongEl) {
            statWrongEl.innerText = uniqueMistakes.size;
        }
    } catch (err) {
        console.warn("Live mistake bank count error:", err);
    }
}

// --- FETCH EXAM HISTORY & CALCULATE STATS ---
async function fetchStudentData(email) {
    try {
        // ১. ব্যাকগ্রাউন্ডে ভুল ব্যাংকের মোট ভুলের সংখ্যা সিঙ্ক শুরু করা
        updateMistakeBankStat(email);

        const snapshot = await db.collection("exam_results").where("email", "==", email).get();
        document.getElementById('loader').style.display = 'none';
        
        if (snapshot.empty) {
            document.getElementById('historyList').innerHTML = `<div style='text-align:center; padding: 30px; color:#888'><p>আপনি এখনো কোনো এক্সাম দেননি।</p></div>`;
            renderSubjectPerformance([]);
            return;
        }

        let exams = [];
        let overallCorrect = 0;
        let overallWrong = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            exams.push({ id: doc.id, ...data });
            
            if(!data.isPractice) { 
                overallCorrect += Number(data.correct || 0);
                overallWrong += Number(data.wrong || 0);
            }
        });

        exams.sort((a, b) => {
            const dateA = parseDate(a) || new Date(0);
            const dateB = parseDate(b) || new Date(0);
            return dateB - dateA;
        });

        // আপডেট স্ট্যাটস (Total Exams, Correct)
        document.getElementById('statExams').innerText = exams.length;
        document.getElementById('statCorrect').innerText = overallCorrect;

        // বিষয় ও অধ্যায়ভিত্তিক পারফরম্যান্স রেন্ডার
        renderSubjectPerformance(exams);

        // এক্সাম হিস্ট্রি লিস্ট রেন্ডার (একবারে DOM আপডেট)
        const listContainer = document.getElementById('historyList');
        listContainer.innerHTML = exams.map(exam => buildHistoryItemHtml(exam)).join('');

    } catch (e) {
        console.error("fetchStudentData error:", e);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('historyList').innerHTML = "<p style='color:red; text-align:center'>ডাটা লোড করতে সমস্যা হয়েছে।</p>";
        renderSubjectPerformance([]);
    }
}

function escapeHistoryHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- BUILD HISTORY ITEM HTML ---
function buildHistoryItemHtml(data) {
    const dateObj = parseDate(data);
    const dateStr = dateObj ? dateObj.toLocaleDateString("en-US", { 
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: 'numeric', minute: '2-digit', hour12: true 
    }) : '<span style="color:#999; font-style:italic;">Unknown Date</span>';
    
    const scoreNum = parseFloat(data.score || 0);
    const scoreClass = scoreNum < 0 ? 'negative' : '';
    const scoreStr = scoreNum.toFixed(2);

    const badgeHtml = data.isPractice ? '<span style="background:#dfe6e9; color:#636e72; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">Practice</span>' : '';
    const safeExamName = escapeHistoryHtml(data.examName || "Untitled Exam");
    const retakeLink = `exam.html?id=${encodeURIComponent(data.examId || '')}`;
    const resultLink = `result.html?id=${encodeURIComponent(data.id || '')}`;

    return `
        <div class="history-item">
            <div>
                <div class="exam-title">${safeExamName} ${badgeHtml}</div>
                <div class="exam-meta">
                    <span><i class="far fa-clock"></i> ${dateStr}</span>
                    <span class="score-badge ${scoreClass}">স্কোর: ${scoreStr}</span>
                </div>
            </div>
            <div class="btn-group">
                <a href="${resultLink}" class="btn-action btn-view"><i class="fas fa-file-invoice"></i> রেজাল্ট</a>
                <a href="${retakeLink}" class="btn-action btn-retake"><i class="fas fa-redo"></i> আবার দিন</a>
            </div>
        </div>
    `;
}
