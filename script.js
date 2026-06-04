document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');

    if (closeSidebarBtn && openSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            openSidebarBtn.style.display = 'flex';
        });

        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('collapsed');
            openSidebarBtn.style.display = 'none';
        });
    }

    // Profile popup toggle
    const profileBtn = document.getElementById('userProfileBtn');
    const profilePopup = document.getElementById('profilePopup');

    if (profileBtn && profilePopup) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profilePopup.classList.toggle('visible');
        });

        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profilePopup.contains(e.target)) {
                profilePopup.classList.remove('visible');
            }
        });
    }

    // Initialize Pages
    initDashboard();
    initHistory();
    initSettings();
});

let currentFileToUpload = null;
let currentPages = 1;
let currentPrice = 0;

function initDashboard() {
    const documentUpload = document.getElementById('documentUpload');
    if (!documentUpload) return; // Not on dashboard

    const uploadActionBtn = document.getElementById('uploadActionBtn');
    const pricingResults = document.getElementById('pricingResults');
    const uploadSection = document.querySelector('.upload-container');

    documentUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            alert('Please upload a valid Word document (.docx or .doc).');
            return;
        }

        if (file.name.endsWith('.docx') && typeof JSZip !== 'undefined') {
            try {
                uploadActionBtn.textContent = "Analyzing...";
                uploadActionBtn.disabled = true;

                const zip = new JSZip();
                const contents = await zip.loadAsync(file);
                
                if (contents.files['docProps/app.xml']) {
                    const xmlText = await contents.files['docProps/app.xml'].async('text');
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                    const pagesNode = xmlDoc.getElementsByTagName('Pages')[0];
                    
                    let pages = 1;
                    if (pagesNode) {
                        pages = parseInt(pagesNode.textContent, 10);
                    }

                    let price = 0;
                    if (pages >= 1 && pages <= 50) price = 350;
                    else if (pages >= 51 && pages <= 150) price = 700;
                    else if (pages >= 151 && pages <= 250) price = 800;
                    else price = 1000;

                    currentFileToUpload = file;
                    currentPages = pages;
                    currentPrice = price;

                    document.getElementById('detectedPages').textContent = pages;
                    document.getElementById('standardPrice').textContent = `₵${price.toLocaleString()}`;
                    
                    uploadSection.style.display = 'none';
                    pricingResults.style.display = 'block';
                } else {
                    alert("Could not read page count metadata. Please try another file.");
                    resetUpload(uploadActionBtn);
                }
            } catch (error) {
                console.error("Error parsing document:", error);
                alert("There was an error parsing the document.");
                resetUpload(uploadActionBtn);
            }
        } else {
            alert("Legacy .doc files cannot be parsed in the browser. Please convert to .docx.");
            resetUpload(uploadActionBtn);
        }
    });

    // Handle payment/upload buttons
    const payBtns = document.querySelectorAll('.pricing-card .btn-primary');
    payBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const isPremium = e.target.closest('.premium-card') !== null;
            await processUpload(isPremium);
        });
    });

    loadRecentSubmissions();
}

function resetUpload(btn) {
    btn.textContent = "Upload document";
    btn.disabled = false;
    currentFileToUpload = null;
}

async function processUpload(isPremium) {
    if (!currentFileToUpload || !currentUser) return;

    try {
        const fileExt = currentFileToUpload.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await window.supabase.storage
            .from('documents')
            .upload(filePath, currentFileToUpload);

        if (uploadError) throw uploadError;

        // 2. Insert into Database
        const { error: dbError } = await window.supabase
            .from('documents')
            .insert({
                user_id: currentUser.id,
                file_name: currentFileToUpload.name,
                file_path: filePath,
                pages: currentPages,
                cost: isPremium ? 1000 : currentPrice,
                status: 'processing'
            });

        if (dbError) throw dbError;

        alert('Document uploaded successfully and is now processing!');
        window.location.href = 'history.html';

    } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload document: ' + error.message);
    }
}

async function loadRecentSubmissions() {
    const listContainer = document.getElementById('recentSubmissionsList');
    if (!listContainer) return;

    // Wait until user is loaded
    if (!currentUser) {
        setTimeout(loadRecentSubmissions, 500);
        return;
    }

    const { data, error } = await window.supabase
        .from('documents')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Failed to load submissions:', error);
        return;
    }

    listContainer.innerHTML = '';

    if (data.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No submissions yet.</p>';
        return;
    }

    data.forEach(doc => {
        const date = new Date(doc.created_at).toLocaleDateString();
        const statusBadge = doc.status === 'processing' 
            ? `<span class="badge-processing" style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; background: #FFF3CD; color: #856404;">PROCESSING</span>`
            : `<span class="badge-done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> DONE</span>`;

        const card = document.createElement('div');
        card.className = 'submission-card';
        card.innerHTML = `
            <div class="submission-info">
                <div class="file-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#637381" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div class="file-details">
                    <p class="file-name">${doc.file_name}</p>
                    <p class="file-time">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${date}
                    </p>
                </div>
            </div>
            <div class="submission-stats">
                <span class="stat">AI <strong>${doc.ai_score || 0}%</strong></span>
                <span class="stat">Sim <strong>${doc.similarity_score || 0}%</strong></span>
                ${statusBadge}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function initHistory() {
    const listContainer = document.getElementById('historySubmissionsList');
    if (!listContainer) return; // Not on history page

    async function fetchHistory() {
        if (!currentUser) {
            setTimeout(fetchHistory, 500);
            return;
        }

        const { data, error } = await window.supabase
            .from('documents')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to load history:', error);
            listContainer.innerHTML = '<p>Failed to load history.</p>';
            return;
        }

        listContainer.innerHTML = '';
        if (data.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 32px;">No submissions yet.</p>';
            return;
        }

        data.forEach(doc => {
            const date = new Date(doc.created_at).toLocaleDateString();
            const statusBadge = doc.status === 'processing' 
                ? `<span class="badge-processing" style="font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; background: #FFF3CD; color: #856404;">PROCESSING</span>`
                : `<span class="badge-done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> DONE</span>`;

            const card = document.createElement('div');
            card.className = 'submission-card';
            card.innerHTML = `
                <div class="submission-info">
                    <div class="file-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#637381" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div class="file-details">
                        <p class="file-name">${doc.file_name}</p>
                        <p class="file-time">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            ${date}
                        </p>
                    </div>
                </div>
                <div class="submission-stats">
                    <span class="stat">AI <strong>${doc.ai_score || 0}%</strong></span>
                    <span class="stat">Sim <strong>${doc.similarity_score || 0}%</strong></span>
                    ${statusBadge}
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    fetchHistory();
}

function initSettings() {
    // Only runs on settings.html
    const nameValue = document.querySelector('.settings-row:nth-child(1) .settings-value');
    if (!nameValue) return;

    async function loadSettings() {
        if (!currentUser) {
            setTimeout(loadSettings, 500);
            return;
        }

        const emailValue = document.querySelector('.settings-row:nth-child(3) .settings-value');
        
        emailValue.textContent = currentUser.email;
        nameValue.textContent = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];

        // Edit Name Logic
        const editNameBtn = nameValue.parentElement.nextElementSibling;
        editNameBtn.addEventListener('click', async () => {
            const newName = prompt("Enter your new name:", nameValue.textContent);
            if (newName && newName !== nameValue.textContent) {
                editNameBtn.textContent = 'Saving...';
                editNameBtn.disabled = true;

                const { data, error } = await supabase.auth.updateUser({
                    data: { full_name: newName }
                });

                if (error) {
                    alert("Error updating name: " + error.message);
                } else {
                    nameValue.textContent = newName;
                    // Also update profiles table
                    await supabase.from('profiles').update({ full_name: newName }).eq('id', currentUser.id);
                    // Update UI globally
                    updateUIForUser(data.user);
                }

                editNameBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit`;
                editNameBtn.disabled = false;
            }
        });
    }

    loadSettings();
}
