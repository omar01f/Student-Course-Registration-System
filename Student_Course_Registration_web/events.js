'use strict';

Object.assign(SystemController.prototype, {
  /* -------------------- Event Listeners & Delegation -------------------- */

  bindEvents() {
    // 1. Auth Tab Toggles
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.className = 'flex-1 py-2.5 text-sm font-bold rounded-xl bg-white text-[#1E3A8A] shadow-xs transition cursor-pointer';
      tabSignupBtn.className = 'flex-1 py-2.5 text-sm font-semibold rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer';
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    });

    tabSignupBtn.addEventListener('click', () => {
      tabSignupBtn.className = 'flex-1 py-2.5 text-sm font-bold rounded-xl bg-white text-[#1E3A8A] shadow-xs transition cursor-pointer';
      tabLoginBtn.className = 'flex-1 py-2.5 text-sm font-semibold rounded-xl text-slate-600 hover:text-slate-900 transition cursor-pointer';
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });

    // 2. Dynamic Level -> Specialization Track selector on Sign-Up
    const signupLevelSelect = document.getElementById('signup-level');
    const signupMajorWrapper = document.getElementById('signup-major-wrapper');
    const signupGeneralBox = document.getElementById('signup-general-badge-box');
    const signupMajorSelect = document.getElementById('signup-major');

    signupLevelSelect.addEventListener('change', () => {
      const lvl = Number(signupLevelSelect.value);
      if (lvl >= 3) {
        signupGeneralBox.classList.add('hidden');
        signupMajorWrapper.classList.remove('hidden');
        signupMajorSelect.required = true;
      } else {
        signupMajorWrapper.classList.add('hidden');
        signupGeneralBox.classList.remove('hidden');
        signupMajorSelect.required = false;
        signupMajorSelect.value = '';
      }
    });

    // 3. Login Form Submit
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      this.loginWithEmail(email, password, false);
    });

    // 4. Sign-Up Form Submit
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.registerNewStudent({
        name: document.getElementById('signup-name').value,
        studentId: document.getElementById('signup-studentId').value,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
        level: document.getElementById('signup-level').value,
        major: document.getElementById('signup-major').value,
      });
    });

    // 5. Demo Login Buttons
    document.querySelectorAll('.demo-login-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-demo-email');
        this.loginWithEmail(email, null, true);
      });
    });

    // 6. Logout & Reset Demo Data Buttons (Desktop & Mobile)
    document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    document.getElementById('mobile-logout-btn').addEventListener('click', () => this.logout());

    const handleResetDemo = async () => {
      const ok = await this.showConfirm({
        title: 'Reset Demo Data?',
        message: 'This will restore the default 14 courses, seat counts, schedules, and 3 demo accounts to their initial state.',
        confirmLabel: 'Reset Data',
        isDanger: false,
      });
      if (!ok) return;

      this.storage.initSeedData(true);
      this.users = this.storage.loadUsers();
      this.courses = this.storage.loadCourses();
      this.schedules = this.storage.loadSchedules();
      this.registrations = this.storage.loadRegistrations();

      // Re-bind currentUser to refreshed instance if still present
      if (this.currentUser) {
        const refreshedUser = this.users.find((u) => u.email === this.currentUser.email);
        if (refreshedUser) {
          this.currentUser = refreshedUser;
          this.storage.setSessionUserId(refreshedUser.userId);
        } else {
          this.logout();
          return;
        }
      }
      this.showToast('Demo data has been reset to factory defaults.', 'info');
      this.renderApp();
    };

    document.getElementById('reset-demo-btn').addEventListener('click', handleResetDemo);
    document.getElementById('mobile-reset-btn').addEventListener('click', handleResetDemo);

    // Mobile Drawer Toggle
    document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
      document.getElementById('mobile-nav-drawer').classList.toggle('hidden');
    });

    // 7. Course Catalog Filters
    document.getElementById('filter-search').addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.renderCourseCatalog();
    });
    document.getElementById('filter-level').addEventListener('change', (e) => {
      this.filters.level = e.target.value;
      this.renderCourseCatalog();
    });
    document.getElementById('filter-track').addEventListener('change', (e) => {
      this.filters.track = e.target.value;
      this.renderCourseCatalog();
    });
    document.getElementById('filter-availability').addEventListener('change', (e) => {
      this.filters.availability = e.target.value;
      this.renderCourseCatalog();
    });
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
      this.filters = { search: '', level: 'ALL', track: 'ALL', availability: 'ALL' };
      document.getElementById('filter-search').value = '';
      document.getElementById('filter-level').value = 'ALL';
      document.getElementById('filter-track').value = 'ALL';
      document.getElementById('filter-availability').value = 'ALL';
      this.renderCourseCatalog();
    });

    // 8. Print Schedule Button
    document.getElementById('print-schedule-btn').addEventListener('click', () => {
      if (this.currentUser && this.currentUser.role === 'student') {
        const sched = this.getScheduleForStudent(this.currentUser.studentId);
        sched.exportSchedule();
      }
    });

    // 9. Admin Course Modal & Search
    document.getElementById('admin-open-add-course-btn').addEventListener('click', () => {
      this.openCourseModal('add');
    });
    document.getElementById('close-course-modal-btn').addEventListener('click', () => this.closeCourseModal());
    document.getElementById('cancel-course-modal-btn').addEventListener('click', () => this.closeCourseModal());
    document.getElementById('cf-level').addEventListener('change', () => this.syncCourseModalTrackState());

    document.getElementById('course-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const mode = document.getElementById('course-form-mode').value;
      const courseId = document.getElementById('cf-courseId').value.trim().toUpperCase();
      const day = document.getElementById('cf-day').value;
      const slot = document.getElementById('cf-slot').value;
      const level = Number(document.getElementById('cf-level').value);

      const payload = {
        courseId,
        title: document.getElementById('cf-title').value.trim(),
        description: document.getElementById('cf-description').value.trim(),
        instructor: document.getElementById('cf-instructor').value.trim(),
        level,
        department: level <= 2 ? 'General' : document.getElementById('cf-department').value,
        credits: Number(document.getElementById('cf-credits').value),
        maxCapacity: Number(document.getElementById('cf-maxCapacity').value),
        timeSlot: `${day} ${slot}`,
        prerequisiteId: document.getElementById('cf-prerequisiteId').value || null,
      };

      let success = false;
      if (mode === 'edit') {
        success = this.currentUser.updateCourse(courseId, payload, this);
      } else {
        success = this.currentUser.addCourse(payload, this);
      }

      if (success) {
        this.closeCourseModal();
      }
    });

    document.getElementById('admin-course-search').addEventListener('input', () => {
      this.renderAdminDashboard();
    });

    // 10. Global Event Delegation for Dynamic Buttons
    document.addEventListener('click', async (e) => {
      // Navigation triggers
      const navTarget = e.target.closest('[data-nav]');
      if (navTarget) {
        const view = navTarget.getAttribute('data-nav');
        this.navigateTo(view);
        return;
      }

      // Student / Catalog Actions
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.getAttribute('data-action');
        const courseId = actionBtn.getAttribute('data-course-id');

        if (action === 'view-details') {
          this.navigateTo('course-details', courseId);
        } else if (action === 'register-course' && this.currentUser?.role === 'student') {
          this.currentUser.registerCourse(courseId, this);
        } else if (action === 'drop-course' && this.currentUser?.role === 'student') {
          const course = this.getCourseById(courseId);
          const ok = await this.showConfirm({
            title: `Drop ${courseId}?`,
            message: `Are you sure you want to drop ${courseId} (${course ? course.title : ''}) from your Fall 2026 schedule?`,
            confirmLabel: 'Drop Course',
            isDanger: true,
          });
          if (ok) {
            this.currentUser.dropCourse(courseId, this);
          }
        }
        return;
      }

      // Admin Edit Course
      const editCourseBtn = e.target.closest('[data-admin-edit-course]');
      if (editCourseBtn && this.currentUser?.role === 'admin') {
        const cid = editCourseBtn.getAttribute('data-admin-edit-course');
        this.openCourseModal('edit', cid);
        return;
      }

      // Admin Delete Course
      const deleteCourseBtn = e.target.closest('[data-admin-delete-course]');
      if (deleteCourseBtn && this.currentUser?.role === 'admin') {
        const cid = deleteCourseBtn.getAttribute('data-admin-delete-course');
        const ok = await this.showConfirm({
          title: `Delete Course ${cid}?`,
          message: `This will permanently delete ${cid} from the catalog and remove it from any enrolled student schedules.`,
          confirmLabel: 'Delete Course',
          isDanger: true,
        });
        if (ok) {
          this.currentUser.deleteCourse(cid, this);
        }
        return;
      }

      // Admin Drop Student Enrollment
      const adminDropBtn = e.target.closest('[data-admin-drop-student]');
      if (adminDropBtn && this.currentUser?.role === 'admin') {
        const studentId = adminDropBtn.getAttribute('data-admin-drop-student');
        const courseId = adminDropBtn.getAttribute('data-admin-drop-course');
        const ok = await this.showConfirm({
          title: 'Drop Student Enrollment?',
          message: `Remove ${courseId} from student ${studentId}'s schedule and release 1 seat?`,
          confirmLabel: 'Drop Enrollment',
          isDanger: true,
        });
        if (ok) {
          this.currentUser.manageStudentRecord(studentId, courseId, this);
        }
      }
    });
  },
});
