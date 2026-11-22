'use strict';

Object.assign(SystemController.prototype, {
  /* -------------------- Authentication & Navigation -------------------- */

  loginWithEmail(email, password = null, bypassPassword = false) {
    const user = this.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      this.showToast('No account found with that university email.', 'error');
      return false;
    }
    if (!bypassPassword && !user.login(password)) {
      this.showToast('Incorrect password. Please try again.', 'error');
      return false;
    }

    this.currentUser = user;
    this.storage.setSessionUserId(user.userId);
    this.currentView = user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
    this.showToast(`Welcome back, ${user.name}!`, 'success');
    this.renderApp();
    return true;
  },


  registerNewStudent({ name, studentId, email, password, level, major }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStuId = studentId.trim().toUpperCase();
    const numericLevel = Number(level);

    if (this.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      this.showToast('An account with this university email already exists.', 'error');
      return false;
    }
    if (this.users.some((u) => u.studentId && u.studentId.toUpperCase() === normalizedStuId)) {
      this.showToast('This Student ID is already registered in the system.', 'error');
      return false;
    }

    // Enforce Level 1-2 => "General", Level 3-4 => required Specialization Track
    let assignedMajor = 'General';
    if (numericLevel >= 3) {
      if (!major || !['CS', 'AI', 'IS', 'IT'].includes(major)) {
        this.showToast('Please select a valid Specialization Track (CS, AI, IS, or IT) for Level 3–4.', 'error');
        return false;
      }
      assignedMajor = major;
    }

    const newStudent = new Student({
      userId: `USR-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      studentId: normalizedStuId,
      level: numericLevel,
      major: assignedMajor,
      maxCredits: 18,
      completedCourses: [],
    });

    const newSchedule = new Schedule({
      scheduleId: `SCH-${normalizedStuId}`,
      studentId: normalizedStuId,
      semester: 'Fall 2026',
      registeredCourses: [],
      totalCredits: 0,
    });

    this.users.push(newStudent);
    this.schedules.push(newSchedule);
    this.persistAll();

    this.currentUser = newStudent;
    this.storage.setSessionUserId(newStudent.userId);
    this.currentView = 'student-dashboard';
    this.showToast(`Account created! Assigned to Level ${numericLevel} (${assignedMajor}).`, 'success');
    this.renderApp();
    return true;
  },


  logout() {
    if (this.currentUser) {
      this.currentUser.logout();
    }
    this.currentUser = null;
    this.storage.setSessionUserId(null);
    this.currentView = 'auth';
    this.selectedCourseId = null;
    document.getElementById('mobile-nav-drawer').classList.add('hidden');
    this.showToast('You have been logged out securely.', 'info');
    this.renderApp();
  },


  navigateTo(viewName, courseId = null) {
    if (!this.currentUser) {
      this.currentView = 'auth';
      this.renderApp();
      return;
    }

    // Guard student-only views from admin and vice-versa
    if (this.currentUser.role === 'admin' && ['student-dashboard', 'schedule'].includes(viewName)) {
      viewName = 'admin-dashboard';
    }
    if (this.currentUser.role === 'student' && viewName === 'admin-dashboard') {
      viewName = 'student-dashboard';
    }

    if (viewName === 'dashboard') {
      viewName = this.currentUser.role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
    }

    if (viewName === 'course-details' && courseId) {
      this.selectedCourseId = courseId;
    }

    this.currentView = viewName;
    document.getElementById('mobile-nav-drawer').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderApp();
  },
});
