// --- LOAD USER PROFILE DATA ---
async function loadUserProfile(email) {
    try {
        const doc = await db.collection("users").doc(email).get();
        if (doc.exists) {
            const data = doc.data();
            if(data.college) {
                const el = document.getElementById('userCollege');
                el.style.display = 'block';
                el.querySelector('span').innerText = data.college;
                document.getElementById('inpCollege').value = data.college;
            }
            if(data.batch) {
                const el = document.getElementById('userBatch');
                el.style.display = 'block';
                el.querySelector('span').innerText = data.batch;
                document.getElementById('inpBatch').value = data.batch;
            }
            if(data.phone) {
                const el = document.getElementById('userPhone');
                el.style.display = 'block';
                el.querySelector('span').innerText = data.phone;
                document.getElementById('inpPhone').value = data.phone;
            }
            if(data.mentalSupport) {
                if (typeof renderMentalChat === 'function') {
                    renderMentalChat(data.mentalSupport);
                }

                let latestReply = data.mentalSupport.reply || null;
                let replyTime = data.mentalSupport.repliedAt || null;

                if (Array.isArray(data.mentalSupport.messages) && data.mentalSupport.messages.length > 0) {
                    const adminMsgs = data.mentalSupport.messages.filter(m => m.sender === 'admin');
                    if (adminMsgs.length > 0) {
                        const lastAdmin = adminMsgs[adminMsgs.length - 1];
                        latestReply = lastAdmin.text;
                        replyTime = lastAdmin.timestamp;
                    }
                }

                if(latestReply) {
                    const banner = document.getElementById('adminReplyBanner');
                    if (banner) {
                        banner.style.display = 'block';
                        document.getElementById('adminReplyText').innerText = latestReply;
                        let dStr = "সাম্প্রতিক";
                        if (replyTime) {
                            const rDate = parseDate(replyTime);
                            if (rDate) dStr = rDate.toLocaleDateString("bn-BD", { day: 'numeric', month: 'short', year: 'numeric' });
                        }
                        document.getElementById('adminReplyDate').innerText = dStr;
                    }
                }
            }
        }
    } catch (e) { console.error("Profile load error:", e); }
}

// --- MODAL CONTROLS ---
function openProfileModal() { 
    document.getElementById('profileModal').style.display = 'flex'; 
    document.body.style.overflow = 'hidden';
}
function closeProfileModal() { 
    document.getElementById('profileModal').style.display = 'none'; 
    document.body.style.overflow = '';
}

// --- SAVE PROFILE DATA ---
async function saveProfileData() {
    const college = document.getElementById('inpCollege').value.trim();
    const batch = document.getElementById('inpBatch').value.trim();
    const phone = document.getElementById('inpPhone').value.trim();
    const saveBtn = document.getElementById('saveBtn');

    if(!currentUserEmail) return;

    saveBtn.innerText = "সেভ হচ্ছে...";
    saveBtn.disabled = true;

    try {
        await db.collection("users").doc(currentUserEmail).set({
            college: college,
            batch: batch,
            phone: phone,
            email: currentUserEmail,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        closeProfileModal();

        Swal.fire({ 
            icon: 'success', 
            title: 'সফল!', 
            text: 'প্রোফাইল আপডেট হয়েছে।', 
            timer: 1500, 
            showConfirmButton: false 
        });
        
        loadUserProfile(currentUserEmail); 

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'সেভ করতে সমস্যা হয়েছে!', 'error');
    } finally {
        saveBtn.innerText = "সেভ করুন";
        saveBtn.disabled = false;
    }
}

