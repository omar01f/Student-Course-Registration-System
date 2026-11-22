'use strict';

Object.assign(SystemController.prototype, {
  /* -------------------- Master Rendering Pipeline -------------------- */

  renderApp() {
    const navbar = document.getElementById('top-navbar');
    const views = [
      'view-auth',
      'view-student-dashboard',
      'view-courses',
      'view-course-details',
      'view-schedule',
      'view-admin-dashboard',
    ];

    views.forEach((id) => document.getElementById(id).classList.add('hidden'));

    if (!this.currentUser || this.currentView === 'auth') {
      navbar.classList.add('hidden');
      document.getElementById('view-auth').classList.remove('hidden');
      return;
    }

    navbar.classList.remove('hidden');
    this.renderNavbar();

    switch (this.currentView) {
      case 'student-dashboard':
        document.getElementById('view-student-dashboard').classList.remove('hidden');
        this.renderStudentDashboard();
        break;
      case 'courses':
        document.getElementById('view-courses').classList.remove('hidden');
        this.renderCourseCatalog();
        break;
      case 'course-details':
        document.getElementById('view-course-details').classList.remove('hidden');
        this.renderCourseDetails();
        break;
      case 'schedule':
        document.getElementById('view-schedule').classList.remove('hidden');
        this.renderScheduleView();
        break;
      case 'admin-dashboard':
        document.getElementById('view-admin-dashboard').classList.remove('hidden');
        this.renderAdminDashboard();
        break;
      default:
        document.getElementById('view-student-dashboard').classList.remove('hidden');
        this.renderStudentDashboard();
    }
  },


  renderNavbar() {
    const user = this.currentUser;
    const isStudent = user.role === 'student';

    document.getElementById('nav-user-name').textContent = user.name;
    document.getElementById('mobile-user-name').textContent = user.name;

    const levelBadgeText = isStudent ? `Level ${user.level}` : 'Admin';
    const majorBadgeText = isStudent ? user.major : 'Registrar';

    document.getElementById('nav-level-badge').textContent = levelBadgeText;
    document.getElementById('nav-major-badge').textContent = majorBadgeText;
    document.getElementById('mobile-level-badge').textContent = levelBadgeText;
    document.getElementById('mobile-major-badge').textContent = majorBadgeText;

    const navItems = isStudent
      ? [
          { id: 'student-dashboard', label: 'Dashboard' },
          { id: 'courses', label: 'Course Catalog' },
          { id: 'schedule', label: 'My Schedule' },
        ]
      : [
          { id: 'admin-dashboard', label: 'Admin Dashboard' },
          { id: 'courses', label: 'Course Catalog' },
        ];

    const desktopLinksEl = document.getElementById('desktop-nav-links');
    const mobileLinksEl = document.getElementById('mobile-nav-links');

    desktopLinksEl.innerHTML = navItems
      .map((item) => {
        const active =
          this.currentView === item.id || (this.currentView === 'course-details' && item.id === 'courses');
        const cls = active
          ? 'bg-white text-[#1E3A8A] font-bold shadow-2xs'
          : 'text-blue-100 hover:bg-white/10 hover:text-white font-medium';
        return `<button type="button" data-nav="${item.id}" class="px-3.5 py-2 rounded-xl text-sm transition cursor-pointer">${item.label}</button>`.replace(
          'class="',
          `class="${cls} `
        );
      })
      .join('');

    mobileLinksEl.innerHTML = navItems
      .map((item) => {
        const active =
          this.currentView === item.id || (this.currentView === 'course-details' && item.id === 'courses');
        const cls = active ? 'bg-white text-[#1E3A8A] font-bold' : 'text-blue-100 hover:bg-white/10 font-medium';
        return `<button type="button" data-nav="${item.id}" class="w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition cursor-pointer ${cls}">${item.label}</button>`;
      })
      .join('');
  },
});
