'use strict';

Object.assign(SystemController.prototype, {
  /* -------------------- Student Registration & Drop Logic -------------------- */

  handleStudentRegistration(studentId, courseId) {
    const student = this.users.find((u) => u.role === 'student' && u.studentId === studentId);
    const course = this.getCourseById(courseId);
    const schedule = this.getScheduleForStudent(studentId);
    const coursesMap = this.getCoursesMap();

    const registration = new Registration({
      studentId,
      courseId,
    });

    const validation = registration.validateConstraints(student, course, schedule, coursesMap);
    if (!validation.valid) {
      this.showToast(validation.reason, 'error');
      return false;
    }

    const confirmed = registration.confirmRegistration(course, schedule);
    if (confirmed) {
      this.registrations.push(registration);
      this.persistAll();
      this.showToast(
        `Successfully registered for ${course.courseId}: ${course.title} (${course.credits} Credits).`,
        'success'
      );
      this.renderApp();
      return true;
    }

    this.showToast('Unable to confirm registration due to a duplicate conflict.', 'error');
    return false;
  },


  handleStudentDrop(studentId, courseId) {
    const course = this.getCourseById(courseId);
    const schedule = this.getScheduleForStudent(studentId);
    if (!course || !schedule) return false;

    const registration = new Registration({
      studentId,
      courseId,
    });

    const cancelled = registration.cancelRegistration(course, schedule);
    if (cancelled) {
      // Mark existing active registration record as CANCELLED
      const existingReg = this.registrations.find(
        (r) => r.studentId === studentId && r.courseId === courseId && r.status === 'CONFIRMED'
      );
      if (existingReg) {
        existingReg.status = 'CANCELLED';
      }
      this.persistAll();
      this.showToast(`Dropped ${course.courseId} (${course.title}). Seat released.`, 'info');
      this.renderApp();
      return true;
    }
    return false;
  },


  /* -------------------- Administrator CRUD Operations -------------------- */

  adminAddCourse(courseData) {
    const code = courseData.courseId.trim().toUpperCase();
    if (this.courses.some((c) => c.courseId === code)) {
      this.showToast(`Course code ${code} already exists.`, 'error');
      return false;
    }

    const newCourse = new Course({
      ...courseData,
      courseId: code,
      enrolledCount: 0,
    });

    this.courses.push(newCourse);
    this.persistAll();
    this.showToast(`Course ${newCourse.courseId} (${newCourse.title}) added to catalog.`, 'success');
    this.renderApp();
    return true;
  },


  adminUpdateCourse(courseId, updatedData) {
    const course = this.getCourseById(courseId);
    if (!course) return false;

    const newMaxCap = Number(updatedData.maxCapacity);
    if (newMaxCap < course.enrolledCount) {
      this.showToast(
        `Max capacity (${newMaxCap}) cannot be less than current enrolled count (${course.enrolledCount}).`,
        'error'
      );
      return false;
    }

    course.title = updatedData.title;
    course.description = updatedData.description;
    course.credits = Number(updatedData.credits);
    course.level = Number(updatedData.level);
    course.department = course.level <= 2 ? 'General' : updatedData.department;
    course.maxCapacity = newMaxCap;
    course.timeSlot = updatedData.timeSlot;
    course.prerequisiteId = updatedData.prerequisiteId || null;
    course.instructor = updatedData.instructor;

    // Refresh all student schedule credit totals in case course credits changed
    this.users
      .filter((u) => u.role === 'student')
      .forEach((stu) => this.getScheduleForStudent(stu.studentId));

    this.persistAll();
    this.showToast(`Course ${course.courseId} updated successfully.`, 'success');
    this.renderApp();
    return true;
  },


  adminDeleteCourse(courseId) {
    const idx = this.courses.findIndex((c) => c.courseId === courseId);
    if (idx === -1) return false;

    this.courses.splice(idx, 1);

    // Clean up course from all student schedules and completedCourses
    this.schedules.forEach((sched) => {
      sched.registeredCourses = sched.registeredCourses.filter((cid) => cid !== courseId);
    });
    this.users
      .filter((u) => u.role === 'student')
      .forEach((stu) => {
        stu.completedCourses = stu.completedCourses.filter((cid) => cid !== courseId);
        this.getScheduleForStudent(stu.studentId);
      });

    this.persistAll();
    this.showToast(`Course ${courseId} removed from the system.`, 'info');
    this.renderApp();
    return true;
  },
});
