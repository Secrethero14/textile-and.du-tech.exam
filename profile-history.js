// --- PARSE DATE ---
function parseDate(data) {
    if (!data) return null;
    const raw = data.timestamp || data.date || data.time || data.created_at || data;
    if (!raw) return null;
    if (typeof raw.toDate === 'function') return raw.toDate(); 
    if (raw.seconds) return new Date(raw.seconds * 1000); 
    const date = new Date(raw);
    return isNaN(date.getTime()) ? null : date;
}

// --- FETCH EXAM HISTORY & CALCULATE STATS ---
async function fetchStudentData(email) {
    try {
        const snapshot = await db.collection("exam_results").where("email", "==", email).get();
        document.getElementById('loader').style.display = 'none';
        
        if (snapshot.empty) {
            document.getElementById('historyList').innerHTML = `<div style='text-align:center; padding: 30px; color:#888'><p>আপনি এখনো কোনো এক্সাম দেননি।</p></div>`;
            renderSubjectPerformance([]);
            await updateMistakeBankStat(email);
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

        // আপডেট স্ট্যাটস (Total Exams, Correct, Wrong)
        document.getElementById('statExams').innerText = exams.length;
        document.getElementById('statCorrect').innerText = overallCorrect;

        // 🌟 ভুল ব্যাংকের সাথে ১০০% লাইভ সিঙ্ক (হুবহু একই ইউনিক প্রশ্ন সংখ্যা) 🌟
        await updateMistakeBankStat(email);

        // বিষয় ও অধ্যায়ভিত্তিক পারফরম্যান্স রেন্ডার
        renderSubjectPerformance(exams);

        // এক্সাম হিস্ট্রি লিস্ট রেন্ডার
        const listContainer = document.getElementById('historyList');
        listContainer.innerHTML = ""; 
        exams.forEach(exam => renderHistoryItem(exam, listContainer));

    } catch (e) {
        console.error(e);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('historyList').innerHTML = "<p style='color:red; text-align:center'>ডাটা লোড করতে সমস্যা হয়েছে।</p>";
        renderSubjectPerformance([]);
    }
}

// --- RENDER HISTORY ITEM ---
function renderHistoryItem(data, container) {
    const dateObj = parseDate(data);
    const dateStr = dateObj ? dateObj.toLocaleDateString("en-US", { 
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: 'numeric', minute: '2-digit', hour12: true 
    }) : '<span style="color:#999; font-style:italic;">Unknown Date</span>';
    
    const scoreNum = parseFloat(data.score || 0);
    const scoreClass = scoreNum < 0 ? 'negative' : '';
    const scoreStr = scoreNum.toFixed(2);

    const badgeHtml = data.isPractice ? '<span style="background:#dfe6e9; color:#636e72; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">Practice</span>' : '';
    const retakeLink = `exam.html?id=${data.examId}`;
    const resultLink = `result.html?id=${data.id}`;

    const html = `
        <div class="history-item">
            <div>
                <div class="exam-title">${data.examName || "Untited Exam"} ${badgeHtml}</div>
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
    container.innerHTML += html;
}

