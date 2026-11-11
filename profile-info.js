// --- LOAD USER PROFILE DATA ---
async function loadUserProfile(email) {
    try {
        const doc = await db.collection("users").doc(email).get();
        if (doc.exists) {
            const data = doc.data();
            const colEl = document.getElementById('userCollege');
            if (colEl) {
                if (data.college && String(data.college).trim() !== '') {
                    colEl.style.display = 'block';
                    colEl.querySelector('span').innerText = data.college;
                    document.getElementById('inpCollege').value = data.college;
                } else {
                    colEl.style.display = 'none';
                    document.getElementById('inpCollege').value = '';
                }
            }
            const batchEl = document.getElementById('userBatch');
            if (batchEl) {
                if (data.batch && String(data.batch).trim() !== '') {
                    batchEl.style.display = 'block';
                    batchEl.querySelector('span').innerText = data.batch;
                    document.getElementById('inpBatch').value = data.batch;
                } else {
                    batchEl.style.display = 'none';
                    document.getElementById('inpBatch').value = '';
                }
            }
            const phoneEl = document.getElementById('userPhone');
            if (phoneEl) {
                if (data.phone && String(data.phone).trim() !== '') {
                    phoneEl.style.display = 'block';
                    phoneEl.querySelector('span').innerText = data.phone;
                    document.getElementById('inpPhone').value = data.phone;
                } else {
                    phoneEl.style.display = 'none';
                    document.getElementById('inpPhone').value = '';
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

