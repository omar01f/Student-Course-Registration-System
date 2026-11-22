'use strict';

/* =========================================================================
   MODULE 1: DOMAIN MODELS (models.js)
   Matches UML Class Diagram: User, Student, Administrator, Course,
   Registration, Schedule
   ========================================================================= */

class User {
  constructor({ userId, name, email, password, role }) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role; // 'student' | 'admin'
  }

  login(inputPassword) {
    return this.password === inputPassword;
  }

  logout() {
    return true;
  }
}

class Student extends User {
  constructor({
    userId,
    name,
    email,
    password,
    studentId,
    level,
    major,
    maxCredits = 18,
    completedCourses = [],
  }) {
    super({ userId, name, email, password, role: 'student' });
    this.studentId = studentId;
    this.level = Number(level);
    // Enforce Rule: Levels 1 & 2 are strictly assigned "General"
    this.major = this.level <= 2 ? 'General' : major || 'CS';
    this.maxCredits = Number(maxCredits) || 18;
    this.completedCourses = Array.isArray(completedCourses) ? [...new Set(completedCourses)] : [];
  }

  browseCourses(courses, filters = {}) {
    return courses.filter((course) => {
      if (filters.search) {
        const q = filters.search.trim().toLowerCase();
        const matchCode = course.courseId.toLowerCase().includes(q);
        const matchTitle = course.title.toLowerCase().includes(q);
        if (!matchCode && !matchTitle) return false;
      }
      if (filters.level && filters.level !== 'ALL') {
        if (Number(course.level) !== Number(filters.level)) return false;
      }
      if (filters.track && filters.track !== 'ALL') {
        if (course.department !== filters.track) return false;
      }
      if (filters.availability === 'OPEN') {
        if (!course.checkAvailability()) return false;
      } else if (filters.availability === 'ELIGIBLE') {
        if (!this.isEligibleForCourse(course)) return false;
      }
      return true;
    });
  }

  isEligibleForCourse(course) {
    if (course.level > this.level) return false;
    if (this.level <= 2) {
      return course.department === 'General';
    }
    return course.department === 'General' || course.department === this.major;
  }

  registerCourse(courseId, systemController) {
    return systemController.handleStudentRegistration(this.studentId, courseId);
  }

  dropCourse(courseId, systemController) {
    return systemController.handleStudentDrop(this.studentId, courseId);
  }

  viewSchedule(systemController) {
    return systemController.getScheduleForStudent(this.studentId);
  }
}

class Administrator extends User {
  constructor({ userId, name, email, password, adminId, department }) {
    super({ userId, name, email, password, role: 'admin' });
    this.adminId = adminId;
    this.department = department || 'Academic Registrar';
  }

  addCourse(courseObj, systemController) {
    return systemController.adminAddCourse(courseObj);
  }

  updateCourse(courseId, updatedData, systemController) {
    return systemController.adminUpdateCourse(courseId, updatedData);
  }

  deleteCourse(courseId, systemController) {
    return systemController.adminDeleteCourse(courseId);
  }

  manageStudentRecord(studentId, courseId, systemController) {
    return systemController.handleStudentDrop(studentId, courseId);
  }
}

class Course {
  constructor({
    courseId,
    title,
    description,
    credits,
    level,
    department,
    maxCapacity,
    enrolledCount = 0,
    timeSlot,
    prerequisiteId = null,
    instructor = 'Faculty Staff',
  }) {
    this.courseId = courseId.toUpperCase();
    this.title = title;
    this.description = description;
    this.credits = Number(credits);
    this.level = Number(level);
    this.department = this.level <= 2 ? 'General' : department;
    this.maxCapacity = Number(maxCapacity);
    this.enrolledCount = Number(enrolledCount);
    this.timeSlot = timeSlot;
    this.prerequisiteId = prerequisiteId || null;
    this.instructor = instructor;
  }

  checkAvailability() {
    return this.enrolledCount < this.maxCapacity;
  }

  updateSeats(change) {
    const nextCount = this.enrolledCount + Number(change);
    if (nextCount < 0) {
      this.enrolledCount = 0;
    } else if (nextCount > this.maxCapacity) {
      this.enrolledCount = this.maxCapacity;
    } else {
      this.enrolledCount = nextCount;
    }
    return this.enrolledCount;
  }

  getCourseDetails() {
    return {
      courseId: this.courseId,
      title: this.title,
      description: this.description,
      credits: this.credits,
      level: this.level,
      department: this.department,
      maxCapacity: this.maxCapacity,
      enrolledCount: this.enrolledCount,
      availableSeats: Math.max(0, this.maxCapacity - this.enrolledCount),
      timeSlot: this.timeSlot,
      prerequisiteId: this.prerequisiteId,
      instructor: this.instructor,
      isFull: !this.checkAvailability(),
    };
  }
}

class Schedule {
  constructor({ scheduleId, studentId, semester = 'Fall 2026', registeredCourses = [], totalCredits = 0 }) {
    this.scheduleId = scheduleId;
    this.studentId = studentId;
    this.semester = semester;
    // Guarantee strict uniqueness on initialization
    this.registeredCourses = Array.isArray(registeredCourses) ? [...new Set(registeredCourses)] : [];
    this.totalCredits = Number(totalCredits) || 0;
  }

  addCourseToSchedule(course) {
    if (this.hasDuplicateCourse(course.courseId)) {
      return false;
    }
    this.registeredCourses.push(course.courseId);
    this.totalCredits += Number(course.credits);
    return true;
  }

  removeCourseFromSchedule(courseId, courseCredits = 0) {
    const index = this.registeredCourses.indexOf(courseId);
    if (index === -1) return false;
    this.registeredCourses.splice(index, 1);
    this.totalCredits = Math.max(0, this.totalCredits - Number(courseCredits));
    return true;
  }

  hasDuplicateCourse(courseId) {
    return this.registeredCourses.includes(courseId);
  }

  static parseTimeSlot(timeSlot) {
    // Expected format: "Sunday 08:00 - 10:00"
    const parts = String(timeSlot).trim().split(/\s+/);
    if (parts.length < 4) return null;
    const day = parts[0].toLowerCase();
    const [startH, startM] = parts[1].split(':').map(Number);
    const [endH, endM] = parts[3].split(':').map(Number);
    return {
      day,
      startMinutes: startH * 60 + startM,
      endMinutes: endH * 60 + endM,
    };
  }

  checkConflict(targetTimeSlot, allCoursesMap) {
    const target = Schedule.parseTimeSlot(targetTimeSlot);
    if (!target) return null;

    for (const existingCourseId of this.registeredCourses) {
      const existingCourse = allCoursesMap.get(existingCourseId);
      if (!existingCourse) continue;
      const existing = Schedule.parseTimeSlot(existingCourse.timeSlot);
      if (!existing) continue;

      const sameDay = target.day === existing.day;
      const overlaps =
        target.startMinutes < existing.endMinutes && existing.startMinutes < target.endMinutes;

      if (sameDay && overlaps) {
        return existingCourse;
      }
    }
    return null;
  }

  exportSchedule() {
    window.print();
  }
}

class Registration {
  constructor({ registrationId, studentId, courseId, registrationDate = null, status = 'PENDING' }) {
    this.registrationId = registrationId || `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.studentId = studentId;
    this.courseId = courseId;
    this.registrationDate = registrationDate || new Date().toISOString();
    this.status = status;
  }

  /**
   * Strict 5-Step Validation Sequence:
   * 1) Zero-Duplicate Check (in schedule or completedCourses)
   * 2) Level & Specialization Eligibility Check
   * 3) Seat Capacity Check
   * 4) Schedule Time-Slot Conflict Check
   * 5) Prerequisite Completion & 18-Credit Limit Check
   */
  validateConstraints(student, course, schedule, allCoursesMap) {
    if (!student || !course || !schedule) {
      this.status = 'REJECTED';
      return { valid: false, reason: 'Invalid student, course, or schedule reference.' };
    }

    // Step 1: Zero-Duplicate Check
    if (schedule.hasDuplicateCourse(course.courseId) || student.completedCourses.includes(course.courseId)) {
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Duplicate blocked: ${course.courseId} is already in your schedule or already completed.`,
      };
    }

    // Step 2: Level & Specialization Check
    if (course.level > student.level) {
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Level restriction: Level ${student.level} students cannot register for Level ${course.level} courses.`,
      };
    }

    if (student.level <= 2 && course.department !== 'General') {
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Track restriction: Level ${student.level} (General) students can only register for General courses.`,
      };
    }

    if (student.level >= 3 && course.department !== 'General' && course.department !== student.major) {
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Specialization restriction: Your major is ${student.major}, so you cannot enroll in ${course.department} track courses.`,
      };
    }

    // Step 3: Capacity Check
    if (!course.checkAvailability()) {
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Course full: ${course.courseId} (${course.title}) has reached its maximum capacity of ${course.maxCapacity} seats.`,
      };
    }

    // Step 4: Schedule Time-Slot Overlap Check
    const conflictingCourse = schedule.checkConflict(course.timeSlot, allCoursesMap);
    if (conflictingCourse) {
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Time conflict: Overlaps with ${conflictingCourse.courseId} (${conflictingCourse.title}) on ${conflictingCourse.timeSlot}.`,
      };
    }

    // Step 5: Prerequisite & 18-Credit Limit Check
    if (course.prerequisiteId && !student.completedCourses.includes(course.prerequisiteId)) {
      const prereqCourse = allCoursesMap.get(course.prerequisiteId);
      const prereqLabel = prereqCourse ? `${prereqCourse.courseId} (${prereqCourse.title})` : course.prerequisiteId;
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Prerequisite missing: You must complete ${prereqLabel} before registering.`,
      };
    }

    if (schedule.totalCredits + course.credits > student.maxCredits) {
      this.status = 'REJECTED';
      return {
        valid: false,
        reason: `Credit limit exceeded: Adding ${course.credits} credits would bring you to ${schedule.totalCredits + course.credits}/${student.maxCredits} max credits.`,
      };
    }

    return { valid: true };
  }

  confirmRegistration(course, schedule) {
    const added = schedule.addCourseToSchedule(course);
    if (!added) {
      this.status = 'REJECTED';
      return false;
    }
    course.updateSeats(1);
    this.status = 'CONFIRMED';
    this.registrationDate = new Date().toISOString();
    return true;
  }

  cancelRegistration(course, schedule) {
    const removed = schedule.removeCourseFromSchedule(course.courseId, course.credits);
    if (!removed) return false;
    course.updateSeats(-1);
    this.status = 'CANCELLED';
    return true;
  }
}
