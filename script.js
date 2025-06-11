// Global variables
let currentUser = null;
let uploadedFiles = [];
let deployedSites = [];

// Initialize the app
function init() {
    // Check if user is already logged in
    const savedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (savedUser) {
        currentUser = savedUser;
        showDashboard();
    }
    
    // Load deployed sites
    deployedSites = JSON.parse(localStorage.getItem('deployedSites') || '[]');
    updateSitesList();

    setupEventListeners();
}

function setupEventListeners() {
    // Drag and drop events
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    // File input change
    document.getElementById('fileInput').addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });

    // Form submissions
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    document.getElementById('signupPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') signup();
    });
}

// Authentication functions
function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Simple validation
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    // Simulate account creation
    const user = { name, email, password, id: Date.now() };
    localStorage.setItem('user_' + email, JSON.stringify(user));
    
    showMessage('Account created successfully! Please sign in.', 'success');
    showLogin();
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Check credentials
    const savedUser = JSON.parse(localStorage.getItem('user_' + email) || 'null');
    
    if (!savedUser || savedUser.password !== password) {
        alert('Invalid email or password');
        return;
    }

    currentUser = savedUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showDashboard();
}

function logout() {
    currentUser = null;
    uploadedFiles = [];
    localStorage.removeItem('currentUser');
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    showLogin();
}

function showDashboard() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;
    updateSitesList();
}

// File handling functions
function handleFiles(files) {
    files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert(`File ${file.name} is too large (max 10MB)`);
            return;
        }

        const fileObj = {
            name: file.name,
            size: file.size,
            type: file.type,
            content: null,
            id: Date.now() + Math.random()
        };

        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
            fileObj.content = e.target.result;
            uploadedFiles.push(fileObj);
            updateFileList();
            updateDeployButton();
        };
        reader.readAsText(file);
    });
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    const fileItems = document.getElementById('fileItems');

    if (uploadedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }

    fileList.style.display = 'block';
    fileItems.innerHTML = '';

    uploadedFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const extension = file.name.split('.').pop().toLowerCase();
        let iconClass = 'other';
        if (['html', 'htm'].includes(extension)) iconClass = 'html';
        else if (extension === 'css') iconClass = 'css';
        else if (extension === 'js') iconClass = 'js';

        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon ${iconClass}">${extension.toUpperCase()}</div>
                <div>
                    <div style="font-weight: 600;">${file.name}</div>
                    <div style="font-size: 12px; color: #666;">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="delete-file" onclick="removeFile('${file.id}')">×</button>
        `;

        fileItems.appendChild(fileItem);
    });
}

function removeFile(fileId) {
    uploadedFiles = uploadedFiles.filter(file => file.id != fileId);
    updateFileList();
    updateDeployButton();
}

function updateDeployButton() {
    const deployBtn = document.getElementById('deployBtn');
    const hasHtmlFile = uploadedFiles.some(file => 
        file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')
    );
    
    deployBtn.disabled = !hasHtmlFile;
    deployBtn.textContent = hasHtmlFile ? '🚀 Deploy Website' : '📄 Upload HTML file to deploy';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Deployment functions
function deployWebsite() {
    if (uploadedFiles.length === 0) {
        alert('Please upload some files first');
        return;
    }

    const loading = document.getElementById('loading');
    const deployBtn = document.getElementById('deployBtn');
    
    loading.style.display = 'block';
    deployBtn.disabled = true;

    // Simulate deployment process
    setTimeout(() => {
        const siteId = generateSiteId();
        const siteName = findMainHtmlFile() || 'website';
        const siteUrl = `https://${siteId}.statichost.dev`;

        const newSite = {
            id: siteId,
            name: siteName,
            url: siteUrl,
            files: [...uploadedFiles],
            deployedAt: new Date().toISOString(),
            userId: currentUser.id
        };

        deployedSites.push(newSite);
        localStorage.setItem('deployedSites', JSON.stringify(deployedSites));

        loading.style.display = 'none';
        deployBtn.disabled = false;
        
        showMessage(`🎉 Website deployed successfully! Your site is live at: ${siteUrl}`, 'success');
        
        // Clear uploaded files
        uploadedFiles = [];
        updateFileList();
        updateDeployButton();
        updateSitesList();
    }, 3000);
}

function generateSiteId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function findMainHtmlFile() {
    const indexFile = uploadedFiles.find(file => 
        file.name.toLowerCase() === 'index.html' || file.name.toLowerCase() === 'index.htm'
    );
    if (indexFile) return 'index.html';

    const htmlFile = uploadedFiles.find(file => 
        file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')
    );
    return htmlFile ? htmlFile.name : null;
}

function updateSitesList() {
    const sitesList = document.getElementById('sitesList');
    const userSites = deployedSites.filter(site => site.userId === (currentUser?.id || null));

    if (userSites.length === 0) {
        sitesList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No sites deployed yet. Upload some files and deploy your first website!</p>';
        return;
    }

    sitesList.innerHTML = '';
    userSites.forEach(site => {
        const siteItem = document.createElement('div');
        siteItem.className = 'site-item';
        
        const deployDate = new Date(site.deployedAt).toLocaleDateString();
        
        siteItem.innerHTML = `
            <div class="site-info">
                <h3>${site.name}</h3>
                <a href="#" class="site-url" onclick="visitSite('${site.url}')">${site.url}</a>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Deployed on ${deployDate}</div>
            </div>
            <div class="site-actions">
                <button class="visit-btn" onclick="visitSite('${site.url}')">Visit</button>
                <button class="delete-btn" onclick="deleteSite('${site.id}')">Delete</button>
            </div>
        `;
        
        sitesList.appendChild(siteItem);
    });
}

function visitSite(url) {
    // Simulate opening the deployed site
    showMessage(`Opening ${url} - This would open your live website in a new tab!`, 'success');
}

function deleteSite(siteId) {
    if (confirm('Are you sure you want to delete this site? This action cannot be undone.')) {
        deployedSites = deployedSites.filter(site => site.id !== siteId);
        localStorage.setItem('deployedSites', JSON.stringify(deployedSites));
        updateSitesList();
        showMessage('Site deleted successfully', 'success');
    }
}

function showMessage(message, type) {
    const messageElement = document.getElementById(type === 'success' ? 'successMessage' : 'errorMessage');
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

// Initialize the app when page loads
window.addEventListener('load', init);