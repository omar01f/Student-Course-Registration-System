'use strict';

/* =========================================================================
   MODULE 2: STORAGE MANAGER (storage.js)
   Handles LocalStorage seeding, hydration into ES6 class instances, and saving
   ========================================================================= */

class StorageManager {
  constructor() {
    this.KEYS = {
      INITIALIZED: 'apex_uni_initialized_v1',
      USERS: 'apex_uni_users_v1',
      COURSES: 'apex_uni_courses_v1',
      SCHEDULES: 'apex_uni_schedules_v1',
      REGISTRATIONS: 'apex_uni_registrations_v1',
      SESSION_USER_ID: 'apex_uni_session_user_v1',
    };
  }

  initSeedData(forceReset = false) {
    if (!forceReset && localStorage.getItem(this.KEYS.INITIALIZED) === 'true') {
      return;
    }

    // 1. Seed 14 Realistic Courses across Levels 1–4 and Tracks (General, CS, AI, IS, IT)
    const seedCourses = [
      new Course({
        courseId: 'CS101',
        title: 'Introduction to Programming',
        description: 'Foundational problem solving, structured programming constructs, memory fundamentals, and algorithmic thinking using modern languages.',
        credits: 3,
        level: 1,
        department: 'General',
        maxCapacity: 35,
        enrolledCount: 28,
        timeSlot: 'Sunday 08:00 - 10:00',
        prerequisiteId: null,
        instructor: 'Dr. Tariq Al-Mansoor',
      }),
      new Course({
        courseId: 'MATH101',
        title: 'Discrete Mathematics & Logic',
        description: 'Propositional and predicate logic, set theory, combinatorics, graph theory, and mathematical proof techniques for computing.',
        credits: 3,
        level: 1,
        department: 'General',
        maxCapacity: 40,
        enrolledCount: 34,
        timeSlot: 'Monday 10:00 - 12:00',
        prerequisiteId: null,
        instructor: 'Prof. Nadia El-Sayed',
      }),
      new Course({
        courseId: 'IT102',
        title: 'Computer Architecture & Digital Systems',
        description: 'Boolean algebra, combinational and sequential logic circuits, CPU instruction pipelining, and memory hierarchy organization.',
        credits: 3,
        level: 1,
        department: 'General',
        maxCapacity: 30,
        enrolledCount: 22,
        timeSlot: 'Wednesday 08:00 - 10:00',
        prerequisiteId: null,
        instructor: 'Dr. Karim Hassan',
      }),
      new Course({
        courseId: 'CS201',
        title: 'Data Structures & Algorithms',
        description: 'Design and complexity analysis of trees, heaps, hash tables, graphs, sorting algorithms, and dynamic programming.',
        credits: 3,
        level: 2,
        department: 'General',
        maxCapacity: 30,
        enrolledCount: 25,
        timeSlot: 'Sunday 10:00 - 12:00',
        prerequisiteId: 'CS101',
        instructor: 'Dr. Layla Mahmoud',
      }),
      new Course({
        courseId: 'IS202',
        title: 'Database Management Systems',
        description: 'Relational data modeling, ER diagrams, SQL query optimization, normalization, ACID transactions, and indexing.',
        credits: 3,
        level: 2,
        department: 'General',
        maxCapacity: 30,
        enrolledCount: 27,
        timeSlot: 'Tuesday 10:00 - 12:00',
        prerequisiteId: 'CS101',
        instructor: 'Dr. Omar Farouk',
      }),
      new Course({
        courseId: 'CS204',
        title: 'Object-Oriented Software Design',
        description: 'SOLID principles, UML modeling, design patterns, modular architecture, and automated unit testing practices.',
        credits: 3,
        level: 2,
        department: 'General',
        maxCapacity: 25,
        enrolledCount: 19,
        timeSlot: 'Thursday 08:00 - 10:00',
        prerequisiteId: 'IT102',
        instructor: 'Dr. Sara Abdelrahman',
      }),
      new Course({
        courseId: 'GEN205',
        title: 'Probability & Statistical Inference',
        description: 'Random variables, probability distributions, hypothesis testing, Bayesian inference, and regression modeling.',
        credits: 3,
        level: 2,
        department: 'General',
        maxCapacity: 30,
        enrolledCount: 16,
        timeSlot: 'Sunday 10:00 - 12:00',
        prerequisiteId: 'MATH101',
        instructor: 'Dr. Youssef Nabil',
      }),
      new Course({
        courseId: 'AI301',
        title: 'Foundations of Artificial Intelligence',
        description: 'Heuristic search, adversarial game playing, constraint satisfaction problems, knowledge representation, and probabilistic reasoning.',
        credits: 3,
        level: 3,
        department: 'AI',
        maxCapacity: 25,
        enrolledCount: 21,
        timeSlot: 'Monday 08:00 - 10:00',
        prerequisiteId: 'CS201',
        instructor: 'Prof. Hani Zaki',
      }),
      new Course({
        courseId: 'AI302',
        title: 'Machine Learning & Neural Networks',
        description: 'Supervised and unsupervised learning, SVMs, ensemble methods, backpropagation, and model regularization techniques.',
        credits: 3,
        level: 3,
        department: 'AI',
        maxCapacity: 25,
        enrolledCount: 25, // Intentionally FULL (25/25)
        timeSlot: 'Wednesday 10:00 - 12:00',
        prerequisiteId: 'CS201',
        instructor: 'Dr. Mona El-Kady',
      }),
      new Course({
        courseId: 'AI305',
        title: 'Computer Vision & Image Processing',
        description: 'Spatial filtering, feature extraction, object detection pipelines, camera geometry, and convolutional architectures.',
        credits: 3,
        level: 3,
        department: 'AI',
        maxCapacity: 20,
        enrolledCount: 14,
        timeSlot: 'Thursday 12:00 - 14:00',
        prerequisiteId: 'CS201',
        instructor: 'Dr. Rami Soliman',
      }),
      new Course({
        courseId: 'CS301',
        title: 'Operating Systems & Concurrency',
        description: 'Process scheduling, multithreading, synchronization primitives, deadlocks, virtual memory paging, and file systems.',
        credits: 3,
        level: 3,
        department: 'CS',
        maxCapacity: 30,
        enrolledCount: 24,
        timeSlot: 'Monday 12:00 - 14:00',
        prerequisiteId: 'CS201',
        instructor: 'Dr. Adel Ibrahim',
      }),
      new Course({
        courseId: 'IS301',
        title: 'Enterprise Systems & Business Analytics',
        description: 'ERP architecture, data warehousing, OLAP cubes, KPI dashboards, and data-driven organizational decision systems.',
        credits: 3,
        level: 3,
        department: 'IS',
        maxCapacity: 28,
        enrolledCount: 18,
        timeSlot: 'Tuesday 12:00 - 14:00',
        prerequisiteId: 'IS202',
        instructor: 'Dr. Dina Tarek',
      }),
      new Course({
        courseId: 'IT301',
        title: 'Cloud Infrastructure & Network Security',
        description: 'Virtualization, container orchestration, zero-trust network architecture, cryptography, and cloud hardening.',
        credits: 3,
        level: 3,
        department: 'IT',
        maxCapacity: 25,
        enrolledCount: 20,
        timeSlot: 'Wednesday 12:00 - 14:00',
        prerequisiteId: 'IT102',
        instructor: 'Dr. Waleed Sami',
      }),
      new Course({
        courseId: 'AI401',
        title: 'Deep Learning & Generative Models',
        description: 'Transformers, attention mechanisms, diffusion models, large language model fine-tuning, and ethical AI alignment.',
        credits: 3,
        level: 4,
        department: 'AI',
        maxCapacity: 20,
        enrolledCount: 12,
        timeSlot: 'Tuesday 14:00 - 16:00',
        prerequisiteId: 'AI302',
        instructor: 'Prof. Hani Zaki',
      }),
    ];

    // 2. Seed 3 Demo Accounts (Level 2 General Student, Level 3 AI Student, Administrator)
    const seedUsers = [
      new Student({
        userId: 'USR-STU-01',
        name: 'Youssef Kamal',
        email: 'youssef.gen@uni.edu',
        password: '123456',
        studentId: 'STU-2026-001',
        level: 2,
        major: 'General',
        maxCredits: 18,
        completedCourses: ['CS101', 'MATH101'],
      }),
      new Student({
        userId: 'USR-STU-02',
        name: 'Nour El-Din',
        email: 'nour.ai@uni.edu',
        password: '123456',
        studentId: 'STU-2026-002',
        level: 3,
        major: 'AI',
        maxCredits: 18,
        completedCourses: ['CS101', 'MATH101', 'IT102', 'CS201', 'IS202'],
      }),
      new Administrator({
        userId: 'USR-ADM-01',
        name: 'Dr. Salma Rashad',
        email: 'admin@uni.edu',
        password: '123456',
        adminId: 'ADM-001',
        department: 'Academic Registrar Office',
      }),
    ];

    // 3. Seed Initial Schedules matching demo students
    const seedSchedules = [
      new Schedule({
        scheduleId: 'SCH-STU-2026-001',
        studentId: 'STU-2026-001',
        semester: 'Fall 2026',
        registeredCourses: ['CS201', 'IS202'],
        totalCredits: 6,
      }),
      new Schedule({
        scheduleId: 'SCH-STU-2026-002',
        studentId: 'STU-2026-002',
        semester: 'Fall 2026',
        registeredCourses: ['CS204', 'AI301', 'GEN205'],
        totalCredits: 9,
      }),
    ];

    // 4. Seed Initial Registrations
    const seedRegistrations = [
      new Registration({
        registrationId: 'REG-1001',
        studentId: 'STU-2026-001',
        courseId: 'CS201',
        status: 'CONFIRMED',
      }),
      new Registration({
        registrationId: 'REG-1002',
        studentId: 'STU-2026-001',
        courseId: 'IS202',
        status: 'CONFIRMED',
      }),
      new Registration({
        registrationId: 'REG-1003',
        studentId: 'STU-2026-002',
        courseId: 'CS204',
        status: 'CONFIRMED',
      }),
      new Registration({
        registrationId: 'REG-1004',
        studentId: 'STU-2026-002',
        courseId: 'AI301',
        status: 'CONFIRMED',
      }),
      new Registration({
        registrationId: 'REG-1005',
        studentId: 'STU-2026-002',
        courseId: 'GEN205',
        status: 'CONFIRMED',
      }),
    ];

    this.saveCourses(seedCourses);
    this.saveUsers(seedUsers);
    this.saveSchedules(seedSchedules);
    this.saveRegistrations(seedRegistrations);
    localStorage.setItem(this.KEYS.INITIALIZED, 'true');
  }

  loadUsers() {
    const raw = JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    return raw.map((u) => (u.role === 'admin' ? new Administrator(u) : new Student(u)));
  }

  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  }

  loadCourses() {
    const raw = JSON.parse(localStorage.getItem(this.KEYS.COURSES) || '[]');
    return raw.map((c) => new Course(c));
  }

  saveCourses(courses) {
    localStorage.setItem(this.KEYS.COURSES, JSON.stringify(courses));
  }

  loadSchedules() {
    const raw = JSON.parse(localStorage.getItem(this.KEYS.SCHEDULES) || '[]');
    return raw.map((s) => new Schedule(s));
  }

  saveSchedules(schedules) {
    localStorage.setItem(this.KEYS.SCHEDULES, JSON.stringify(schedules));
  }

  loadRegistrations() {
    const raw = JSON.parse(localStorage.getItem(this.KEYS.REGISTRATIONS) || '[]');
    return raw.map((r) => new Registration(r));
  }

  saveRegistrations(registrations) {
    localStorage.setItem(this.KEYS.REGISTRATIONS, JSON.stringify(registrations));
  }

  getSessionUserId() {
    return localStorage.getItem(this.KEYS.SESSION_USER_ID);
  }

  setSessionUserId(userId) {
    if (userId) {
      localStorage.setItem(this.KEYS.SESSION_USER_ID, userId);
    } else {
      localStorage.removeItem(this.KEYS.SESSION_USER_ID);
    }
  }
}
