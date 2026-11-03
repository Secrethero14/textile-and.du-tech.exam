// --- SUBJECT & CHAPTER NORMALIZERS ---
function normalizeSubject(raw) {
    if (!raw) return null;
    const s = String(raw).trim().toLowerCase();
    if (s === 'general' || s === 'subject' || s === 'chapter' || s === 'অধ্যায়' || s === 'topic' || s === 'undefined' || s === 'null') return null;
    if (s.includes('physic') || s.includes('পদার্থ')) return 'পদার্থবিজ্ঞান (Physics)';
    if (s.includes('chem') || s.includes('রসায়') || s.includes('রসায')) return 'রসায়ন (Chemistry)';
    if (s.includes('math') || s.includes('গণিত') || s.includes('হায়ার ম্যাথ') || s.includes('উচ্চতর গণিত') || s.includes('ম্যাথ')) return 'উচ্চতর গণিত (Higher Math)';
    if (s.includes('eng') || s.includes('ইংরেজ')) return 'ইংরেজি (English)';
    if (s.includes('bang') || s.includes('বাংলা')) return 'বাংলা (Bangla)';
    return null;
}

function normalizeChapter(raw) {
    if (!raw) return null;
    let c = String(raw).trim();
    const lower = c.toLowerCase();
    if (lower === 'general' || lower === 'subject' || lower === 'chapter' || lower === 'অধ্যায়' || lower === 'topic' || lower === 'undefined' || lower === 'null' || lower === '') return null;
    c = c.replace(/রসায়ন/g, 'রসায়ন').replace(/২য়/g, '২য়');
    return c;
}

// --- RENDER SUBJECT & CHAPTER PERFORMANCE ---
function renderSubjectPerformance(exams) {
    const container = document.getElementById('subjectPerformanceList');
    if (!container) return;

    let subjectStats = {};

    exams.forEach(exam => {
        if (exam.analysis && typeof exam.analysis === 'object') {
            for (const [ch, chData] of Object.entries(exam.analysis)) {
                if (!chData || typeof chData !== 'object') continue;
                const sub = normalizeSubject(chData.subject);
                const chName = normalizeChapter(chData.chapter || (ch.includes(':::') ? ch.split(':::')[1] : ch));
                if (!sub || !chName) continue;
                const cCount = Number(chData.correct || 0);
                const tCount = Number(chData.total || 0);
                if (tCount <= 0) continue;

                if (!subjectStats[sub]) {
                    subjectStats[sub] = { correct: 0, total: 0, chapters: {} };
                }
                subjectStats[sub].correct += cCount;
                subjectStats[sub].total += tCount;

                if (!subjectStats[sub].chapters[chName]) {
                    subjectStats[sub].chapters[chName] = { correct: 0, total: 0 };
                }
                subjectStats[sub].chapters[chName].correct += cCount;
                subjectStats[sub].chapters[chName].total += tCount;
            }
        }
    });

    const subjects = Object.keys(subjectStats);
    if (subjects.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 25px 15px; color:#888;">
                <i class="fas fa-chart-pie fa-2x" style="opacity:0.3; margin-bottom:10px;"></i>
                <p style="margin:0; font-size:14px; color:#636e72;">তুমি এক্সাম দেওয়া শুরু করলে এখানে প্রতিটি বিষয় ও অধ্যায়ের দুর্বলতা ও প্রস্তুতি স্বয়ংক্রিয়ভাবে দেখতে পাবে।</p>
            </div>
        `;
        return;
    }

    const colorMap = {
        'পদার্থবিজ্ঞান (Physics)': '#0984e3',
        'রসায়ন (Chemistry)': '#00b894',
        'উচ্চতর গণিত (Higher Math)': '#6c5ce7',
        'ইংরেজি (English)': '#e17055',
        'বাংলা (Bangla)': '#fdcb6e',
        'অন্যান্য (Other)': '#636e72'
    };

    let html = '';
    subjects.forEach((sub, sIdx) => {
        const sData = subjectStats[sub];
        const sPct = sData.total > 0 ? Math.round((sData.correct / sData.total) * 100) : 0;
        const color = colorMap[sub] || '#6c5ce7';

        const chEntries = Object.entries(sData.chapters);
        chEntries.sort((a, b) => {
            const pA = a[1].total > 0 ? (a[1].correct / a[1].total) : 0;
            const pB = b[1].total > 0 ? (b[1].correct / b[1].total) : 0;
            return pA - pB;
        });

        let chListHtml = '';
        chEntries.forEach(([chName, cData]) => {
            const cPct = cData.total > 0 ? Math.round((cData.correct / cData.total) * 100) : 0;
            const isWeak = cPct < 50;
            const badge = isWeak 
                ? `<span style="background:#fff0f0; color:#d63031; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid #ff7675;"><i class="fas fa-exclamation-circle"></i> দুর্বল অধ্যায়</span>`
                : `<span style="background:#e6fffa; color:#00b894; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;"><i class="fas fa-check"></i> ভালো প্রস্তুতি</span>`;

            chListHtml += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#f8f9fa; border-radius:8px; margin-bottom:6px; font-size:13px;">
                    <div style="font-weight:600; color:#2d3436; display:flex; align-items:center; gap:8px;">
                        <span>${chName}</span>
                        ${badge}
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-weight:700; color:${cPct >= 60 ? '#00b894' : (cPct < 50 ? '#d63031' : '#e17055')}; min-width:35px; text-align:right;">${cPct}%</span>
                    </div>
                </div>
            `;
        });

        html += `
            <div style="border: 1px solid #edf2f7; border-radius: 12px; padding: 15px; margin-bottom: 12px; background: white; transition: 0.2s;">
                <div onclick="toggleChapterList(${sIdx})" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; padding-right:15px;">
                            <span style="font-weight:700; font-size:15px; color:#2d3436; display:flex; align-items:center; gap:8px;">
                                <span style="width:10px; height:10px; border-radius:50%; background:${color};"></span>
                                ${sub}
                            </span>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-weight:800; font-size:15px; color:${color}; min-width:35px; text-align:right;">${sPct}%</span>
                            </div>
                        </div>
                        <div style="width: calc(100% - 15px); background: #eee; height: 8px; border-radius: 6px; overflow: hidden;">
                            <div style="width: ${sPct}%; background: ${color}; height: 100%; border-radius: 6px; transition: width 0.8s ease;"></div>
                        </div>
                    </div>
                    <i id="caret-${sIdx}" class="fas fa-chevron-down" style="color:#a4b0be; transition:0.3s; padding:5px;"></i>
                </div>
                <div id="chList-${sIdx}" style="display:none; margin-top:15px; border-top:1px dashed #e2e8f0; padding-top:12px;">
                    <div style="margin-bottom:8px; font-size:12px; color:#747d8c; font-weight:600;">অধ্যায়ভিত্তিক প্রস্তুতি (দুর্বল অধ্যায়গুলো আগে দেখানো হচ্ছে):</div>
                    ${chListHtml}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleChapterList(idx) {
    const el = document.getElementById('chList-' + idx);
    const caret = document.getElementById('caret-' + idx);
    if (!el) return;
    if (el.style.display === 'none' || el.style.display === '') {
        el.style.display = 'block';
        if (caret) caret.style.transform = 'rotate(180deg)';
    } else {
        el.style.display = 'none';
        if (caret) caret.style.transform = 'rotate(0deg)';
    }
}

