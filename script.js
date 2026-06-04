
function showToast(message, isError = false) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError || message.toLowerCase().includes('fail') || message.toLowerCase().includes('error') ? ' error' : '');
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s forwards ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
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
            showToast('Please upload a valid Word document (.docx or .doc).');
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
                    showToast("Could not read page count metadata. Please try another file.");
                    resetUpload(uploadActionBtn);
                }
            } catch (error) {
                console.error("Error parsing document:", error);
                showToast("There was an error parsing the document.");
                resetUpload(uploadActionBtn);
            }
        } else {
            showToast("Legacy .doc files cannot be parsed in the browser. Please convert to .docx.");
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
        const { error: uploadError } = await window.supabaseApp.storage
            .from('documents')
            .upload(filePath, currentFileToUpload);

        if (uploadError) throw uploadError;

        // 2. Insert into Database
        const { data: insertedDoc, error: dbError } = await window.supabaseApp
            .from('documents')
            .insert({
                user_id: currentUser.id,
                file_name: currentFileToUpload.name,
                file_path: filePath,
                pages: currentPages,
                cost: isPremium ? 1000 : currentPrice,
                status: 'pending_payment'
            })
            .select()
            .single();

        if (dbError) throw dbError;

        const productId = isPremium ? 'pdt_0NctF5YejRu7ZpdvrajI8' : 'pdt_0NctEvIG0q9y6YofXe0wp';
        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId,
                customerId: currentUser.id,
                documentId: insertedDoc.id
            })
        });

        if (!response.ok) throw new Error('Failed to create checkout session');

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error('No checkout URL returned');
        }

    } catch (error) {
        console.error('Upload failed:', error);
        showToast('Failed to upload document: ' + error.message);
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

    const { data, error } = await window.supabaseApp
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

        const { data, error } = await window.supabaseApp
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

        // Edit Name Logic (Inline Editing)
        const editNameBtn = nameValue.parentElement.nextElementSibling;
        let isEditingName = false;

        editNameBtn.addEventListener('click', async () => {
            if (!isEditingName) {
                // Switch to edit mode
                isEditingName = true;
                const currentName = nameValue.textContent;
                
                // Create an input field
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentName;
                input.className = 'edit-name-input';
                input.style.padding = '4px 8px';
                input.style.border = '1px solid var(--border-color)';
                input.style.borderRadius = '4px';
                input.style.fontSize = '14px';
                input.style.width = '100%';
                input.style.maxWidth = '250px';
                input.style.marginTop = '4px';

                // Replace span text with input
                nameValue.innerHTML = '';
                nameValue.appendChild(input);
                
                // Change button to 'Save'
                editNameBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save';
                input.focus();

            } else {
                // Save mode
                const input = nameValue.querySelector('input');
                if (!input) return;
                
                const newName = input.value.trim();
                if (!newName) {
                    showToast("Name cannot be empty");
                    return;
                }

                editNameBtn.innerHTML = 'Saving...';
                editNameBtn.disabled = true;
                input.disabled = true;

                const { data, error } = await window.supabaseApp.auth.updateUser({
                    data: { full_name: newName }
                });

                if (error) {
                    showToast("Error updating name: " + error.message);
                    input.disabled = false;
                    editNameBtn.disabled = false;
                    editNameBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save';
                } else {
                    // Revert to view mode
                    isEditingName = false;
                    nameValue.innerHTML = '';
                    nameValue.textContent = newName;
                    editNameBtn.disabled = false;
                    editNameBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit';
                }
            }
        });
    }

    loadSettings();
}

async function downloadOriginal(filePath) {
    const { data } = window.supabaseApp.storage.from('documents').getPublicUrl(filePath);
    if (data && data.publicUrl) {
        window.open(data.publicUrl, '_blank');
    } else {
        showToast('Could not download original file.');
    }
}

async function downloadBypassed(filePath) {
    const { data } = window.supabaseApp.storage.from('bypassed_documents').getPublicUrl(filePath);
    if (data && data.publicUrl) {
        window.open(data.publicUrl, '_blank');
    } else {
        showToast('Could not download bypassed file.');
    }
}

async function runBypass(docId) {
    showToast('Bypass architecture has not been implemented yet. This will trigger the AI bypass backend.');
}
