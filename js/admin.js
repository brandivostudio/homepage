/* ==========================================================================
   BRANDIVO STUDIO ADMIN PANEL — JavaScript
   Complete CMS functionality with localStorage
   ========================================================================== */

// Check authentication
function checkAuth() {
  if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin.html';
    return false;
  }
  return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  // Display admin email
  const adminEmail = sessionStorage.getItem('adminEmail');
  document.getElementById('adminEmailDisplay').textContent = adminEmail;

  // Initialize data structures if they don't exist
  if (!localStorage.getItem('brandivo_blogs')) {
    localStorage.setItem('brandivo_blogs', JSON.stringify([]));
  }
  if (!localStorage.getItem('brandivo_submissions')) {
    localStorage.setItem('brandivo_submissions', JSON.stringify([]));
  }
  if (!localStorage.getItem('brandivo_images')) {
    localStorage.setItem('brandivo_images', JSON.stringify([]));
  }
  if (!localStorage.getItem('brandivo_content')) {
    localStorage.setItem('brandivo_content', JSON.stringify({
      heroHeadline: 'We Turn Attention Into Growth.',
      heroSubheadline: 'Data-driven digital marketing strategies designed to attract the right audience, generate qualified leads, and grow your business.',
      heroPrimaryBtn: 'Get a Free Strategy Call',
      contactEmail: 'amankumar991855@gmail.com',
      contactPhone: '+91 9235088662',
      contactAddress: 'Sector-52, Noida, Uttar Pradesh, 201301'
    }));
  }

  // Load dashboard
  loadDashboard();
  loadBlogs();
  loadSubmissions();
  loadImages();
  loadContent();

  // Navigation
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const section = this.dataset.section;
      switchSection(section);
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.clear();
      window.location.href = 'admin.html';
    }
  });

  // Blog Management
  document.getElementById('addBlogBtn').addEventListener('click', showBlogForm);
  document.getElementById('cancelBlogBtn').addEventListener('click', hideBlogForm);
  document.getElementById('blogPostForm').addEventListener('submit', saveBlog);

  // Image Upload
  document.getElementById('uploadArea').addEventListener('click', () => {
    document.getElementById('imageUpload').click();
  });
  document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

  // Content Management
  document.getElementById('saveContentBtn').addEventListener('click', saveContent);

  // Data Management
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  document.getElementById('importDataBtn').addEventListener('click', () => {
    document.getElementById('importDataFile').click();
  });
  document.getElementById('importDataFile').addEventListener('change', importData);
  document.getElementById('clearAllDataBtn').addEventListener('click', clearAllData);
});

// Section Switching
function switchSection(section) {
  // Update navigation
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === section) {
      item.classList.add('active');
    }
  });

  // Update content sections
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById(`${section}-section`).classList.add('active');

  // Update page title
  const titles = {
    'dashboard': 'Dashboard',
    'blogs': 'Manage Blogs',
    'form-submissions': 'Form Submissions',
    'images': 'Image Gallery',
    'content': 'Edit Content',
    'settings': 'Settings'
  };
  document.getElementById('pageTitle').textContent = titles[section];
}

// Dashboard Functions
function loadDashboard() {
  const blogs = JSON.parse(localStorage.getItem('brandivo_blogs') || '[]');
  const submissions = JSON.parse(localStorage.getItem('brandivo_submissions') || '[]');
  const images = JSON.parse(localStorage.getItem('brandivo_images') || '[]');

  document.getElementById('totalBlogs').textContent = blogs.length;
  document.getElementById('totalSubmissions').textContent = submissions.length;
  document.getElementById('totalImages').textContent = images.length;

  // Last login
  const loginTime = sessionStorage.getItem('loginTime');
  if (loginTime) {
    const date = new Date(loginTime);
    document.getElementById('lastLogin').textContent = date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  // Recent activity
  loadRecentActivity();
}

function loadRecentActivity() {
  const activities = JSON.parse(localStorage.getItem('brandivo_activity') || '[]');
  const tbody = document.getElementById('recentActivity');

  if (activities.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <i class="fa-solid fa-chart-line"></i>
          <p>No recent activity</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = activities.slice(0, 10).map(activity => `
    <tr>
      <td>${activity.action}</td>
      <td>${new Date(activity.timestamp).toLocaleString('en-IN')}</td>
      <td><span style="color: var(--up);">✓ Completed</span></td>
    </tr>
  `).join('');
}

function addActivity(action) {
  const activities = JSON.parse(localStorage.getItem('brandivo_activity') || '[]');
  activities.unshift({
    action,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('brandivo_activity', JSON.stringify(activities.slice(0, 50)));
  loadRecentActivity();
}

// Blog Management Functions
function showBlogForm() {
  document.getElementById('blogForm').style.display = 'block';
  document.getElementById('blogsList').style.display = 'none';
  document.getElementById('blogPostForm').reset();
  document.getElementById('blogPostForm').dataset.editId = '';
}

function hideBlogForm() {
  document.getElementById('blogForm').style.display = 'none';
  document.getElementById('blogsList').style.display = 'block';
}

function saveBlog(e) {
  e.preventDefault();

  const blogs = JSON.parse(localStorage.getItem('brandivo_blogs') || '[]');
  const editId = document.getElementById('blogPostForm').dataset.editId;

  const blog = {
    id: editId || Date.now().toString(),
    title: document.getElementById('blogTitle').value,
    author: document.getElementById('blogAuthor').value,
    category: document.getElementById('blogCategory').value,
    image: document.getElementById('blogImage').value,
    excerpt: document.getElementById('blogExcerpt').value,
    content: document.getElementById('blogContent').value,
    date: editId ? blogs.find(b => b.id === editId).date : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (editId) {
    const index = blogs.findIndex(b => b.id === editId);
    blogs[index] = blog;
    addActivity(`Updated blog: ${blog.title}`);
  } else {
    blogs.unshift(blog);
    addActivity(`Created new blog: ${blog.title}`);
  }

  localStorage.setItem('brandivo_blogs', JSON.stringify(blogs));

  // Show success message
  const successMsg = document.getElementById('blogSuccessMsg');
  successMsg.classList.add('show');
  setTimeout(() => successMsg.classList.remove('show'), 3000);

  hideBlogForm();
  loadBlogs();
  loadDashboard();
}

function loadBlogs() {
  const blogs = JSON.parse(localStorage.getItem('brandivo_blogs') || '[]');
  const tbody = document.getElementById('blogsTableBody');

  if (blogs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <i class="fa-solid fa-blog"></i>
          <p>No blogs yet. Click "Add New Blog" to create your first post.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = blogs.map(blog => `
    <tr>
      <td style="color: var(--paper); font-weight: 600;">${blog.title}</td>
      <td>${blog.author}</td>
      <td>${blog.category}</td>
      <td>${new Date(blog.date).toLocaleDateString('en-IN')}</td>
      <td>
        <button class="btn btn-ghost btn-icon" onclick="editBlog('${blog.id}')" style="padding: 8px 12px; font-size: 0.85rem;">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-danger btn-icon" onclick="deleteBlog('${blog.id}')" style="padding: 8px 12px; font-size: 0.85rem;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function editBlog(id) {
  const blogs = JSON.parse(localStorage.getItem('brandivo_blogs') || '[]');
  const blog = blogs.find(b => b.id === id);

  if (!blog) return;

  document.getElementById('blogTitle').value = blog.title;
  document.getElementById('blogAuthor').value = blog.author;
  document.getElementById('blogCategory').value = blog.category;
  document.getElementById('blogImage').value = blog.image || '';
  document.getElementById('blogExcerpt').value = blog.excerpt;
  document.getElementById('blogContent').value = blog.content;
  document.getElementById('blogPostForm').dataset.editId = id;

  showBlogForm();
}

function deleteBlog(id) {
  if (!confirm('Are you sure you want to delete this blog?')) return;

  const blogs = JSON.parse(localStorage.getItem('brandivo_blogs') || '[]');
  const blog = blogs.find(b => b.id === id);
  const filtered = blogs.filter(b => b.id !== id);

  localStorage.setItem('brandivo_blogs', JSON.stringify(filtered));
  addActivity(`Deleted blog: ${blog.title}`);

  loadBlogs();
  loadDashboard();
}

// Form Submissions Functions
function loadSubmissions() {
  const submissions = JSON.parse(localStorage.getItem('brandivo_submissions') || '[]');
  const tbody = document.getElementById('submissionsTableBody');

  if (submissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="fa-solid fa-inbox"></i>
          <p>No form submissions yet.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = submissions.map(sub => `
    <tr>
      <td>${new Date(sub.date).toLocaleDateString('en-IN')}</td>
      <td style="color: var(--paper); font-weight: 600;">${sub.name}</td>
      <td>${sub.email}</td>
      <td>${sub.phone || 'N/A'}</td>
      <td>${sub.service}</td>
      <td>
        <button class="btn btn-primary btn-icon" onclick="viewSubmission('${sub.id}')" style="padding: 8px 12px; font-size: 0.85rem;">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button class="btn btn-danger btn-icon" onclick="deleteSubmission('${sub.id}')" style="padding: 8px 12px; font-size: 0.85rem;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function viewSubmission(id) {
  const submissions = JSON.parse(localStorage.getItem('brandivo_submissions') || '[]');
  const sub = submissions.find(s => s.id === id);

  if (!sub) return;

  alert(`
Form Submission Details
━━━━━━━━━━━━━━━━━━━━

Name: ${sub.name}
Email: ${sub.email}
Phone: ${sub.phone || 'Not provided'}
Company: ${sub.company || 'Not provided'}
Service: ${sub.service}
Budget: ${sub.budget || 'Not specified'}

Message:
${sub.message}

Submitted: ${new Date(sub.date).toLocaleString('en-IN')}
  `);
}

function deleteSubmission(id) {
  if (!confirm('Are you sure you want to delete this submission?')) return;

  const submissions = JSON.parse(localStorage.getItem('brandivo_submissions') || '[]');
  const filtered = submissions.filter(s => s.id !== id);

  localStorage.setItem('brandivo_submissions', JSON.stringify(filtered));
  addActivity('Deleted a form submission');

  loadSubmissions();
  loadDashboard();
}

// Image Management Functions
function handleImageUpload(e) {
  const files = e.target.files;
  if (!files.length) return;

  Array.from(files).forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum size is 5MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      const images = JSON.parse(localStorage.getItem('brandivo_images') || '[]');
      images.unshift({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        data: event.target.result,
        uploadedAt: new Date().toISOString()
      });

      localStorage.setItem('brandivo_images', JSON.stringify(images));
      addActivity(`Uploaded image: ${file.name}`);

      loadImages();
      loadDashboard();
    };
    reader.readAsDataURL(file);
  });

  e.target.value = '';
}

function loadImages() {
  const images = JSON.parse(localStorage.getItem('brandivo_images') || '[]');
  const gallery = document.getElementById('imageGallery');

  if (images.length === 0) {
    gallery.innerHTML = '<p style="color: var(--slate); text-align: center; padding: 40px;">No images uploaded yet.</p>';
    return;
  }

  gallery.innerHTML = images.map(img => `
    <div class="image-preview-item">
      <img src="${img.data}" alt="${img.name}" title="${img.name}">
      <button class="delete-btn" onclick="deleteImage('${img.id}')">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

function deleteImage(id) {
  if (!confirm('Are you sure you want to delete this image?')) return;

  const images = JSON.parse(localStorage.getItem('brandivo_images') || '[]');
  const filtered = images.filter(img => img.id !== id);

  localStorage.setItem('brandivo_images', JSON.stringify(filtered));
  addActivity('Deleted an image');

  loadImages();
  loadDashboard();
}

// Content Management Functions
function loadContent() {
  const content = JSON.parse(localStorage.getItem('brandivo_content') || '{}');

  document.getElementById('heroHeadline').value = content.heroHeadline || '';
  document.getElementById('heroSubheadline').value = content.heroSubheadline || '';
  document.getElementById('heroPrimaryBtn').value = content.heroPrimaryBtn || '';
  document.getElementById('contactEmail').value = content.contactEmail || '';
  document.getElementById('contactPhone').value = content.contactPhone || '';
  document.getElementById('contactAddress').value = content.contactAddress || '';
}

function saveContent() {
  const content = {
    heroHeadline: document.getElementById('heroHeadline').value,
    heroSubheadline: document.getElementById('heroSubheadline').value,
    heroPrimaryBtn: document.getElementById('heroPrimaryBtn').value,
    contactEmail: document.getElementById('contactEmail').value,
    contactPhone: document.getElementById('contactPhone').value,
    contactAddress: document.getElementById('contactAddress').value
  };

  localStorage.setItem('brandivo_content', JSON.stringify(content));
  addActivity('Updated website content');

  const successMsg = document.getElementById('contentSuccessMsg');
  successMsg.classList.add('show');
  setTimeout(() => successMsg.classList.remove('show'), 3000);
}

// Data Management Functions
function exportData() {
  const data = {
    blogs: JSON.parse(localStorage.getItem('brandivo_blogs') || '[]'),
    submissions: JSON.parse(localStorage.getItem('brandivo_submissions') || '[]'),
    images: JSON.parse(localStorage.getItem('brandivo_images') || '[]'),
    content: JSON.parse(localStorage.getItem('brandivo_content') || '{}'),
    activity: JSON.parse(localStorage.getItem('brandivo_activity') || '[]'),
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brandivo-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  addActivity('Exported all data');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);

      if (confirm('This will replace all existing data. Are you sure?')) {
        localStorage.setItem('brandivo_blogs', JSON.stringify(data.blogs || []));
        localStorage.setItem('brandivo_submissions', JSON.stringify(data.submissions || []));
        localStorage.setItem('brandivo_images', JSON.stringify(data.images || []));
        localStorage.setItem('brandivo_content', JSON.stringify(data.content || {}));
        localStorage.setItem('brandivo_activity', JSON.stringify(data.activity || []));

        addActivity('Imported data from backup');
        alert('Data imported successfully!');

        // Reload all sections
        loadDashboard();
        loadBlogs();
        loadSubmissions();
        loadImages();
        loadContent();
      }
    } catch (error) {
      alert('Error importing data. Please check the file format.');
      console.error(error);
    }
  };
  reader.readAsText(file);

  e.target.value = '';
}

function clearAllData() {
  const confirmation = prompt('Type "DELETE ALL" to confirm clearing all data:');

  if (confirmation === 'DELETE ALL') {
    localStorage.removeItem('brandivo_blogs');
    localStorage.removeItem('brandivo_submissions');
    localStorage.removeItem('brandivo_images');
    localStorage.removeItem('brandivo_content');
    localStorage.removeItem('brandivo_activity');

    alert('All data has been cleared.');
    location.reload();
  }
}

// Make functions global for inline onclick handlers
window.editBlog = editBlog;
window.deleteBlog = deleteBlog;
window.viewSubmission = viewSubmission;
window.deleteSubmission = deleteSubmission;
window.deleteImage = deleteImage;
