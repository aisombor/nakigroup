/**
 * Naki Group - Careers & Job Application Client Script
 * Connects frontend/careers.html to backend API (http://localhost:5000/api)
 */

(function () {
  'use strict';

  // Auto-detect localhost vs production (Render.com)
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const PRODUCTION_API_URL = 'https://nakigroup-backend.onrender.com/api';
  const API_BASE_URL = isLocal ? 'http://localhost:5000/api' : PRODUCTION_API_URL;
  let cachedJobs = [];

  // DOM Elements
  const jobsContainer = document.getElementById('jobs-container');
  const positionSelect = document.getElementById('applied-position');
  const applyForm = document.getElementById('quick-apply-form');
  const cvFileInput = document.getElementById('apply-cv');
  const cvFileLabel = document.getElementById('apply-cv-label');
  const applyAlert = document.getElementById('apply-alert');
  const submitBtn = document.getElementById('btn-submit-apply');

  // Initialize on document ready
  document.addEventListener('DOMContentLoaded', function () {
    loadJobs();
    setupFileInput();
    setupFormSubmission();
  });

  /**
   * Fetch open jobs from backend API and render
   */
  async function loadJobs() {
    if (!jobsContainer) return;

    // Show loading skeleton / spinner
    jobsContainer.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fa fa-spinner fa-spin fa-2x mb-3" style="color: #0f2b5c;"></i>
        <p>Loading current openings from Naki Group database...</p>
      </div>
    `;

    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        cachedJobs = result.data;
        renderJobs(cachedJobs);
        populatePositionDropdown(cachedJobs);
      } else {
        renderNoJobs();
      }
    } catch (err) {
      console.warn('Could not load jobs from Backend API:', err);
      renderApiError();
    }
  }

  /**
   * Render job list cards
   */
  function renderJobs(jobs) {
    if (jobs.length === 0) {
      renderNoJobs();
      return;
    }

    let html = '';
    jobs.forEach(function (job, index) {
      const delay = 100 + (index * 50);
      const dept = escapeHtml(job.department || 'General');
      const loc = escapeHtml(job.location || 'Phnom Penh');
      const type = escapeHtml(job.job_type || 'Full-Time');
      const title = escapeHtml(job.title);
      const desc = escapeHtml(job.description || '');

      html += `
        <div class="job-card" data-aos="fade-up" data-aos-delay="${delay}">
          <div class="job-info">
            <h3 class="job-title">${title}</h3>
            <div class="job-badges">
              <span class="job-badge"><i class="fa fa-briefcase"></i> ${dept}</span>
              <span class="job-badge"><i class="fa fa-map-marker"></i> ${loc}</span>
              <span class="job-badge badge-type"><i class="fa fa-clock-o"></i> ${type}</span>
            </div>
            <p class="job-desc">${desc}</p>
          </div>
          <div class="job-action">
            <a href="#quick-apply" class="btn btn-primary text-white" onclick="selectJobForApply(${job.id}, '${escapeQuote(title)}')">Apply Now</a>
          </div>
        </div>
      `;
    });

    jobsContainer.innerHTML = html;
  }

  function renderNoJobs() {
    jobsContainer.innerHTML = `
      <div class="text-center py-5 bg-white rounded p-4 border text-muted">
        <i class="fa fa-folder-open-o fa-2x mb-2 text-warning"></i>
        <h5>No Open Positions Currently</h5>
        <p class="mb-0">Please check back soon or submit a spontaneous application below.</p>
      </div>
    `;
    populatePositionDropdown([]);
  }

  function renderApiError() {
    jobsContainer.innerHTML = `
      <div class="text-center py-4 bg-light rounded p-4 border text-muted">
        <i class="fa fa-exclamation-circle text-warning fa-2x mb-2"></i>
        <h5>Connecting to Recruitment Server...</h5>
        <p class="small mb-3">If the server is currently starting up, you can still apply directly using the form below or contact our HR team.</p>
        <button class="btn btn-sm btn-outline-primary" onclick="window.location.reload()"><i class="fa fa-refresh mr-1"></i> Retry</button>
      </div>
    `;
    // Populate dropdown with fallback
    if (positionSelect) {
      positionSelect.innerHTML = `
        <option value="">-- Select a Position --</option>
        <option value="Senior Property Development Manager">Senior Property Development Manager</option>
        <option value="Luxury Hospitality Operations Supervisor">Luxury Hospitality Operations Supervisor</option>
        <option value="Marketing & Brand Communications Executive">Marketing & Brand Communications Executive</option>
        <option value="Other">Other / Spontaneous Application</option>
      `;
    }
  }

  /**
   * Populate dropdown in the apply form
   */
  function populatePositionDropdown(jobs) {
    if (!positionSelect) return;

    let options = '<option value="">-- Select a Position --</option>';
    jobs.forEach(function (job) {
      options += `<option value="${job.id}">${escapeHtml(job.title)} (${escapeHtml(job.department)})</option>`;
    });
    options += '<option value="">Other / Spontaneous Application</option>';
    positionSelect.innerHTML = options;
  }

  /**
   * Helper called by "Apply Now" button on job card
   */
  window.selectJobForApply = function (jobId, jobTitle) {
    if (!positionSelect) return;

    // Try finding option by value (jobId)
    let found = false;
    for (let i = 0; i < positionSelect.options.length; i++) {
      if (positionSelect.options[i].value == jobId) {
        positionSelect.selectedIndex = i;
        found = true;
        break;
      }
    }

    // Smooth scroll to form
    const applySection = document.getElementById('quick-apply');
    if (applySection) {
      applySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * File input change handler (displays chosen filename)
   */
  function setupFileInput() {
    if (!cvFileInput || !cvFileLabel) return;

    cvFileInput.addEventListener('change', function () {
      if (this.files && this.files.length > 0) {
        const file = this.files[0];
        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          showAlert('File size exceeds 5MB limit. Please upload a smaller file.', 'danger');
          this.value = '';
          cvFileLabel.textContent = 'Choose CV file (PDF or DOCX)...';
          return;
        }
        cvFileLabel.textContent = file.name;
      } else {
        cvFileLabel.textContent = 'Choose CV file (PDF or DOCX)...';
      }
    });
  }

  /**
   * Quick Apply Form Submission
   */
  function setupFormSubmission() {
    if (!applyForm) return;

    applyForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const fullName = document.getElementById('apply-name').value.trim();
      const phone = document.getElementById('apply-phone').value.trim();
      const email = document.getElementById('apply-email').value.trim();
      const jobId = positionSelect ? positionSelect.value : '';
      const coverLetter = document.getElementById('apply-message') ? document.getElementById('apply-message').value.trim() : '';
      const cvFile = cvFileInput ? cvFileInput.files[0] : null;

      if (!fullName || !phone || !email) {
        showAlert('Please fill in all required fields (Name, Phone, Email).', 'warning');
        return;
      }

      if (!cvFile) {
        showAlert('Please choose your CV file (.pdf, .doc, or .docx) to upload.', 'warning');
        return;
      }

      // Prepare FormData
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('phone', phone);
      formData.append('email', email);
      if (jobId) {
        formData.append('job_id', jobId);
      }
      if (coverLetter) {
        formData.append('cover_letter', coverLetter);
      }
      formData.append('cv', cvFile);

      // Disable button & show spinner
      setSubmittingState(true);
      hideAlert();

      try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showAlert(
            '<strong>Application Submitted Successfully!</strong><br>Thank you, ' +
              escapeHtml(fullName) +
              '. Our HR team has received your application and will review your CV.',
            'success'
          );
          applyForm.reset();
          if (cvFileLabel) {
            cvFileLabel.textContent = 'Choose CV file (PDF or DOCX)...';
          }
        } else {
          showAlert(result.message || 'Failed to submit application. Please check your inputs.', 'danger');
        }
      } catch (err) {
        console.error('Submission error:', err);
        showAlert(
          'Network error: Unable to connect to server. Please try again or email your CV directly to <a href="mailto:hr@nakigroup.com" class="alert-link">hr@nakigroup.com</a>.',
          'danger'
        );
      } finally {
        setSubmittingState(false);
      }
    });
  }

  function setSubmittingState(isSubmitting) {
    if (!submitBtn) return;
    const textSpan = submitBtn.querySelector('.btn-text');
    const spinSpan = submitBtn.querySelector('.btn-spinner');

    if (isSubmitting) {
      submitBtn.disabled = true;
      if (textSpan) textSpan.style.display = 'none';
      if (spinSpan) spinSpan.style.display = 'inline-block';
    } else {
      submitBtn.disabled = false;
      if (textSpan) textSpan.style.display = 'inline-block';
      if (spinSpan) spinSpan.style.display = 'none';
    }
  }

  function showAlert(messageHtml, type) {
    if (!applyAlert) return;
    applyAlert.className = `alert alert-${type} alert-dismissible fade show`;
    applyAlert.innerHTML = `
      ${messageHtml}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    `;
    applyAlert.style.display = 'block';
    applyAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    if (!applyAlert) return;
    applyAlert.style.display = 'none';
    applyAlert.innerHTML = '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeQuote(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
  }
})();

