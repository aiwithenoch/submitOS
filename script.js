document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        openSidebarBtn.style.display = 'flex';
    });

    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        openSidebarBtn.style.display = 'none';
    });

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

    // Document Upload and Pricing Logic
    const documentUpload = document.getElementById('documentUpload');
    const uploadActionBtn = document.getElementById('uploadActionBtn');
    const pricingResults = document.getElementById('pricingResults');
    const uploadSection = document.querySelector('.upload-container');

    if (documentUpload) {
        documentUpload.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Simple validation
            if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
                alert('Please upload a valid Word document (.docx or .doc).');
                return;
            }

            // If it's a docx, we can parse it
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

                        // Calculate Price
                        let price = 0;
                        if (pages >= 1 && pages <= 50) price = 350;
                        else if (pages >= 51 && pages <= 150) price = 700;
                        else if (pages >= 151 && pages <= 250) price = 800;
                        else price = 1000;

                        // Update UI
                        document.getElementById('detectedPages').textContent = pages;
                        document.getElementById('standardPrice').textContent = `₵${price.toLocaleString()}`;
                        
                        // Switch views
                        uploadSection.style.display = 'none';
                        pricingResults.style.display = 'block';
                    } else {
                        alert("Could not read page count metadata. Please try another file.");
                        uploadActionBtn.textContent = "Upload document";
                        uploadActionBtn.disabled = false;
                    }

                } catch (error) {
                    console.error("Error parsing document:", error);
                    alert("There was an error parsing the document.");
                    uploadActionBtn.textContent = "Upload document";
                    uploadActionBtn.disabled = false;
                }
            } else {
                // Fallback for .doc files (cannot be easily parsed client-side)
                alert("Legacy .doc files cannot be parsed in the browser. Please convert to .docx.");
                uploadActionBtn.textContent = "Upload document";
                uploadActionBtn.disabled = false;
            }
        });
    }
});
