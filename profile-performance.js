// --- SUBJECT NORMALIZER (শুধুমাত্র ৪টি মূল বিষয়: Physics, Chemistry, Higher Math, English) ---
function normalizeSubject(raw) {
    if (!raw) return null;
    const s = String(raw).normalize('NFC').trim().toLowerCase();
    if (!s || ['general', 'subject', 'chapter', 'অধ্যায়', 'অধ্যায়', 'topic', 'undefined', 'null'].includes(s)) {
        return null;
    }

    // ১. পদার্থবিজ্ঞান (Physics ও এর অধ্যায়গুলোর নাম থাকলে)
    if (
        s.includes('physic') || s.includes('পদার্থ') ||
        s.includes('ভেক্টর') || s.includes('তড়িৎ') || s.includes('তড়িৎ') ||
        s.includes('তাপগতি') || s.includes('গতিবিদ্যা') || s.includes('তরঙ্গ') ||
        s.includes('আলোকবিজ্ঞান') || s.includes('মহাকর্ষ') || s.includes('গাঠনিক ধর্ম') ||
        s.includes('আদর্শ গ্যাস') || s.includes('পর্যাবৃত্ত গতি') || s.includes('সেমিকন্ডাক্টর') ||
        s.includes('পরমাণুর মডেল') || s.includes('কাজ, শক্তি') || s.includes('কাজ, ক্ষমতা')
    ) {
        return 'পদার্থবিজ্ঞান (Physics)';
    }

    // ২. রসায়ন (Chemistry ও এর অধ্যায়গুলোর নাম থাকলে)
    if (
        s.includes('chem') || s.includes('রসায়') || s.includes('রসায') ||
        s.includes('কর্মমুখী') || s.includes('পরিমাণগত') || s.includes('পরিবেশ রস') ||
        s.includes('জৈব রস') || s.includes('ল্যাবরেটরি') || s.includes('রাসায়নিক') ||
        s.includes('মৌলসমূহ') || s.includes('পলিমার')
    ) {
        return 'রসায়ন (Chemistry)';
    }

    // ৩. উচ্চতর গণিত (Higher Math ও এর অধ্যায়গুলোর নাম থাকলে)
    if (
        s.includes('math') || s.includes('গণিত') || s.includes('ম্যাথ') ||
        s.includes('সরলরেখা') || s.includes('ত্রিকোণমিতি') || s.includes('ত্রিভুজমিতি') ||
        s.includes('যোগজীকরণ') || s.includes('অন্তরীকরণ') || s.includes('বিন্যাস') ||
        s.includes('কণিক') || s.includes('কনিক') || s.includes('বৃত্ত') ||
        s.includes('বহুপদী') || s.includes('স্থিতিবিদ্যা') || s.includes('ফাংশন') ||
        s.includes('স্থানাঙ্ক') || s.includes('জটিল সংখ্যা') || s.includes('ম্যাট্রিক্স')
    ) {
        return 'উচ্চতর গণিত (Higher Math)';
    }

    // ৪. ইংরেজি (English — "Bengali" যেন ভুল করে English না হয় সেজন্য regex/exact check)
    if (
        /\benglish\b/i.test(s) || s.startsWith('eng') || s.includes('ইংরেজ') ||
        s.includes('vocabulary') || s.includes('grammar') || s.includes('tense') ||
        s.includes('preposition') || s.includes('voice change') || s.includes('right form') ||
        s.includes('parts of speech') || s.includes('idioms') || s.includes('sentence transformation') ||
        s === 'noun' || s.includes('nouns')
    ) {
        return 'ইংরেজি (English)';
    }

    return null;
}

// --- RENDER SUBJECT-WISE PERFORMANCE (পরিচ্ছন্ন ৪ বিষয়ভিত্তিক পারফরম্যান্স) ---
function renderSubjectPerformance(exams) {
    const container = document.getElementById('subjectPerformanceList');
    if (!container) return;

    const subjectStats = {};

    (exams || []).forEach(exam => {
        if (exam.analysis && typeof exam.analysis === 'object') {
            for (const chData of Object.values(exam.analysis)) {
                if (!chData || typeof chData !== 'object') continue;
                const sub = normalizeSubject(chData.subject);
                if (!sub) continue;

                const cCount = Number(chData.correct || 0);
                const wCount = Number(chData.wrong || 0);
                const tCount = Number(chData.total || 0);
                if (tCount <= 0) continue;

                if (!subjectStats[sub]) {
                    subjectStats[sub] = { correct: 0, wrong: 0, total: 0 };
                }
                subjectStats[sub].correct += cCount;
                subjectStats[sub].wrong += wCount;
                subjectStats[sub].total += tCount;
            }
        }
    });

    const subjectOrder = [
        'পদার্থবিজ্ঞান (Physics)',
        'রসায়ন (Chemistry)',
        'উচ্চতর গণিত (Higher Math)',
        'ইংরেজি (English)'
    ];

    const subjects = Object.keys(subjectStats).sort((a, b) => {
        const idxA = subjectOrder.indexOf(a);
        const idxB = subjectOrder.indexOf(b);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    if (subjects.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 25px 15px; color:#888;">
                <i class="fas fa-chart-pie fa-2x" style="opacity:0.3; margin-bottom:10px;"></i>
                <p style="margin:0; font-size:14px; color:#636e72;">তুমি এক্সাম দেওয়া শুরু করলে এখানে Physics, Chemistry, Math ও English-এর প্রস্তুতি ও অগ্রগতি দেখতে পাবে।</p>
            </div>
        `;
        return;
    }

    const colorMap = {
        'পদার্থবিজ্ঞান (Physics)': '#0984e3',
        'রসায়ন (Chemistry)': '#00b894',
        'উচ্চতর গণিত (Higher Math)': '#6c5ce7',
        'ইংরেজি (English)': '#e17055'
    };

    let html = '';
    subjects.forEach(sub => {
        const sData = subjectStats[sub];
        const sPct = sData.total > 0 ? Math.round((sData.correct / sData.total) * 100) : 0;
        const color = colorMap[sub] || '#6c5ce7';

        let statusBadge = '';
        if (sData.total >= 5) {
            if (sPct >= 65) {
                statusBadge = '<span style="background:#ecfdf5; color:#059669; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">ভালো প্রস্তুতি</span>';
            } else if (sPct >= 45) {
                statusBadge = '<span style="background:#fffbeb; color:#d97706; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">মাঝারি প্রস্তুতি</span>';
            } else {
                statusBadge = '<span style="background:#fef2f2; color:#dc2626; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700;">আরও প্র্যাকটিস প্রয়োজন</span>';
            }
        }

        html += `
            <div style="border: 1px solid #edf2f7; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; background: white;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
                    <span style="font-weight:700; font-size:14.5px; color:#2d3436; display:flex; align-items:center; gap:8px;">
                        <span style="width:10px; height:10px; border-radius:50%; background:${color}; flex-shrink:0;"></span>
                        ${sub}
                        ${statusBadge}
                    </span>
                    <span style="font-weight:800; font-size:15px; color:${color};">${sPct}%</span>
                </div>
                <div style="width: 100%; background: #eef2f6; height: 8px; border-radius: 6px; overflow: hidden; margin-bottom: 6px;">
                    <div style="width: ${sPct}%; background: ${color}; height: 100%; border-radius: 6px; transition: width 0.6s ease;"></div>
                </div>
                <div style="font-size: 11.5px; color: #64748b; display: flex; justify-content: space-between;">
                    <span>সঠিক: <strong style="color:#059669;">${sData.correct}</strong> / মোট: <strong>${sData.total}</strong> প্রশ্ন</span>
                    <span>ভুল: <strong style="color:#dc2626;">${sData.wrong}</strong></span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
