// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCLhhWmB-gW_ROW6GVEexQXBZgo_6CX2t8",
    authDomain: "ntng-6d316.firebaseapp.com",
    projectId: "ntng-6d316",
    storageBucket: "ntng-6d316.firebasestorage.app",
    messagingSenderId: "734233142575",
    appId: "1:734233142575:web:a5a8c5d06e8a03a7d66dda"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ImgBB API Key
const IMGBB_API_KEY = 'b5e73a96d3fb220e95b73ef76725b650';

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const categoriesList = document.getElementById('categories-list');
const notesContainer = document.getElementById('notes-container');
const emptyState = document.getElementById('empty-state');
const currentCategory = document.getElementById('current-category');
const uploadNoteBtn = document.getElementById('upload-note-btn');
const uploadModal = document.getElementById('upload-modal');
const categoryModal = document.getElementById('category-modal');
const addCategoryBtn = document.getElementById('add-category-btn');
const viewNoteModal = document.getElementById('view-note-modal');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const emptyUploadBtn = document.getElementById('empty-upload-btn');
const imagePreviewContainer = document.getElementById('image-preview-container');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const imageInput = document.getElementById('note-image');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const forgotPasswordForm = document.getElementById('forgot-password-form');

// Global variables
let currentUser = null;
let selectedCategory = 'all';
let categories = [];
let notes = [];

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        userEmail.textContent = user.email;
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadCategories();
        loadNotes();
        showToast('Successfully logged in', 'success');
    } else {
        currentUser = null;
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
});

// Switch between login and signup tabs
function switchTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    
    if (tab === 'login') {
        loginTab.classList.add('border-purple-600');
        loginTab.classList.remove('text-gray-500');
        signupTab.classList.remove('border-purple-600');
        signupTab.classList.add('text-gray-500');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('border-purple-600');
        signupTab.classList.remove('text-gray-500');
        loginTab.classList.remove('border-purple-600');
        loginTab.classList.add('text-gray-500');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
    
    authError.classList.add('hidden');
    authError.textContent = '';
}

// Login form submission
loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            showAuthError(error.message);
        });
});

// Signup form submission
signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!email || !password || !confirmPassword) {
        showAuthError('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthError('Passwords do not match');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            // Create default categories for new users
            const defaultCategories = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
            const batch = db.batch();
            
            defaultCategories.forEach(category => {
                const categoryRef = db.collection('users').doc(auth.currentUser.uid)
                    .collection('categories').doc();
                batch.set(categoryRef, { name: category, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            });
            
            return batch.commit();
        })
        .catch(error => {
            showAuthError(error.message);
        });
});

// Forgot Password Functionality
forgotPasswordBtn.addEventListener('click', () => {
    forgotPasswordModal.classList.remove('hidden');
});

document.getElementById('close-forgot-password-modal').addEventListener('click', () => {
    forgotPasswordModal.classList.add('hidden');
});

document.getElementById('cancel-reset').addEventListener('click', () => {
    forgotPasswordModal.classList.add('hidden');
});

forgotPasswordForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showToast('Password reset link sent to your email', 'success');
            forgotPasswordModal.classList.add('hidden');
            forgotPasswordForm.reset();
        })
        .catch(error => {
            showToast('Error sending reset link: ' + error.message, 'error');
        });
});

// Logout handler
logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            showToast('Logged out successfully', 'success');
        })
        .catch(error => {
            showToast('Error logging out: ' + error.message, 'error');
        });
});

// Load categories
function loadCategories() {
    db.collection('users').doc(currentUser.uid).collection('categories')
        .orderBy('createdAt')
        .get()
        .then(snapshot => {
            categories = [];
            categoriesList.innerHTML = `
                <li class="category-item p-2 rounded-md mb-1 ${selectedCategory === 'all' ? 'active' : ''}" data-category="all">
                    <div class="flex items-center">
                        <i class="fas fa-layer-group mr-3"></i>
                        <span>All Notes</span>
                    </div>
                </li>
            `;
            
            snapshot.forEach(doc => {
                const category = { id: doc.id, ...doc.data() };
                categories.push(category);
                
                const li = document.createElement('li');
                li.className = `category-item p-2 rounded-md mb-1 ${selectedCategory === category.id ? 'active' : ''}`;
                li.setAttribute('data-category', category.id);
                li.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas fa-book mr-3"></i>
                            <span>${category.name}</span>
                        </div>
                        <button class="delete-category-btn text-red-500 hover:text-red-700 opacity-0 transition-opacity duration-200">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                categoriesList.appendChild(li);

                // Add delete functionality
                const deleteBtn = li.querySelector('.delete-category-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent category selection when clicking delete
                    if (confirm(`Are you sure you want to delete the category "${category.name}"? This will also delete all notes in this category.`)) {
                        deleteCategory(category.id);
                    }
                });

                // Show delete button on hover
                li.addEventListener('mouseenter', () => {
                    deleteBtn.classList.remove('opacity-0');
                });
                li.addEventListener('mouseleave', () => {
                    deleteBtn.classList.add('opacity-0');
                });
            });
            
            // Update category dropdown in upload form
            const categoryDropdown = document.getElementById('note-category');
            categoryDropdown.innerHTML = '';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryDropdown.appendChild(option);
            });
            
            // Add event listeners to category items
            document.querySelectorAll('.category-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectedCategory = item.getAttribute('data-category');
                    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    
                    if (selectedCategory === 'all') {
                        currentCategory.textContent = 'All Notes';
                        displayNotes(notes);
                    } else {
                        const category = categories.find(c => c.id === selectedCategory);
                        currentCategory.textContent = category ? category.name : 'Notes';
                        const filteredNotes = notes.filter(note => note.category === selectedCategory);
                        displayNotes(filteredNotes);
                    }
                    
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 768) {
                        sidebar.classList.add('sidebar-collapsed');
                        content.classList.add('content-expanded');
                    }
                });
            });
        })
        .catch(error => {
            showToast('Error loading categories: ' + error.message, 'error');
        });
}

// Load notes
function loadNotes() {
    db.collection('users').doc(currentUser.uid).collection('notes')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            notes = [];
            snapshot.forEach(doc => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            
            if (selectedCategory === 'all') {
                displayNotes(notes);
            } else {
                const filteredNotes = notes.filter(note => note.category === selectedCategory);
                displayNotes(filteredNotes);
            }
        })
        .catch(error => {
            showToast('Error loading notes: ' + error.message, 'error');
        });
}

// Display notes
function displayNotes(notesToShow) {
    notesContainer.innerHTML = '';
    
    if (notesToShow.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        notesToShow.forEach(note => {
            const category = categories.find(c => c.id === note.category);
            const date = note.createdAt ? new Date(note.createdAt.toDate()).toLocaleDateString() : 'Unknown date';
            const imageUrls = note.imageUrls || [note.imageUrl]; // Support both old and new format
            
            const noteCard = document.createElement('div');
            noteCard.className = 'note-card';
            noteCard.innerHTML = `
                <div class="relative">
                    <img src="${imageUrls[0]}" alt="${note.title}" class="w-full h-40 object-cover">
                    ${imageUrls.length > 1 ? `
                        <div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                            +${imageUrls.length - 1} more
                        </div>
                    ` : ''}
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-semibold mb-2">${note.title}</h3>
                    <p class="text-sm text-gray-600 mb-3">${note.caption}</p>
                    <div class="flex justify-between items-center">
                        <span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">${category ? category.name : 'Uncategorized'}</span>
                        <span class="text-xs text-gray-500">${date}</span>
                    </div>
                </div>
            `;
            
            noteCard.addEventListener('click', () => viewNote(note));
            notesContainer.appendChild(noteCard);
        });
    }
}

// View note details
function viewNote(note) {
    const viewNoteTitle = document.getElementById('view-note-title');
    const viewNoteImages = document.getElementById('view-note-images');
    const viewNoteCaption = document.getElementById('view-note-caption');
    const viewNoteDate = document.getElementById('view-note-date');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    
    viewNoteTitle.textContent = note.title;
    viewNoteCaption.textContent = note.caption;
    
    // Clear previous images
    viewNoteImages.innerHTML = '';
    
    // Get all image URLs
    const imageUrls = note.imageUrls || [note.imageUrl]; // Support both old and new format
    
    // Add all images as thumbnails
    imageUrls.forEach((url, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative group';
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Note image ${index + 1}`;
        img.className = 'w-full h-48 object-cover rounded-md cursor-pointer';
        img.addEventListener('click', () => openLightbox(url, note.title, index + 1));
        imgContainer.appendChild(img);
        viewNoteImages.appendChild(imgContainer);
    });
    
    if (note.createdAt) {
        const date = new Date(note.createdAt.toDate());
        viewNoteDate.textContent = `Added on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
    } else {
        viewNoteDate.textContent = '';
    }
    
    // Delete note handler
    deleteNoteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this note?')) {
            deleteNote(note.id);
        }
    };
    
    // Download all images handler
    downloadAllBtn.onclick = async () => {
        try {
            for (let i = 0; i < imageUrls.length; i++) {
                const url = imageUrls[i];
                const response = await fetch(url);
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `${note.title}_image_${i + 1}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
            }
            showToast('All images downloaded successfully', 'success');
        } catch (error) {
            showToast('Error downloading images: ' + error.message, 'error');
        }
    };
    
    viewNoteModal.classList.remove('hidden');
}

// Lightbox modal logic
const imageLightboxModal = document.getElementById('image-lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const downloadLightboxBtn = document.getElementById('download-lightbox-btn');
const closeLightboxBtn = document.getElementById('close-lightbox-btn');
let currentLightboxUrl = '';
let currentLightboxTitle = '';
let currentLightboxIndex = 1;

function openLightbox(url, title, index) {
    currentLightboxUrl = url;
    currentLightboxTitle = title;
    currentLightboxIndex = index;
    lightboxImage.src = url;
    imageLightboxModal.classList.remove('hidden');
}

downloadLightboxBtn.onclick = async () => {
    if (!currentLightboxUrl) return;
    try {
        const response = await fetch(currentLightboxUrl);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${currentLightboxTitle}_image_${currentLightboxIndex}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        showToast('Image downloaded successfully', 'success');
    } catch (error) {
        showToast('Error downloading image: ' + error.message, 'error');
    }
};

closeLightboxBtn.onclick = () => {
    imageLightboxModal.classList.add('hidden');
    lightboxImage.src = '';
    currentLightboxUrl = '';
};

// Delete note
function deleteNote(noteId) {
    const noteRef = db.collection('users').doc(currentUser.uid).collection('notes').doc(noteId);
    
    noteRef.delete()
        .then(() => {
            showToast('Note deleted successfully', 'success');
            closeViewModal();
            loadNotes();
        })
        .catch(error => {
            showToast('Error deleting note: ' + error.message, 'error');
        });
}

// Upload note form setup
const uploadForm = document.getElementById('upload-form');
const uploadArea = document.getElementById('upload-area');

uploadArea.addEventListener('click', () => {
    imageInput.click();
});

uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('border-purple-500');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-purple-500');
});

uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('border-purple-500');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageSelect(e.dataTransfer.files);
        imageInput.files = e.dataTransfer.files;
    }
});

imageInput.addEventListener('change', e => {
    if (e.target.files && e.target.files.length > 0) {
        handleImageSelect(e.target.files);
    }
});

function handleImageSelect(files) {
    imagePreviewContainer.innerHTML = '';
    if (!files.length) {
        imagePreviewContainer.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        return;
    }
    uploadPlaceholder.classList.add('hidden');
    imagePreviewContainer.classList.remove('hidden');
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-full h-32 object-cover rounded mb-2';
            imagePreviewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

// Upload note submission
uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    
    const title = document.getElementById('note-title').value;
    const categoryId = document.getElementById('note-category').value;
    const caption = document.getElementById('note-caption').value;
    const files = imageInput.files;
    
    if (!title || !categoryId || files.length === 0) {
        showToast('Please fill in all fields and select an image', 'error');
        return;
    }
    
    const uploadSpinner = document.getElementById('upload-spinner');
    const submitButton = document.getElementById('submit-upload');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressText = document.getElementById('upload-progress-text');
    
    submitButton.disabled = true;
    uploadSpinner.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    
    try {
        const imageUrls = [];
        const totalFiles = files.length;
        let completedFiles = 0;
        
        for (const file of files) {
            // Convert image to base64
            const base64Image = await convertToBase64(file);
            
            // Upload to ImgBB
            const formData = new FormData();
            formData.append('image', base64Image.split(',')[1]);
            
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                imageUrls.push(data.data.url);
                completedFiles++;
                // Update progress
                const progress = Math.round((completedFiles / totalFiles) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            } else {
                throw new Error('Failed to upload image');
            }
        }
        
        // Save note to Firestore with ImgBB URLs
        await db.collection('users').doc(currentUser.uid).collection('notes').add({
            title: title,
            caption: caption,
            category: categoryId,
            imageUrls: imageUrls,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Notes uploaded successfully', 'success');
        closeUploadModal();
        loadNotes();
    } catch (error) {
        showToast('Error uploading notes: ' + error.message, 'error');
    } finally {
        submitButton.disabled = false;
        uploadSpinner.classList.add('hidden');
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    }
});

// Helper function to convert file to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Category form submission
const categoryForm = document.getElementById('category-form');
categoryForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const categoryName = document.getElementById('category-name').value;
    
    if (!categoryName) {
        showToast('Please enter a category name', 'error');
        return;
    }
    
    db.collection('users').doc(currentUser.uid).collection('categories').add({
        name: categoryName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showToast('Category added successfully', 'success');
        closeCategoryModal();
        loadCategories();
    })
    .catch(error => {
        showToast('Error adding category: ' + error.message, 'error');
    });
});

// UI Helper Functions
function showAuthError(message) {
    authError.textContent = message;
    authError.classList.remove('hidden');
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Modal Controls
uploadNoteBtn.addEventListener('click', openUploadModal);
emptyUploadBtn.addEventListener('click', openUploadModal);
document.getElementById('close-upload-modal').addEventListener('click', closeUploadModal);
document.getElementById('cancel-upload').addEventListener('click', closeUploadModal);
addCategoryBtn.addEventListener('click', openCategoryModal);
document.getElementById('close-category-modal').addEventListener('click', closeCategoryModal);
document.getElementById('cancel-category').addEventListener('click', closeCategoryModal);
document.getElementById('close-view-modal').addEventListener('click', closeViewModal);

function openUploadModal() {
    resetUploadForm();
    uploadModal.classList.remove('hidden');
}

function closeUploadModal() {
    uploadModal.classList.add('hidden');
    resetUploadForm();
}

function resetUploadForm() {
    uploadForm.reset();
    imagePreviewContainer.innerHTML = '';
    imagePreviewContainer.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
}

function openCategoryModal() {
    categoryModal.classList.remove('hidden');
    document.getElementById('category-name').value = '';
}

function closeCategoryModal() {
    categoryModal.classList.add('hidden');
}

function closeViewModal() {
    viewNoteModal.classList.add('hidden');
}

// Responsive Controls
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-collapsed');
    content.classList.toggle('content-expanded');
});

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    // Responsive initialization
    if (window.innerWidth < 768) {
        sidebar.classList.add('sidebar-collapsed');
        content.classList.add('content-expanded');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        sidebar.classList.remove('sidebar-collapsed');
        content.classList.remove('content-expanded');
    }
});

// Delete category
function deleteCategory(categoryId) {
    // First, delete all notes in this category
    db.collection('users').doc(currentUser.uid).collection('notes')
        .where('category', '==', categoryId)
        .get()
        .then(snapshot => {
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            // Then delete the category itself
            return db.collection('users').doc(currentUser.uid)
                .collection('categories').doc(categoryId).delete();
        })
        .then(() => {
            showToast('Category and its notes deleted successfully', 'success');
            // If the deleted category was selected, switch to 'all'
            if (selectedCategory === categoryId) {
                selectedCategory = 'all';
                currentCategory.textContent = 'All Notes';
                document.querySelector('[data-category="all"]').classList.add('active');
            }
            loadCategories();
            loadNotes();
        })
        .catch(error => {
            showToast('Error deleting category: ' + error.message, 'error');
        });
} 