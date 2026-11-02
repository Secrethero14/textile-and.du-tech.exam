// --- MENTAL SUPPORT & CHAT CONTROLS ---
let cachedMentalSupport = null;

function renderMentalChat(mentalData) {
    cachedMentalSupport = mentalData;
    const container = document.getElementById('mentalChatContainer');
    if (!container) return;

    let msgs = [];
    if (mentalData) {
        if (Array.isArray(mentalData.messages) && mentalData.messages.length > 0) {
            msgs = mentalData.messages;
        } else if (mentalData.message) {
            // Backward compatibility for existing single message/reply
            msgs.push({
                sender: 'student',
                text: mentalData.message,
                timestamp: mentalData.updatedAt || null
            });
            if (mentalData.reply) {
                msgs.push({
                    sender: 'admin',
                    text: mentalData.reply,
                    timestamp: mentalData.repliedAt || null
                });
            }
        }
    }

    if (msgs.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #888; padding: 25px 10px; font-size: 13px;">
                <i class="far fa-comments fa-2x" style="opacity: 0.3; margin-bottom: 8px;"></i>
                <p style="margin: 0;">এখনো কোনো বার্তা পাঠানো হয়নি। পড়ালেখা বা যেকোনো সমস্যা নিয়ে ভাইয়াকে মন খুলে লিখো।</p>
            </div>
        `;
        return;
    }

    let html = '';
    msgs.forEach(m => {
        const isStudent = m.sender === 'student';
        let timeStr = '';
        if (m.timestamp) {
            const d = parseDate(m.timestamp);
            if (d) {
                timeStr = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
            }
        }

        if (isStudent) {
            html += `
                <div style="align-self: flex-end; max-width: 85%; background: #6c5ce7; color: white; padding: 9px 13px; border-radius: 14px 14px 2px 14px; font-size: 13px; box-shadow: 0 2px 6px rgba(108,92,231,0.2); word-break: break-word;">
                    <div style="font-weight: 600; font-size: 10px; opacity: 0.85; margin-bottom: 3px; text-align: right;"><i class="fas fa-user"></i> আমি ${timeStr ? '• ' + timeStr : ''}</div>
                    <div style="white-space: pre-wrap; line-height: 1.4;">${escapeHtml(m.text)}</div>
                </div>
            `;
        } else {
            html += `
                <div style="align-self: flex-start; max-width: 85%; background: white; color: #2d3436; border: 1px solid #00b894; border-left: 4px solid #00b894; padding: 9px 13px; border-radius: 14px 14px 14px 2px; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); word-break: break-word;">
                    <div style="font-weight: 700; font-size: 11px; color: #00b894; margin-bottom: 3px;"><i class="fas fa-user-shield"></i> ভাইয়া / এডমিন ${timeStr ? '• ' + timeStr : ''}</div>
                    <div style="white-space: pre-wrap; line-height: 1.4;">${escapeHtml(m.text)}</div>
                </div>
            `;
        }
    });

    container.innerHTML = html;
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function openMentalModal() { 
    const m = document.getElementById('mentalModal');
    if (m) m.style.display = 'flex'; 
    document.body.style.overflow = 'hidden';

    if (cachedMentalSupport) {
        renderMentalChat(cachedMentalSupport);
    } else if (currentUserEmail) {
        try {
            const doc = await db.collection("users").doc(currentUserEmail).get();
            if (doc.exists && doc.data().mentalSupport) {
                renderMentalChat(doc.data().mentalSupport);
            } else {
                renderMentalChat(null);
            }
        } catch(e) {
            console.error("Error opening chat:", e);
        }
    }
}

function closeMentalModal() { 
    const m = document.getElementById('mentalModal');
    if (m) m.style.display = 'none'; 
    document.body.style.overflow = '';
}

function toggleContactInput() {
    const replyType = document.querySelector('input[name="replyType"]:checked')?.value;
    const wrap = document.getElementById('contactInputWrap');
    if (wrap) wrap.style.display = (replyType === 'whatsapp') ? 'block' : 'none';
}

async function sendMentalMessage() {
    const inputEl = document.getElementById('mentalMsgInput');
    const msg = inputEl ? inputEl.value.trim() : '';
    if (!msg) {
        return Swal.fire('সতর্কতা', 'দয়া করে তোমার মনের কথা বা সমস্যাটি বিস্তারিত লেখো।', 'warning');
    }
    const replyType = document.querySelector('input[name="replyType"]:checked')?.value || 'profile';
    const contactVal = document.getElementById('mentalContactInput')?.value.trim() || '';
    if (replyType === 'whatsapp' && !contactVal) {
        return Swal.fire('নম্বর প্রয়োজন', 'WhatsApp বা Telegram এ উত্তর পেতে তোমার নম্বর বা আইডি দাও।', 'warning');
    }

    const sendBtn = document.getElementById('mentalSendBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> পাঠানো হচ্ছে...';

    try {
        // Fetch existing conversation
        const userDoc = await db.collection("users").doc(currentUserEmail).get();
        let msgs = [];
        let prevContact = "";

        if (userDoc.exists && userDoc.data().mentalSupport) {
            const ms = userDoc.data().mentalSupport;
            prevContact = ms.contact || "";
            if (Array.isArray(ms.messages) && ms.messages.length > 0) {
                msgs = [...ms.messages];
            } else if (ms.message) {
                msgs.push({
                    sender: 'student',
                    text: ms.message,
                    timestamp: ms.updatedAt || null
                });
                if (ms.reply) {
                    msgs.push({
                        sender: 'admin',
                        text: ms.reply,
                        timestamp: ms.repliedAt || null
                    });
                }
            }
        }

        // Add new student message
        const newMsgObj = {
            sender: "student",
            text: msg,
            timestamp: new Date().toISOString()
        };
        msgs.push(newMsgObj);

        const payload = {
            messages: msgs,
            message: msg, // Keep latest message string for quick table preview in admin
            replyType: replyType,
            contact: contactVal || prevContact || "N/A",
            status: "pending",
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("users").doc(currentUserEmail).set({
            mentalSupport: payload
        }, { merge: true });

        // Update local UI immediately
        renderMentalChat(payload);
        inputEl.value = '';

        Swal.fire({
            icon: 'success',
            title: 'বার্তা পাঠানো হয়েছে!',
            text: 'তোমার মনের কথা সরাসরি ভাইয়ার কাছে পৌঁছে গেছে। দ্রুতই উত্তর পাবে ইনশাআল্লাহ।',
            timer: 2000,
            showConfirmButton: false
        });

    } catch(err) {
        console.error(err);
        Swal.fire('Error', 'মেসেজ পাঠানো যায়নি: ' + err.message, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> বার্তা পাঠান';
    }
}
