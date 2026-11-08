
// 🔴 পেমেন্ট মোডাল হেল্পার (ট্যাব ও কপি) 🔴
function switchPayTab(tab) {
    const validTabs = ['bkash', 'nagad', 'rocket'];
    const activeTab = validTabs.includes(tab) ? tab : 'bkash';

    validTabs.forEach(t => {
        const pane = document.getElementById('payTab-' + t);
        if (pane) pane.classList.toggle('active', t === activeTab);
        const btn = document.getElementById('tabBtn-' + t);
        if (btn) btn.classList.toggle('active', t === activeTab);
    });

    const sel = document.getElementById('payMethodSelect');
    if (sel && sel.value !== activeTab) {
        sel.value = activeTab;
    }

    const wrapper = document.querySelector('.pay-select-wrapper');
    if (wrapper) {
        validTabs.forEach(t => wrapper.classList.remove('method-' + t));
        wrapper.classList.add('method-' + activeTab);
    }
}

function copyPaymentData(text, btn) {
    if (!navigator.clipboard) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    } else {
        navigator.clipboard.writeText(text);
    }
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> ✓ কপি হয়েছে!';
    btn.style.background = '#10b981';
    btn.style.color = '#ffffff';
    setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);
}

function copyDynamicPaymentData(method, btn) {
    const s = window.siteSettings || {};
    let num = '';
    if (method === 'bkash') num = s.bkash_number || '01522102384';
    else if (method === 'nagad') num = s.nagad_number || '01873275283';
    else if (method === 'rocket') num = s.rocket_number || '01925251621';
    else num = String(method);

    const domEl = document.getElementById('numVal-' + method);
    if (domEl && domEl.innerText.trim()) {
        num = domEl.innerText.trim();
    }

    copyPaymentData(num, btn);
}
const firebaseConfig = { apiKey: "AIzaSyBK1T5Nr1CjoPVWPsKnytrgjj05nU8fDs0", authDomain: "hstu---cou--exam-2026.firebaseapp.com", projectId: "hstu---cou--exam-2026", storageBucket: "hstu---cou--exam-2026.firebasestorage.app", messagingSenderId: "1058124789396", appId: "1:1058124789396:web:fc772af33deb7c18c9e681" };
        const JSON_BASE = "https://textile-du-tech-exam.vercel.app/public/questions/";

// ==========================================
// 🌟 DYNAMIC SITE SETTINGS & COURSES (FROM GOOGLE SHEETS) 🌟
// ==========================================
window.siteSettings = {
    bkash_number: "01522102384",
    nagad_number: "01873275283",
    rocket_number: "01925251621",
    whatsapp_number: "01873275283",
    telegram_link: "https://t.me/careforcandidates",
    telegram_helper: "https://t.me/Admissionhelper007",
    course_fee: "100",
    course_title: "Textile Engineering Admission Full Course",
    course_subtitle: "মাত্র ১০০ টাকায় সব অধ্যায়ভিত্তিক পরীক্ষা, প্রশ্নব্যাংক ও গাইডলাইন আনলক করুন",
    course_features: "১০০+ অধ্যায়ভিত্তিক পরীক্ষা, বিগত ৫ বছরের প্রশ্নব্যাংক সমাধান, স্মার্ট ভুল ব্যাংক ও রি-টেস্ট, এক্সক্লুসিভ গাইডলাইন"
};

window.siteCourses = [
    {
        name: "Textile Engineering Admission Full Course",
        fee: "100",
        banner: "",
        features: [
            "১০০+ অধ্যায়ভিত্তিক পরীক্ষা",
            "বিগত ৫ বছরের প্রশ্নব্যাংক সমাধান",
            "স্মার্ট ভুল ব্যাংক ও রি-টেস্ট",
            "এক্সক্লুসিভ গাইডলাইন"
        ],
        status: "Active"
    }
];

window.activePaymentCourse = null;

function parseCourseFeatures(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return String(raw)
        .split(/[\n,;•|]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function toBanglaDigits(num) {
    if (num === null || num === undefined) return '';
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, d => bDigits[d]);
}

async function fetchSheetData(fileName) {
    const timestamp = Date.now();
    try {
        const res = await fetch(`public/questions/${fileName}?t=${timestamp}`).catch(() => null);
        if (res && res.ok) return await res.json();
    } catch (e) {}
    try {
        const res = await fetch(`${JSON_BASE}${fileName}?t=${timestamp}`).catch(() => null);
        if (res && res.ok) return await res.json();
    } catch (e) {}
    return null;
}

async function loadSettingsAndCourses() {
    let hasCustomCourses = false;
    try {
        // 1. Fetch settings.json
        const rawSettings = await fetchSheetData('settings.json');
        if (rawSettings) {
            if (Array.isArray(rawSettings)) {
                rawSettings.forEach(row => {
                    let key = (row.Key || row.key || row.KEY || row.name || '').trim().toLowerCase();
                    const val = (row.Value || row.value || row.VALUE || row.val || '').trim();
                    if (key && val) {
                        // Normalize underscores, spaces, hyphens
                        key = key.replace(/[\s\-]+/g, '_');
                        if (key === 'features') key = 'course_features';
                        if (key === 'banner') key = 'banner_image';
                        if (key === 'fee') key = 'course_fee';
                        if (key === 'title') key = 'course_title';
                        window.siteSettings[key] = val;
                    }
                });
            } else if (typeof rawSettings === 'object') {
                Object.keys(rawSettings).forEach(k => {
                    let key = k.toLowerCase().trim().replace(/[\s\-]+/g, '_');
                    if (key === 'features') key = 'course_features';
                    if (key === 'banner') key = 'banner_image';
                    if (key === 'fee') key = 'course_fee';
                    if (key === 'title') key = 'course_title';
                    window.siteSettings[key] = String(rawSettings[k]).trim();
                });
            }
        }

        // 2. Fetch courses.json
        const rawCourses = await fetchSheetData('courses.json');
        if (rawCourses && Array.isArray(rawCourses) && rawCourses.length > 0) {
            const parsed = [];
            rawCourses.forEach(c => {
                const name = (c['Course Name'] || c['Course'] || c['name'] || c['Title'] || c['title'] || '').trim();
                const fee = (c['Course Fee'] || c['Fee'] || c['fee'] || c['Price'] || c['price'] || window.siteSettings.course_fee || '100').trim();
                const banner = (c['Banner'] || c['banner'] || c['Image'] || c['image'] || '').trim();
                const rawFeat = c['Features'] || c['features'] || c['Feature'] || '';
                const status = (c['Status'] || c['status'] || 'Active').trim();

                if (name && status.toLowerCase() !== 'inactive') {
                    parsed.push({
                        name: name,
                        fee: fee,
                        banner: banner,
                        features: parseCourseFeatures(rawFeat),
                        status: status
                    });
                }
            });
            if (parsed.length > 0) {
                window.siteCourses = parsed;
                hasCustomCourses = true;
            }
        }
    } catch (err) {
        console.warn('Dynamic settings/courses load notice:', err);
    }

    // If courses.json was empty or not used, sync default course with settings.json
    if (!hasCustomCourses) {
        const s = window.siteSettings;
        window.siteCourses = [{
            name: s.course_title,
            fee: s.course_fee,
            banner: s.banner_image || "",
            features: parseCourseFeatures(s.course_features),
            status: "Active"
        }];
    }

    applyDynamicSiteData();
}

function applyDynamicSiteData() {
    const s = window.siteSettings;
    const courses = window.siteCourses;
    const mainCourse = courses[0] || {
        name: s.course_title,
        fee: s.course_fee,
        banner: "",
        features: parseCourseFeatures(s.course_features)
    };

    // 1. Update Promo Banner
    const pTitle = document.getElementById('promoCourseTitle');
    const pSub = document.getElementById('promoCourseSubtitle');
    const pBtnFee = document.getElementById('promoBtnFee');
    const pFeatList = document.getElementById('promoFeaturesList');

    if (pTitle) pTitle.innerText = mainCourse.name || s.course_title;
    if (pSub) {
        const bFee = toBanglaDigits(mainCourse.fee || s.course_fee);
        pSub.innerText = `মাত্র ${bFee} টাকায় সব অধ্যায়ভিত্তিক পরীক্ষা, প্রশ্নব্যাংক ও গাইডলাইন আনলক করুন`;
    }
    if (pBtnFee) {
        pBtnFee.innerText = `${toBanglaDigits(mainCourse.fee || s.course_fee)} টাকা`;
    }

    // Green checkmark features list
    if (pFeatList) {
        const feats = (mainCourse.features && mainCourse.features.length > 0) 
            ? mainCourse.features 
            : parseCourseFeatures(s.course_features);
        
        pFeatList.innerHTML = feats.map(f => `
            <span class="promo-feature-chip">
                <i class="fas fa-check-circle feature-check-icon"></i> ${f}
            </span>
        `).join('');
    }

    // 2. Multi-course showcase (if > 1 courses)
    const showcaseContainer = document.getElementById('coursesShowcaseContainer');
    if (showcaseContainer) {
        if (courses.length > 1) {
            showcaseContainer.innerHTML = `
                <div style="margin: 24px 0 14px 0; display: flex; align-items: center; gap: 8px;">
                    <div style="width: 4px; height: 18px; background: var(--primary); border-radius: 2px;"></div>
                    <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #1e293b;">আমাদের সকল কোর্সসমূহ</h3>
                </div>
                <div class="courses-showcase-grid">
                    ${courses.map((crs, idx) => {
                        const bFee = toBanglaDigits(crs.fee);
                        const bannerImg = crs.banner ? `<img src="${crs.banner}" alt="${crs.name}" class="course-showcase-banner">` : '';
                        const featItems = (crs.features || []).map(ft => `
                            <div class="course-feature-line">
                                <i class="fas fa-check-circle"></i>
                                <span>${ft}</span>
                            </div>
                        `).join('');

                        return `
                            <div class="course-showcase-card">
                                ${bannerImg}
                                <div class="course-showcase-body">
                                    <h4 class="course-showcase-title">${crs.name}</h4>
                                    <div class="course-showcase-features">
                                        ${featItems}
                                    </div>
                                    <div class="course-showcase-footer">
                                        <div class="course-showcase-price">${bFee} ৳</div>
                                        <button type="button" class="btn-pay" style="padding: 6px 14px; font-size: 13px;" onclick="openPaymentModal(${idx})">
                                            ভর্তি হন <i class="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            showcaseContainer.innerHTML = '';
        }
    }

    // 3. Update Payment Modal Numbers
    const numBkash = document.getElementById('numVal-bkash');
    if (numBkash && s.bkash_number) numBkash.innerText = s.bkash_number;

    const numNagad = document.getElementById('numVal-nagad');
    if (numNagad && s.nagad_number) numNagad.innerText = s.nagad_number;

    const numRocket = document.getElementById('numVal-rocket');
    if (numRocket && s.rocket_number) numRocket.innerText = s.rocket_number;

    // 4. Update WhatsApp & Telegram support links
    const cleanWa = (s.whatsapp_number || '').replace(/[^0-9]/g, '');
    const waUrl = cleanWa ? `https://wa.me/88${cleanWa.startsWith('88') ? cleanWa.substring(2) : cleanWa}` : '';

    const waLink = document.getElementById('paySupportWaLink');
    const waText = document.getElementById('paySupportWaText');
    if (waLink && waUrl) waLink.href = waUrl;
    if (waText && s.whatsapp_number) waText.innerText = s.whatsapp_number;

    const helpWa = document.getElementById('helpWidgetWaLink');
    if (helpWa && waUrl) helpWa.href = waUrl;

    const helpTg = document.getElementById('helpWidgetTgLink');
    if (helpTg && (s.telegram_helper || s.telegram_link)) {
        helpTg.href = s.telegram_helper || s.telegram_link;
    }

    const headerTg = document.getElementById('headerTgLink');
    if (headerTg && s.telegram_link) headerTg.href = s.telegram_link;

    const footerTg = document.getElementById('footerTgLink');
    if (footerTg && s.telegram_link) footerTg.href = s.telegram_link;
}

// Auto-start dynamic settings & courses loader immediately
loadSettingsAndCourses();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettingsAndCourses);
}

        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();
        
        let allExams = [];
        let currentMaster = ""; 
        let currentCategory = ""; 
        let userEnrollment = null;
        let isRegistering = false;
        let isGuest = false;

        // 🔴 ইউটিউব ভিডিও আইডি বের করার হেল্পার 🔴
        function getYouTubeVideoId(url) {
            if (!url) return null;
            const cleanUrl = String(url).trim();
            const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|.*[?&]v=))([\w-]{11})/);
            return match ? match[1] : null;
        }

        // 🔴 শিটের যেকোনো ফরম্যাটের লিংক পাওয়ার হেল্পার (Link, LInk, link, url ইত্যাদি) 🔴
        function getItemLink(item) {
            if (!item) return '';
            for (let k of Object.keys(item)) {
                const norm = k.trim().toLowerCase();
                if (norm === 'link' || norm === 'url') {
                    if (item[k] && String(item[k]).trim()) {
                        return String(item[k]).trim();
                    }
                }
            }
            return (item['Link'] || item['LInk'] || item['link'] || '').trim();
        }

        // 🔴 ফোল্ডার নেভিগেশন ও History কন্ট্রোল 🔴
        function openMaster(mCat) {
            currentMaster = mCat;
            currentCategory = "";
            window.location.hash = encodeURIComponent(mCat);
        }

        function openCategory(cat) {
            currentCategory = cat;
            if (currentMaster) {
                window.location.hash = encodeURIComponent(currentMaster) + '/' + encodeURIComponent(cat);
            } else {
                window.location.hash = encodeURIComponent(cat);
            }
        }

        function navigateBack() {
            if (currentCategory && currentMaster) {
                // সাব-ক্যাটাগরি থেকে মাস্টার ক্যাটাগরিতে ফিরবে
                window.location.hash = encodeURIComponent(currentMaster);
            } else {
                // মাস্টার ক্যাটাগরি থেকে সোজা হোমে ফিরবে

                window.location.hash = '';
            }
        }

        // 🔴 মোবাইলের ব্যাক বাটন ও পেমেন্ট মডাল ক্লোজ লজিক 🔴
        window.addEventListener('popstate', function(e) {
            const payModal = document.getElementById('paymentModal');
            // যদি পেমেন্ট মডাল ওপেন থাকে, ব্যাক চাপলে শুধু মডাল বন্ধ হবে (পেজ বদলাবে না)
            if (payModal && payModal.style.display === 'flex') {
                payModal.style.display = 'none';
                return;
            }
            syncRouteFromHash();
        });

        function syncRouteFromHash() {
            const rawHash = window.location.hash.replace(/^#/, '');
            if (!rawHash) {
                currentMaster = "";
                currentCategory = "";

            } else {
                const parts = rawHash.split('/').map(decodeURIComponent);
                if (parts.length > 1) {
                    currentMaster = parts[0];
                    currentCategory = parts[1];
                } else {
                    const isMaster = allExams.some(e => e['Master Category'] === parts[0]);
                    if (isMaster) {
                        currentMaster = parts[0];
                        currentCategory = "";

                    } else {
                        currentCategory = parts[0];
                    }
                }
            }
            if (allExams.length > 0) {
                renderView();
            }
        }

        auth.onAuthStateChanged(user => {
            const sysLoader = document.getElementById('system-loader');
            const loginView = document.getElementById('login-view');
            const dashboardView = document.getElementById('dashboard-view');

            if (user) {
                sysLoader.style.display = 'none';
                loginView.style.display = 'none';
                dashboardView.style.display = 'block';
                dashboardView.style.opacity = '1';
                updateNavBar(user);
                checkEnrollment(user.email);
            } else if (isGuest) {
                sysLoader.style.display = 'none';
                loginView.style.display = 'none';
                dashboardView.style.display = 'block';
                dashboardView.style.opacity = '1';
                updateNavBar(null, true);
                loadExams();
            } else {
                sysLoader.style.display = 'none';
                dashboardView.style.display = 'none';
                loginView.style.display = 'flex';
            }
        });

        function handleGoogleLogin() {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => { console.log("Logged in:", result.user); })
                .catch((error) => {
                    console.error("Login Error:", error);
                    document.getElementById('system-loader').style.display = 'none';
                    alert("লগইন সমস্যা: " + error.message);
                });
        }

        function handleGuestWithWarning() {
            if(confirm('লগইন ছাড়া এক্সাম দিলে আপনার মেরিট পজিশন সেভ হবে না।\nআপনি কি নিশ্চিত?')) {
                handleGuest();
            }
        }

        function handleGuest() { 
            isGuest = true; 
            document.getElementById('login-view').style.display = 'none';
            const dashboardView = document.getElementById('dashboard-view');
            dashboardView.style.display = 'block';
            setTimeout(() => dashboardView.style.opacity = '1', 50);
            updateNavBar(null, true);
            const promoBanner = document.getElementById('promoBanner');
            if (promoBanner) promoBanner.style.setProperty('display', 'flex', 'important');
            const successBanner = document.getElementById('successBanner');
            if (successBanner) successBanner.style.setProperty('display', 'none', 'important');
            loadExams();
        } 
        
        function logout() { isGuest = false; try { localStorage.removeItem('user_mistakes'); sessionStorage.clear(); } catch(e) {} document.getElementById('system-loader').style.display = 'flex'; auth.signOut().then(() => location.reload()); }

        function showLoginModal() { 
            document.getElementById('authModal').style.display = 'flex'; 
            document.getElementById('authMsg').innerText = "";
            document.getElementById('authMsg').className = 'auth-message';
        }
        function closeAuthModal() { document.getElementById('authModal').style.display = 'none'; }
        
        function toggleAuthMode() {
            isRegistering = !isRegistering;
            document.getElementById('authTitle').innerText = isRegistering ? "রেজিস্ট্রেশন" : "স্বাগতম!";
            document.getElementById('authSubtitle').innerText = isRegistering ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "অ্যাকাউন্টে প্রবেশ করুন";
            document.getElementById('nameGroup').style.display = isRegistering ? 'block' : 'none';
            document.getElementById('regName').required = isRegistering;
            document.getElementById('authBtn').innerText = isRegistering ? "রেজিস্টার করুন" : "লগইন করুন";
            document.getElementById('switchText').innerText = isRegistering ? "অলরেডি অ্যাকাউন্ট আছে?" : "অ্যাকাউন্ট নেই?";
            document.getElementById('switchLink').innerText = isRegistering ? "লগইন করুন" : "নতুন অ্যাকাউন্ট খুলুন";
            document.getElementById('rememberGroup').style.display = isRegistering ? 'none' : 'flex';
            document.getElementById('authMsg').innerText = "";
            document.getElementById('authMsg').className = 'auth-message';
        }

        function togglePasswordVisibility() {
            const passField = document.getElementById("password");
            const toggleIcon = document.getElementById("togglePasswordIcon");
            if (passField.type === "password") {
                passField.type = "text";
                toggleIcon.classList.remove("fa-eye");
                toggleIcon.classList.add("fa-eye-slash");
            } else {
                passField.type = "password";
                toggleIcon.classList.remove("fa-eye-slash");
                toggleIcon.classList.add("fa-eye");
            }
        }

        document.getElementById('password').addEventListener('input', function() {
            const passIcon = document.getElementById('passLockIcon');
            const authBtn = document.getElementById('authBtn');
            if(this.value.length > 0 && this.value.length < 6) {
                this.style.borderColor = '#d63031';
                passIcon.style.color = '#d63031';
                passIcon.className = 'fas fa-lock input-icon';
                authBtn.disabled = true;
            } else if (this.value.length >= 6) {
                this.style.borderColor = '#00b894';
                passIcon.style.color = '#00b894';
                passIcon.className = 'fas fa-lock-open input-icon'; 
                authBtn.disabled = false;
            } else {
                this.style.borderColor = '#eee';
                passIcon.style.color = '#888';
                passIcon.className = 'fas fa-lock input-icon';
                authBtn.disabled = false;
            }
        });

        function handleForgotPassword() {
            const email = document.getElementById('email').value;
            const msgDiv = document.getElementById('authMsg');
            if (!email) {
                msgDiv.innerText = "পাসওয়ার্ড রিসেট করতে ইমেইল বক্সে আপনার ইমেইলটি লিখুন।";
                msgDiv.className = 'auth-message error';
                return;
            }
            msgDiv.innerText = "পাঠানো হচ্ছে...";
            msgDiv.className = 'auth-message info';
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    msgDiv.innerText = "ইমেইল চেক করুন, পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।";
                    msgDiv.className = 'auth-message success';
                })
                .catch((error) => {
                    let msg = error.message;
                    if (error.code === 'auth/user-not-found') msg = "এই ইমেইলে কোনো অ্যাকাউন্ট নেই।";
                    msgDiv.innerText = msg;
                    msgDiv.className = 'auth-message error';
                });
        }

        document.getElementById('authForm').addEventListener('submit', handleAuth);

        async function handleAuth(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('regName').value;
            const btn = document.getElementById('authBtn');
            const msgDiv = document.getElementById('authMsg');

            msgDiv.className = 'auth-message'; 
            msgDiv.innerHTML = "";
            const originalBtnText = isRegistering ? "রেজিস্টার করুন" : "লগইন করুন";
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> যাচাই করা হচ্ছে...'; 
            btn.disabled = true;

            try {
                if (isRegistering) {
                    const cred = await auth.createUserWithEmailAndPassword(email, password);
                    await cred.user.updateProfile({ displayName: name });
                    closeAuthModal();
                } else {
                    await auth.signInWithEmailAndPassword(email, password);
                    closeAuthModal();
                }
            } catch (error) {
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
                msgDiv.className = 'auth-message error';
                if(error.code === 'auth/user-not-found' || error.code === 'auth/invalid-login-credentials') {
                    msgDiv.className = 'auth-message info';
                    msgDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> অ্যাকাউন্ট নেই বা তথ্য ভুল! রেজিস্ট্রেশন মোডে নেওয়া হচ্ছে...';
                    if (!isRegistering) {
                        setTimeout(() => {
                            toggleAuthMode();
                            document.getElementById('regName').focus();
                        }, 1200);
                    }
                    return; 
                }
                if(error.code === 'auth/email-already-in-use') {
                    msgDiv.className = 'auth-message info';
                    msgDiv.innerHTML = '<i class="fas fa-info-circle"></i> এই ইমেইল আগেই আছে। লগইন মোডে নেওয়া হচ্ছে...';
                    setTimeout(() => { toggleAuthMode(); }, 1200);
                    return;
                }
                msgDiv.innerText = "সমস্যা: " + error.message;
            }
        }

        function updateNavBar(user, guest=false) {
            const container = document.getElementById('authContainer');
            if (guest) {
                container.innerHTML = `
                    <div class="nav-actions-wrap">
                        <span class="guest-pill" title="Guest Mode"><i class="fas fa-user-secret"></i> <span class="guest-text">Guest</span></span>
                        <button onclick="location.reload()" class="nav-icon-btn nav-exit" title="লগইন করুন">
                            <i class="fas fa-sign-in-alt"></i>
                            <span class="nav-btn-label">লগইন</span>
                        </button>
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="nav-actions-wrap">
                        <a href="mistakes.html" class="nav-icon-btn nav-mistake" title="ভুল প্রশ্ন ব্যাংক">
                            <i class="fas fa-book-open"></i>
                            <span class="nav-btn-label">ভুল ব্যাংক</span>
                        </a>
                        <a href="profile.html" class="nav-icon-btn nav-profile" title="আমার প্রোফাইল">
                            <i class="fas fa-user"></i>
                            <span class="nav-btn-label">প্রোফাইল</span>
                        </a>
                        <button onclick="logout()" class="nav-icon-btn nav-logout" title="লগআউট">
                            <i class="fas fa-sign-out-alt"></i>
                            <span class="nav-btn-label">লগআউট</span>
                        </button>
                    </div>
                `;
            }
        }

        function checkEnrollment(email) {
            try {
                // 🔴 রিয়েল-টাইম লিসেনার: অ্যাডমিন এক্সেস দিলে ১ সেকেন্ডের মধ্যে লাইভ আনলক হবে
                db.collection("payment_requests")
                    .where("email", "==", email)
                    .where("status", "==", "approved")
                    .onSnapshot((snap) => {
                        const promoBanner = document.getElementById('promoBanner');
                        const successBanner = document.getElementById('successBanner');
                        
                        if (!snap.empty) {
                            userEnrollment = 'TextileFull';
                            if (promoBanner) promoBanner.style.setProperty('display', 'none', 'important'); 
                            if (successBanner) successBanner.style.setProperty('display', 'flex', 'important');
                        } else {
                            userEnrollment = null;
                            if (promoBanner) promoBanner.style.setProperty('display', 'flex', 'important'); 
                            if (successBanner) successBanner.style.setProperty('display', 'none', 'important');
                        }

                        // পরীক্ষাগুলো অলরেডি লোড করা থাকলে সাথে সাথে রি-রেন্ডার করে আনলক করা
                        if (allExams && allExams.length > 0) {
                            renderView();
                        } else {
                            loadExams();
                        }
                    }, (error) => {
                        console.error("Enrollment listener error:", error);
                        loadExams();
                    });
            } catch (error) { 
                console.error(error); 
                loadExams(); 
            }
        }

        async function loadExams() {
            try {
                const res = await fetch(JSON_BASE + "exam-index.json?v=" + new Date().getTime());
                allExams = await res.json();
                allExams.forEach(e => {
                    if (e['Master Category']) e['Master Category'] = String(e['Master Category']).trim();
                    if (e['Category']) e['Category'] = String(e['Category']).trim();
                });
                syncRouteFromHash();
            } catch (e) { console.error(e); }
        }

                function getMasterBanner(mCat) {
            if (!mCat) return null;
            const clean = String(mCat).trim().toLowerCase();
            if (clean.includes('exam') || clean.includes('standard') || clean.includes('টেক্সটাইল')) {
                return 'assets/banners/exam_banner.jpg';
            }
            if (clean.includes('about') || clean.includes('video') || clean.includes('গাইডলাইন')) {
                return 'assets/banners/guideline_banner.jpg';
            }
            return null;
        }

        // 🔴 ফ্ল্যাক্সিবল ও ডাইনামিক রেন্ডারিং ইঞ্জিন 🔴
        function renderView() {
            const container = document.getElementById('examContainer');
            const pathTitle = document.getElementById('currentPathTitle');
            const backBtn = document.getElementById('backBtn');
            document.getElementById('loader').style.display = 'none';
            container.innerHTML = "";

            // 🔴 60-120 FPS GPU-Accelerated Smooth Transition 🔴
            container.classList.remove('view-transition-in');
            void container.offsetWidth; // Force layout reflow to restart CSS animation
            container.classList.add('view-transition-in');

            document.documentElement.classList.remove('route-subpage');
            const overallBanner = document.getElementById('overallHomeBanner');
            const promoBanner = document.getElementById('promoBanner');
            const successBanner = document.getElementById('successBanner');
            const navHeader = document.querySelector('.nav-header');
            const aboutNote = document.getElementById('siteAboutNote');

            const hasMaster = allExams.some(e => e['Master Category'] && String(e['Master Category']).trim() !== "");

            if (hasMaster) {
                if (!currentMaster) {
                    // লেভেল ০: হোম পেজ (১০টি কলেজ ওভারঅল ব্যানার ও কোর্স অপশন)
                    if (overallBanner) overallBanner.style.display = 'block';
                    if (aboutNote) aboutNote.style.display = 'block';
                    if (navHeader) navHeader.style.display = 'none';
                    backBtn.style.display = 'none';

                    // হোম পেজের ব্যানার ডিসপ্লে নিয়ন্ত্রণ
                    const showcaseContainer = document.getElementById('coursesShowcaseContainer');
                    if (userEnrollment === 'TextileFull') {
                        if (promoBanner) promoBanner.style.setProperty('display', 'none', 'important');
                        if (successBanner) successBanner.style.setProperty('display', 'flex', 'important');
                        if (showcaseContainer) showcaseContainer.style.setProperty('display', 'none', 'important');
                    } else {
                        if (promoBanner) promoBanner.style.setProperty('display', 'flex', 'important');
                        if (successBanner) successBanner.style.setProperty('display', 'none', 'important');
                        if (showcaseContainer && window.siteCourses && window.siteCourses.length > 1) {
                            showcaseContainer.style.setProperty('display', 'block', 'important');
                        }
                    }

                    container.className = "master-folders-list";

                    const masterCats = [...new Set(allExams.map(e => e['Master Category']))].filter(m => m && String(m).trim() !== "");
                    let html = "";
                    masterCats.forEach(mCat => {
                        const count = allExams.filter(e => e['Master Category'] === mCat).length;
                        const bannerImg = getMasterBanner(mCat);
                        const isVideoMaster = mCat === 'About Textile Engineering';
                        const subtext = isVideoMaster ? 'ক্যারিয়ার ও গাইডলাইন ভিডিও' : 'অধ্যায়ভিত্তিক পরীক্ষা ও মডেল টেস্ট';
                        const actionText = isVideoMaster ? 'ভিডিও দেখুন' : 'প্রবেশ করুন';
                        const actionIcon = isVideoMaster ? 'fa-play' : 'fa-chevron-right';

                        html += `
                            <div class="course-banner-card" onclick="openMaster('${mCat.replace(/'/g, "\\'")}')">
                                ${bannerImg ? `
                                <div class="course-card-banner-wrap">
                                    <img src="${bannerImg}" alt="${mCat}" class="course-card-banner-img" loading="lazy">
                                </div>` : ''}
                                <div class="course-card-body">
                                    <div class="course-card-info">
                                        <h3 class="course-card-title">${mCat}</h3>
                                        <span class="course-card-meta"><i class="${isVideoMaster ? 'fas fa-video' : 'fas fa-layer-group'}"></i> ${count} Items • ${subtext}</span>
                                    </div>
                                    <div class="course-card-btn">
                                        <span>${actionText}</span>
                                        <i class="fas ${actionIcon}"></i>
                                    </div>
                                </div>
                            </div>`;
                    });
                    container.innerHTML = html;
                } 
                else if (currentMaster && !currentCategory) {
                    // লেভেল ১: মাস্টার ফোল্ডারের ভেতর (TEXTILE STANDARD EXAM বা About Textile Engineering)
                    if (overallBanner) overallBanner.style.display = 'none';
                    if (aboutNote) aboutNote.style.display = 'none';
                    const showcaseContainer = document.getElementById('coursesShowcaseContainer');
                    if (showcaseContainer) showcaseContainer.style.setProperty('display', 'none', 'important');
                    if (userEnrollment === 'TextileFull') {
                        if (promoBanner) promoBanner.style.setProperty('display', 'none', 'important');
                        if (successBanner) successBanner.style.setProperty('display', 'none', 'important');
                    } else {
                        if (promoBanner) promoBanner.style.setProperty('display', 'flex', 'important');
                        if (successBanner) successBanner.style.setProperty('display', 'none', 'important');
                    }

                    if (navHeader) navHeader.style.display = 'flex';
                    backBtn.style.display = 'block';
                    pathTitle.innerText = currentMaster;

                    const masterExams = allExams.filter(e => e['Master Category'] === currentMaster);
                    
                    // সাব-ক্যাটাগরি আছে কি না পরীক্ষা করা
                    const categories = [...new Set(masterExams.map(e => e['Category']))]
                        .filter(cat => cat && String(cat).trim() !== "" && cat !== "General" && cat !== currentMaster);

                    if (categories.length > 0) {
                        // সাব-ক্যাটাগরি ফোল্ডার আছে ➡️ ফোল্ডার গ্রিড দেখাও (ভেতরে কোনো ডুপ্লিকেট ব্যানার থাকবে না)
                        container.className = "category-grid";

                        let html = "";
                        categories.forEach(cat => {
                            const count = masterExams.filter(e => e['Category'] === cat).length;
                            html += `
                                <div class="item-card folder-card compact-folder" onclick="openCategory('${cat.replace(/'/g, "\\'")}')">
                                    <div class="icon-box folder-icon"><i class="fas fa-folder"></i></div>
                                    <h3>${cat}</h3>
                                    <p>${count} Items</p>
                                </div>`;
                        });
                        container.innerHTML = html;
                    } else {
                        // সাব-ক্যাটাগরি নেই (যেমন About Textile Engineering) ➡️ সরাসরি ভিডিও কার্ড দেখাও!
                        // 🔴 ব্যাক বাটন নিশ্চিত অন করা
                        if (navHeader) navHeader.style.display = 'flex';
                        backBtn.style.display = 'block';
                        pathTitle.innerText = currentMaster;
                        container.className = "category-grid";

                        renderItems(masterExams, container);
                    }
                } 
                else {
                    // লেভেল ২: সাব-ক্যাটাগরির ভেতর (আসল এক্সাম/ভিডিও)
                    if (overallBanner) overallBanner.style.display = 'none';
                    if (aboutNote) aboutNote.style.display = 'none';
                    const showcaseContainer = document.getElementById('coursesShowcaseContainer');
                    if (showcaseContainer) showcaseContainer.style.setProperty('display', 'none', 'important');
                    if (userEnrollment === 'TextileFull') {
                        if (promoBanner) promoBanner.style.setProperty('display', 'none', 'important');
                        if (successBanner) successBanner.style.setProperty('display', 'none', 'important');
                    } else {
                        if (promoBanner) promoBanner.style.setProperty('display', 'flex', 'important');
                        if (successBanner) successBanner.style.setProperty('display', 'none', 'important');
                    }

                    if (navHeader) navHeader.style.display = 'flex';
                    backBtn.style.display = 'block';
                    pathTitle.innerText = currentCategory;
                    container.className = "category-grid";

                    const filtered = allExams.filter(e => e['Master Category'] === currentMaster && e['Category'] === currentCategory);
                    renderItems(filtered, container);
                }
            } else {
                // ফলব্যাক (যদি শিটে Master Category না থাকে)
                if (!currentCategory) {
                    backBtn.style.display = 'none';
                    pathTitle.innerText = "Textile Engineering Admission Preparation";
                    container.className = "category-grid";

                    const categories = [...new Set(allExams.map(e => e['Category']))].filter(cat => cat && cat !== "General");
                    let html = "";
                    categories.forEach(cat => {
                        const count = allExams.filter(e => e['Category'] === cat).length;
                        html += `
                            <div class="item-card folder-card compact-folder" onclick="openCategory('${cat.replace(/'/g, "\\'")}')">
                                <div class="icon-box folder-icon"><i class="fas fa-folder"></i></div>
                                <h3>${cat}</h3>
                                <p>${count} Items</p>
                            </div>`;
                    });
                    container.innerHTML = html;
                } else {
                    backBtn.style.display = 'block';
                    pathTitle.innerText = currentCategory;
                    container.className = "category-grid";
                    const filtered = allExams.filter(e => e['Category'] === currentCategory);
                    renderItems(filtered, container);
                }
            }
        }

        // 🔴 আইটেম (এক্সাম বনাম ভিডিও) কার্ড রেন্ডারার 🔴
        function renderItems(filtered, container, prependHtml = "") {
            let html = prependHtml;
            filtered.forEach(item => {
                const link = getItemLink(item);
                const itemType = (item['Type'] || '').trim().toLowerCase();
                const isVideo = itemType === 'video' || link.includes('youtu.be') || link.includes('youtube.com');
                
                if (isVideo) {
                    // 🎬 ইউটিউব ভিডিও কার্ড (স্কয়ার/কমপ্যাক্ট ২-কলাম, সরাসরি ক্লিকেবল ও নিয়ন ইফেক্ট)
                    const videoId = getYouTubeVideoId(link);
                    const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
                    const targetLink = link || '#';

                    html += `
                        <a href="${targetLink}" target="_blank" rel="noopener noreferrer" class="item-card video-card">
                            <div class="video-thumb-wrap">
                                ${videoId ? `<img src="${thumbUrl}" alt="Video Thumbnail" loading="lazy" onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${videoId}/mqdefault.jpg';">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ff4757;font-size:36px;"><i class="fab fa-youtube"></i></div>`}
                                <div class="play-btn-overlay"><i class="fas fa-play"></i></div>
                            </div>
                            <h3 class="video-title">${item['Exam Name'] || 'Video Lecture'}</h3>
                            <div class="btn-watch"><i class="fab fa-youtube"></i> Watch Now</div>
                        </a>
                    `;
                } else {
                    // 📝 সাধারণ এক্সাম কার্ড
                    const isPaid = (item['Type']||'').toLowerCase() === 'paid';
                    let unlocked = !isPaid;
                    if(userEnrollment) { unlocked = true; }

                    const badge = isPaid ? (unlocked ? `<span class="badge badge-free" style="background:#e6fffa; color:#00b894;">PURCHASED</span>` : `<span class="badge badge-paid">PAID</span>`) : `<span class="badge badge-free">FREE</span>`;
                    const itemRange = (item['Range'] || item['range'] || item['রেঞ্জ'] || item['Question Range'] || '').trim();
                    const itemName = (item['Exam Name'] || '').trim();
                    let examUrl = `exam.html?id=${encodeURIComponent(item['Tab ID'])}`;
                    if (itemName) examUrl += `&name=${encodeURIComponent(itemName)}`;
                    if (itemRange) examUrl += `&range=${encodeURIComponent(itemRange)}`;
                    const action = unlocked ? `location.href='${examUrl}'` : `openPaymentModal()`;
                    
                    html += `
                        <div class="item-card exam-card" onclick="${action}">
                            ${badge}
                            <div class="icon-box exam-icon"><i class="fas fa-file-alt"></i></div>
                            <h3 style="margin:0 0 10px 0; font-size:14px;">${item['Exam Name'] || 'Untitled Exam'}</h3>
                            <div style="font-size:12px; color:#666; margin-bottom:4px;"><i class="far fa-clock"></i> ${item['Total Time'] || 0} Minutes</div>
                            <div style="font-size:12px; color:#666;"><i class="fas fa-bullseye"></i> ${item['Total Marks'] || 0} Marks</div>
                            <button class="btn-start ${unlocked ? 'unlocked' : ''}" style="pointer-events: auto; padding:8px; font-size:13px; margin-top:10px;">
                                ${unlocked ? 'Start Exam <i class="fas fa-arrow-right"></i>' : '<i class="fas fa-lock"></i> Locked'}
                            </button>
                        </div>
                    `;
                }
            });
            container.innerHTML = html;
        }

        function copyNumber() {
            const number = document.getElementById('paymentNum').innerText;
            navigator.clipboard.writeText(number).then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'নাম্বার কপি হয়েছে!',
                    showConfirmButton: false,
                    timer: 1500
                });
            });
        }

        function copyPaymentNumber(number, btn) {
            if (!navigator.clipboard) {
                const tempInput = document.createElement('input');
                tempInput.value = number;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            } else {
                navigator.clipboard.writeText(number);
            }

            if (btn) {
                const originalHtml = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fas fa-check"></i> কপি হয়েছে!';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = originalHtml;
                }, 2000);
            }
        }

        function copyNumber() {
            const numEl = document.getElementById('bkashNum') || document.getElementById('personalNum') || document.getElementById('paymentNum');
            const num = numEl ? numEl.innerText.trim() : '01522102384';
            copyPaymentNumber(num, event ? event.currentTarget : null);
        }

        function openPaymentModal(courseRef) { 
            let course = null;
            if (typeof courseRef === 'number' && window.siteCourses && window.siteCourses[courseRef]) {
                course = window.siteCourses[courseRef];
            } else if (typeof courseRef === 'object' && courseRef !== null) {
                course = courseRef;
            } else if (window.siteCourses && window.siteCourses.length > 0) {
                course = window.siteCourses[0];
            }

            window.activePaymentCourse = course;

            const fee = course ? (course.fee || (window.siteSettings && window.siteSettings.course_fee) || '100') : ((window.siteSettings && window.siteSettings.course_fee) || '100');
            const name = course ? (course.name || (window.siteSettings && window.siteSettings.course_title)) : (window.siteSettings ? window.siteSettings.course_title : 'Textile Engineering Admission Full Course');
            const bFee = toBanglaDigits(fee);

            // Update modal title & subtitle
            const mTitle = document.getElementById('modalPayTitle');
            const mSub = document.getElementById('modalPaySubtitle');
            if (mTitle) mTitle.innerText = `কোর্সে ভর্তি ও পেমেন্ট (${bFee} টাকা)`;
            if (mSub) mSub.innerText = name;

            // Update fee pills
            document.querySelectorAll('.dyn-fee-pill').forEach(el => {
                el.innerText = `ফি: ${bFee} টাকা`;
            });

            // Update fee inside instructional notes
            document.querySelectorAll('.dyn-fee-text').forEach(el => {
                el.innerText = bFee;
            });

            // Keep currently selected method or default to bkash
            const sel = document.getElementById('payMethodSelect');
            const currentMethod = (sel && sel.value) ? sel.value : 'bkash';
            switchPayTab(currentMethod);

            const payModal = document.getElementById('paymentModal');
            if (payModal) {
                payModal.style.display = 'flex';
                history.pushState({ modal: 'payment' }, '');
            }
        }

        function closePaymentModal() { 
            const payModal = document.getElementById('paymentModal');
            if (payModal) payModal.style.display = 'none';
        }

        function toggleHelp() { document.getElementById('socialLinks').classList.toggle('show'); }


// 🌐 হাবিবস কেয়ার ফেসবুক পেজে রিডাইরেক্ট হ্যান্ডলার 🌐
document.addEventListener('click', function(e) {
    if (e.target.closest('button, input, textarea, select, .btn-login, .btn-pay-wa, .btn-copy-action, .btn-start')) return;

    const link = e.target.closest('a');
    if (link && link.href) return;

    const text = (e.target.textContent || '').trim();
    const hasHabibText = /হাবিবস\s*কেয়া?র|habib'?s\s*care/i.test(text);
    const hasHabibAttr = /হাবিবস\s*কেয়া?র|habib'?s\s*care/i.test((e.target.title || '') + ' ' + (e.target.alt || ''));

    if (hasHabibText || hasHabibAttr) {
        const tagName = e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (['span', 'strong', 'h4', 'h5', 'h3', 'p', 'img', 'b', 'div'].includes(tagName)) {
            if (e.target.children.length <= 2) {
                window.open('https://www.facebook.com/habibs.care.edu', '_blank', 'noopener,noreferrer');
            }
        }
    }
});
