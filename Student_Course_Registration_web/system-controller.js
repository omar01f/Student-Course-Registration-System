'use strict';

class SystemController {
  constructor() {
    this.storage = new StorageManager();
    this.storage.initSeedData(false);

    this.users = this.storage.loadUsers();
    this.courses = this.storage.loadCourses();
    this.schedules = this.storage.loadSchedules();
    this.registrations = this.storage.loadRegistrations();

    this.currentUser = null;
    this.currentView = 'auth';
    this.selectedCourseId = null;

    this.filters = {
      search: '',
      level: 'ALL',
      track: 'ALL',
      availability: 'ALL',
    };

    this.restoreSession();
    this.bindEvents();
    this.renderApp();
  }


  /* -------------------- Persistence & State Helpers -------------------- */

  persistAll() {
    this.storage.saveUsers(this.users);
    this.storage.saveCourses(this.courses);
    this.storage.saveSchedules(this.schedules);
    this.storage.saveRegistrations(this.registrations);
  }


  getCoursesMap() {
    const map = new Map();
    this.courses.forEach((c) => map.set(c.courseId, c));
    return map;
  }


  getCourseById(courseId) {
    return this.courses.find((c) => c.courseId === courseId) || null;
  }


  getScheduleForStudent(studentId) {
    let schedule = this.schedules.find((s) => s.studentId === studentId);
    if (!schedule) {
      schedule = new Schedule({
        scheduleId: `SCH-${studentId}`,
        studentId,
        semester: 'Fall 2026',
        registeredCourses: [],
        totalCredits: 0,
      });
      this.schedules.push(schedule);
      this.storage.saveSchedules(this.schedules);
    }
    // Recalculate totalCredits dynamically to guarantee strict consistency
    const coursesMap = this.getCoursesMap();
    schedule.registeredCourses = [...new Set(schedule.registeredCourses)].filter((cid) => coursesMap.has(cid));
    schedule.totalCredits = schedule.registeredCourses.reduce((sum, cid) => {
      const c = coursesMap.get(cid);
      return sum + (c ? c.credits : 0);
    }, 0);
    return schedule;
  }


  restoreSession() {
    const savedUserId = this.storage.getSessionUserId();
    if (!savedUserId) {
      this.currentUser = null;
      this.currentView = 'auth';
      return;
    }
    const found = this.users.find((u) => u.userId === savedUserId);
    if (found) {
      this.currentUser = found;
      this.currentView = found.role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
    } else {
      this.storage.setSessionUserId(null);
      this.currentUser = null;
      this.currentView = 'auth';
    }
  }

}
