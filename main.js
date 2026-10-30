const firebaseConfig = { apiKey: "AIzaSyBK1T5Nr1CjoPVWPsKnytrgjj05nU8fDs0", authDomain: "hstu---cou--exam-2026.firebaseapp.com", projectId: "hstu---cou--exam-2026", storageBucket: "hstu---cou--exam-2026.firebasestorage.app", messagingSenderId: "1058124789396", appId: "1:1058124789396:web:fc772af33deb7c18c9e681" };
        const JSON_BASE = "https://textile-du-tech-exam.vercel.app/public/questions/";

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
            loadExams();
        } 
        
        function logout() { isGuest = false; document.getElementById('system-loader').style.display = 'flex'; auth.signOut().then(() => location.reload()); }

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
                container.innerHTML = `<span style="font-weight:bold; color:gray; font-size:13px; margin-right:8px;">Guest</span> <button onclick="location.reload()" class="btn-logout-text" style="background:#b2bec3;">Exit</button>`;
            } else {
                container.innerHTML = `
                    <a href="mistakes.html" class="profile-btn-highlight" style="background:#e17055; margin-right:4px;" title="ভুল ব্যাংক">
                        <i class="fas fa-times-circle"></i> ভুল ব্যাংক
                    </a>
                    <a href="profile.html" class="profile-btn-highlight">
                        <i class="fas fa-user"></i> প্রোফাইল
                    </a>
                    <button onclick="logout()" class="btn-logout-text" title="Logout">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
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
                            if (promoBanner) promoBanner.style.display = 'none'; 
                            if (successBanner) successBanner.style.display = 'flex';
                        } else {
                            userEnrollment = null;
                            if (promoBanner) promoBanner.style.display = 'flex'; 
                            if (successBanner) successBanner.style.display = 'none';
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

        // 🔴 ফ্ল্যাক্সিবল ও ডাইনামিক রেন্ডারিং ইঞ্জিন 🔴
        function renderView() {
            const container = document.getElementById('examContainer');
            const pathTitle = document.getElementById('currentPathTitle');
            const backBtn = document.getElementById('backBtn');
            document.getElementById('loader').style.display = 'none';
            container.innerHTML = "";

            const hasMaster = allExams.some(e => e['Master Category'] && String(e['Master Category']).trim() !== "");

            if (hasMaster) {
                if (!currentMaster) {
                    // লেভেল ০: হোম পেজ (মাস্টার ক্যাটাগরি ফোল্ডারগুলো দেখাবে)
                    backBtn.style.display = 'none';
                    pathTitle.innerText = "Textile Engineering Admission Preparation";
                    container.className = "exam-grid";

                    const masterCats = [...new Set(allExams.map(e => e['Master Category']))].filter(m => m && String(m).trim() !== "");
                    let html = "";
                    masterCats.forEach(mCat => {
                        const count = allExams.filter(e => e['Master Category'] === mCat).length;
                        html += `
                            <div class="item-card folder-card" onclick="openMaster('${mCat.replace(/'/g, "\\'")}')">
                                <div class="icon-box folder-icon"><i class="fas fa-layer-group"></i></div>
                                <h3 style="margin:0;">${mCat}</h3>
                                <p style="font-size:12px; color:#888; margin-top:5px;">${count} Items</p>
                            </div>`;
                    });
                    container.innerHTML = html;
                } 
                else if (currentMaster && !currentCategory) {
                    // লেভেল ১: মাস্টার ফোল্ডারের ভেতর
                    const masterExams = allExams.filter(e => e['Master Category'] === currentMaster);
                    
                    // সাব-ক্যাটাগরি আছে কি না পরীক্ষা করা (যদি ক্যাটাগরি ফাঁকা থাকে বা মাস্টারের সমান হয়, তবে সরাসরি আইটেম দেখাবে)
                    const categories = [...new Set(masterExams.map(e => e['Category']))]
                        .filter(cat => cat && String(cat).trim() !== "" && cat !== "General" && cat !== currentMaster);

                    if (categories.length > 0) {
                        // সাব-ক্যাটাগরি ফোল্ডার আছে ➡️ ফোল্ডার দেখাও
                        backBtn.style.display = 'block';
                        pathTitle.innerText = currentMaster;
                        container.className = "category-grid"; // ২ কলাম গ্রিড

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
                        // সাব-ক্যাটাগরি নেই (ফাঁকা) ➡️ সরাসরি ভিডিও ও এক্সাম কার্ড দেখাও!
                        backBtn.style.display = 'block';
                        pathTitle.innerText = currentMaster;
                        container.className = "category-grid"; // ২ কলাম গ্রিড
                        renderItems(masterExams, container);
                    }
                } 
                else {
                    // লেভেল ২: সাব-ক্যাটাগরির ভেতর (আসল এক্সাম/ভিডিও)
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
        function renderItems(filtered, container) {
            let html = "";
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
                    const action = unlocked ? `location.href='exam.html?id=${encodeURIComponent(item['Tab ID'])}&name=${encodeURIComponent(itemName)}&range=${encodeURIComponent(itemRange)}'` : `openPaymentModal()`;
                    
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

        function openPaymentModal() { 
            document.getElementById('paymentModal').style.display = 'flex';
            history.pushState({ modal: 'payment' }, '');
        }

        function closePaymentModal() { 
            const payModal = document.getElementById('paymentModal');
            if (payModal) payModal.style.display = 'none';
        }

        function toggleHelp() { document.getElementById('socialLinks').classList.toggle('show'); }
