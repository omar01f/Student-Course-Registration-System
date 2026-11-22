'use strict';

Object.assign(SystemController.prototype, {
  renderStudentDashboard() {
    const student = this.currentUser;
    const schedule = this.getScheduleForStudent(student.studentId);
    const coursesMap = this.getCoursesMap();

    document.getElementById('dash-student-name').textContent = student.name;
    document.getElementById('dash-student-id').textContent = student.studentId;
    document.getElementById('dash-level-track').textContent = `Level ${student.level} - ${student.major}`;

    document.getElementById('dash-eligibility-note').textContent =
      student.level <= 2
        ? 'Foundation Phase: Eligible for General track courses'
        : `Specialized Phase: Eligible for General & ${student.major} courses`;

    document.getElementById('dash-registered-credits').textContent = `${schedule.totalCredits} / ${student.maxCredits} Credits`;
    const pct = Math.min(100, Math.round((schedule.totalCredits / student.maxCredits) * 100));
    document.getElementById('dash-credits-bar').style.width = `${pct}%`;

    document.getElementById('dash-enrolled-count').textContent = `${schedule.registeredCourses.length} Course${
      schedule.registeredCourses.length === 1 ? '' : 's'
    }`;
    const remaining = Math.max(0, student.maxCredits - schedule.totalCredits);
    document.getElementById('dash-remaining-credits').textContent = `${remaining} Credits`;

    // Completed Courses Badges
    const completedContainer = document.getElementById('dash-completed-list');
    if (student.completedCourses.length === 0) {
      completedContainer.innerHTML = `<span class="text-xs text-slate-400 italic">No prior completed courses recorded (Freshman standing).</span>`;
      document.getElementById('dash-completed-credits').textContent = '0 Credits';
    } else {
      let totalDoneCredits = 0;
      completedContainer.innerHTML = student.completedCourses
        .map((cid) => {
          const c = coursesMap.get(cid);
          if (c) totalDoneCredits += c.credits;
          return `
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <svg class="w-3.5 h-3.5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
              ${this.escapeHtml(cid)}${c ? ` • ${this.escapeHtml(c.title)}` : ''}
            </span>
          `;
        })
        .join('');
      document.getElementById('dash-completed-credits').textContent = `${totalDoneCredits} Credits`;
    }
  },


  renderCourseCatalog() {
    const isStudent = this.currentUser.role === 'student';
    const student = isStudent ? this.currentUser : null;
    const schedule = isStudent ? this.getScheduleForStudent(student.studentId) : null;
    const coursesMap = this.getCoursesMap();

    const statusEl = document.getElementById('catalog-student-status');
    if (isStudent) {
      statusEl.classList.remove('hidden');
      document.getElementById('catalog-credits-pill').textContent = `${schedule.totalCredits} / ${student.maxCredits} Credits`;
    } else {
      statusEl.classList.add('hidden');
    }

    const filteredCourses = isStudent
      ? student.browseCourses(this.courses, this.filters)
      : this.courses.filter((course) => {
          if (this.filters.search) {
            const q = this.filters.search.trim().toLowerCase();
            if (!course.courseId.toLowerCase().includes(q) && !course.title.toLowerCase().includes(q)) return false;
          }
          if (this.filters.level !== 'ALL' && Number(course.level) !== Number(this.filters.level)) return false;
          if (this.filters.track !== 'ALL' && course.department !== this.filters.track) return false;
          if (this.filters.availability === 'OPEN' && !course.checkAvailability()) return false;
          return true;
        });

    document.getElementById('courses-result-count').textContent = `Showing ${filteredCourses.length} of ${this.courses.length} courses`;

    const grid = document.getElementById('courses-grid');
    if (filteredCourses.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p class="text-base font-bold text-slate-800">No courses match your current search or filter criteria.</p>
          <p class="text-sm text-slate-500 mt-1">Try resetting your filters or broadening your track selection.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filteredCourses
      .map((course) => {
        const isAvailable = course.checkAvailability();
        const isRegistered = isStudent && schedule.hasDuplicateCourse(course.courseId);
        const isCompleted = isStudent && student.completedCourses.includes(course.courseId);
        const isEligible = isStudent ? student.isEligibleForCourse(course) : true;

        const trackBadgeColor =
          course.department === 'General'
            ? 'bg-blue-50 text-[#1E3A8A] border-blue-200'
            : 'bg-purple-50 text-purple-800 border-purple-200';

        const seatsBadgeColor = isAvailable
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-red-50 text-[#EF4444] border-red-200';

        let actionButtonHtml = '';
        if (!isStudent) {
          actionButtonHtml = `
            <button type="button" data-action="view-details" data-course-id="${course.courseId}" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] transition cursor-pointer">
              Inspect Course
            </button>
          `;
        } else if (isRegistered) {
          actionButtonHtml = `
            <span class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-[#10B981] border border-emerald-200 text-center">
              ✓ Registered
            </span>
          `;
        } else if (isCompleted) {
          actionButtonHtml = `
            <span class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 text-center">
              ✓ Completed
            </span>
          `;
        } else if (!isAvailable) {
          actionButtonHtml = `
            <button type="button" data-action="register-course" data-course-id="${course.courseId}" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-red-50 text-[#EF4444] border border-red-200 hover:bg-red-100 transition cursor-pointer">
              Course Full
            </button>
          `;
        } else {
          actionButtonHtml = `
            <button type="button" data-action="register-course" data-course-id="${course.courseId}" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] transition shadow-2xs cursor-pointer">
              Register
            </button>
          `;
        }

        const prereqLabel = course.prerequisiteId
          ? coursesMap.get(course.prerequisiteId)?.courseId || course.prerequisiteId
          : 'None';

        return `
          <article class="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-6">
            <div>
              <!-- Top Badges -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-900 text-white tracking-wide">
                    ${this.escapeHtml(course.courseId)}
                  </span>
                  <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${trackBadgeColor}">
                    Lvl ${course.level} • ${this.escapeHtml(course.department)}
                  </span>
                </div>
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${seatsBadgeColor}">
                  ${course.enrolledCount}/${course.maxCapacity} Seats
                </span>
              </div>

              <!-- Title & Instructor -->
              <h3 class="text-lg font-bold text-slate-900 mt-3.5 leading-snug">
                ${this.escapeHtml(course.title)}
              </h3>
              <p class="text-xs text-slate-500 mt-1">Instructor: <span class="font-medium text-slate-700">${this.escapeHtml(course.instructor)}</span></p>

              <!-- Metadata Grid -->
              <div class="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Schedule Slot:</span>
                  <span class="font-semibold text-slate-800">${this.escapeHtml(course.timeSlot)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Credit Value:</span>
                  <span class="font-semibold text-slate-800">${course.credits} Credits</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400 font-medium">Prerequisite:</span>
                  <span class="font-semibold ${course.prerequisiteId ? 'text-amber-700' : 'text-slate-600'}">${this.escapeHtml(prereqLabel)}</span>
                </div>
              </div>

              ${
                isStudent && !isEligible
                  ? `<div class="mt-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                      Restricted to Level ${course.level}+ (${course.department})
                    </div>`
                  : ''
              }
            </div>

            <!-- Card Footer Actions -->
            <div class="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2.5">
              <button type="button" data-action="view-details" data-course-id="${course.courseId}" class="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                View Details
              </button>
              ${actionButtonHtml}
            </div>
          </article>
        `;
      })
      .join('');
  },


  renderCourseDetails() {
    const course = this.getCourseById(this.selectedCourseId) || this.courses[0];
    if (!course) {
      this.navigateTo('courses');
      return;
    }

    const details = course.getCourseDetails();
    const coursesMap = this.getCoursesMap();
    const isStudent = this.currentUser.role === 'student';
    const student = isStudent ? this.currentUser : null;
    const schedule = isStudent ? this.getScheduleForStudent(student.studentId) : null;

    const isRegistered = isStudent && schedule.hasDuplicateCourse(course.courseId);
    const isCompleted = isStudent && student.completedCourses.includes(course.courseId);
    const prereqCourse = details.prerequisiteId ? coursesMap.get(details.prerequisiteId) : null;
    const hasMetPrereq =
      !details.prerequisiteId || (isStudent && student.completedCourses.includes(details.prerequisiteId));

    const capacityPct = Math.min(100, Math.round((details.enrolledCount / details.maxCapacity) * 100));

    let ctaHtml = '';
    if (isStudent) {
      if (isRegistered) {
        ctaHtml = `
          <button type="button" data-action="drop-course" data-course-id="${details.courseId}" class="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#EF4444] hover:bg-red-600 transition shadow-sm cursor-pointer">
            Drop Course from Schedule
          </button>
        `;
      } else if (isCompleted) {
        ctaHtml = `
          <span class="px-6 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200">
            ✓ Already Completed
          </span>
        `;
      } else {
        ctaHtml = `
          <button type="button" data-action="register-course" data-course-id="${details.courseId}" class="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] transition shadow-sm cursor-pointer">
            Register Now (${details.credits} Credits)
          </button>
        `;
      }
    }

    document.getElementById('course-details-container').innerHTML = `
      <div class="bg-[#1E3A8A] text-white p-6 sm:p-8">
        <div class="flex flex-wrap items-center gap-2.5 mb-3">
          <span class="px-3 py-1 rounded-lg bg-white text-[#1E3A8A] text-xs font-extrabold tracking-wide">
            ${this.escapeHtml(details.courseId)}
          </span>
          <span class="px-3 py-1 rounded-lg bg-white/15 text-blue-100 text-xs font-bold">
            Academic Level ${details.level}
          </span>
          <span class="px-3 py-1 rounded-lg bg-[#10B981]/25 text-emerald-200 text-xs font-bold">
            Track: ${this.escapeHtml(details.department)}
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">${this.escapeHtml(details.title)}</h1>
        <p class="text-sm text-blue-100 mt-2">Instructor: <strong class="text-white">${this.escapeHtml(details.instructor)}</strong> • ${details.credits} Credit Hours</p>
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">Course Overview &amp; Syllabus Description</h2>
          <p class="text-sm sm:text-base text-slate-700 mt-2 leading-relaxed">
            ${this.escapeHtml(details.description)}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Time Slot</span>
            <p class="text-sm font-bold text-slate-900 mt-1">${this.escapeHtml(details.timeSlot)}</p>
          </div>

          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Prerequisite Requirement</span>
            <p class="text-sm font-bold text-slate-900 mt-1">
              ${prereqCourse ? `${this.escapeHtml(prereqCourse.courseId)} - ${this.escapeHtml(prereqCourse.title)}` : 'None Required'}
            </p>
            ${
              details.prerequisiteId && isStudent
                ? `<span class="inline-block mt-1 text-[11px] font-bold ${
                    hasMetPrereq ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }">${hasMetPrereq ? '✓ Prerequisite Met' : '✕ Prerequisite Missing'}</span>`
                : ''
            }
          </div>

          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Seat Availability</span>
              <span class="text-xs font-extrabold ${details.isFull ? 'text-[#EF4444]' : 'text-[#10B981]'}">
                ${details.enrolledCount} / ${details.maxCapacity}
              </span>
            </div>
            <div class="w-full h-2.5 bg-slate-200 rounded-full mt-2.5 overflow-hidden">
              <div class="h-full ${details.isFull ? 'bg-[#EF4444]' : 'bg-[#10B981]'} rounded-full" style="width: ${capacityPct}%"></div>
            </div>
            <p class="text-[11px] text-slate-500 mt-1.5">${details.availableSeats} seats remaining</p>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <button type="button" data-nav="courses" class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
            Return to Catalog
          </button>
          ${ctaHtml}
        </div>
      </div>
    `;
  },


  renderScheduleView() {
    const student = this.currentUser;
    const schedule = this.getScheduleForStudent(student.studentId);
    const coursesMap = this.getCoursesMap();

    // Populate Print Header Metadata
    document.getElementById('print-student-meta').innerHTML = `
      <div><strong>Student:</strong> ${this.escapeHtml(student.name)} (${this.escapeHtml(student.studentId)})</div>
      <div><strong>Standing:</strong> Level ${student.level} • Track: ${this.escapeHtml(student.major)}</div>
      <div><strong>Total Registered Load:</strong> ${schedule.totalCredits} / ${student.maxCredits} Credits</div>
    `;

    document.getElementById('sched-credits-summary').textContent = `${schedule.totalCredits} / ${student.maxCredits} Credits`;
    document.getElementById('sched-courses-count').textContent = schedule.registeredCourses.length;

    // Deduplicate strictly before rendering
    const uniqueRegisteredCourses = [...new Set(schedule.registeredCourses)]
      .map((cid) => coursesMap.get(cid))
      .filter(Boolean);

    // 1. Render Registered Course Cards
    const listEl = document.getElementById('sched-courses-list');
    if (uniqueRegisteredCourses.length === 0) {
      listEl.innerHTML = `
        <div class="col-span-full bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p class="text-sm font-bold text-slate-700">Your schedule is currently empty.</p>
          <p class="text-xs text-slate-500 mt-1">Head over to the Course Catalog to register for Fall 2026 courses.</p>
        </div>
      `;
    } else {
      listEl.innerHTML = uniqueRegisteredCourses
        .map(
          (course) => `
          <div class="rounded-2xl border border-slate-200 p-4 flex flex-col justify-between bg-slate-50/60">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="px-2.5 py-0.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-extrabold">${this.escapeHtml(course.courseId)}</span>
                <span class="text-xs font-bold text-slate-600">${course.credits} Credits</span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-2">${this.escapeHtml(course.title)}</h3>
              <p class="text-xs text-slate-500 mt-1">${this.escapeHtml(course.timeSlot)}</p>
              <p class="text-[11px] text-slate-500 mt-0.5">${this.escapeHtml(course.instructor)}</p>
            </div>
            <div class="no-print mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
              <button type="button" data-action="view-details" data-course-id="${course.courseId}" class="text-xs font-semibold text-[#1E3A8A] hover:underline cursor-pointer">
                Details
              </button>
              <button type="button" data-action="drop-course" data-course-id="${course.courseId}" class="px-3 py-1.5 rounded-xl text-xs font-bold text-[#EF4444] bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer">
                Drop Course
              </button>
            </div>
          </div>
        `
        )
        .join('');
    }

    // 2. Render Weekly Timetable Grid (Sunday - Thursday, 08:00 to 16:00)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const slots = [
      { label: '08:00 - 10:00', display: '08:00 AM – 10:00 AM', startMin: 480, endMin: 600 },
      { label: '10:00 - 12:00', display: '10:00 AM – 12:00 PM', startMin: 600, endMin: 720 },
      { label: '12:00 - 14:00', display: '12:00 PM – 02:00 PM', startMin: 720, endMin: 840 },
      { label: '14:00 - 16:00', display: '02:00 PM – 04:00 PM', startMin: 840, endMin: 960 },
    ];

    const renderedInGrid = new Set();
    const tbody = document.getElementById('timetable-grid-body');

    tbody.innerHTML = slots
      .map((slot) => {
        const cellsHtml = days
          .map((day) => {
            // Find matching course for this Day + Time block (strictly preventing duplicate blocks)
            const match = uniqueRegisteredCourses.find((course) => {
              if (renderedInGrid.has(course.courseId)) return false;
              const parsed = Schedule.parseTimeSlot(course.timeSlot);
              if (!parsed) return false;
              return (
                parsed.day === day.toLowerCase() &&
                parsed.startMinutes < slot.endMin &&
                slot.startMin < parsed.endMinutes
              );
            });

            if (!match) {
              return `<td class="p-2.5 border-r last:border-r-0 border-slate-200 align-top h-24 bg-white"></td>`;
            }

            renderedInGrid.add(match.courseId);
            const isGeneral = match.department === 'General';
            const cardStyle = isGeneral
              ? 'bg-blue-50/90 border-l-4 border-l-[#1E3A8A] border border-blue-200 text-slate-900'
              : 'bg-emerald-50/90 border-l-4 border-l-[#10B981] border border-emerald-200 text-slate-900';

            return `
              <td class="p-2 border-r last:border-r-0 border-slate-200 align-top h-24 bg-white">
                <div class="rounded-xl p-2.5 h-full flex flex-col justify-between ${cardStyle}">
                  <div>
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-xs font-extrabold text-[#1E3A8A]">${this.escapeHtml(match.courseId)}</span>
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 text-slate-700">${this.escapeHtml(match.department)}</span>
                    </div>
                    <p class="text-xs font-bold leading-snug mt-1 line-clamp-2">${this.escapeHtml(match.title)}</p>
                  </div>
                  <p class="text-[10px] text-slate-600 font-medium mt-1.5">${this.escapeHtml(match.instructor)}</p>
                </div>
              </td>
            `;
          })
          .join('');

        return `
          <tr>
            <td class="py-3 px-4 border-r border-slate-200 bg-slate-50/70 font-bold text-xs text-slate-700 whitespace-nowrap align-middle">
              ${slot.display}
            </td>
            ${cellsHtml}
          </tr>
        `;
      })
      .join('');
  },
});
