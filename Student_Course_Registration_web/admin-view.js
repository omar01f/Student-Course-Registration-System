'use strict';

Object.assign(SystemController.prototype, {
  renderAdminDashboard() {
    const students = this.users.filter((u) => u.role === 'student');
    const fullCoursesCount = this.courses.filter((c) => !c.checkAvailability()).length;

    document.getElementById('admin-stat-total-courses').textContent = this.courses.length;
    document.getElementById('admin-stat-total-students').textContent = students.length;
    document.getElementById('admin-stat-full-courses').textContent = fullCoursesCount;

    // 1. Render Admin Courses Table
    const searchVal = (document.getElementById('admin-course-search').value || '').trim().toLowerCase();
    const visibleCourses = this.courses.filter(
      (c) => !searchVal || c.courseId.toLowerCase().includes(searchVal) || c.title.toLowerCase().includes(searchVal)
    );

    const coursesTbody = document.getElementById('admin-courses-tbody');
    coursesTbody.innerHTML = visibleCourses
      .map((course) => {
        const isFull = !course.checkAvailability();
        return `
          <tr class="hover:bg-slate-50/80 transition">
            <td class="py-3.5 px-5 font-extrabold text-slate-900 whitespace-nowrap">${this.escapeHtml(course.courseId)}</td>
            <td class="py-3.5 px-5">
              <div class="font-bold text-slate-900">${this.escapeHtml(course.title)}</div>
              <div class="text-xs text-slate-500">${this.escapeHtml(course.instructor)} • ${course.credits} Credits</div>
            </td>
            <td class="py-3.5 px-5 whitespace-nowrap">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${
                course.department === 'General' ? 'bg-blue-50 text-[#1E3A8A]' : 'bg-purple-50 text-purple-800'
              }">
                Lvl ${course.level} • ${this.escapeHtml(course.department)}
              </span>
            </td>
            <td class="py-3.5 px-5 text-xs font-semibold text-slate-700 whitespace-nowrap">${this.escapeHtml(course.timeSlot)}</td>
            <td class="py-3.5 px-5 whitespace-nowrap">
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${
                isFull ? 'bg-red-50 text-[#EF4444]' : 'bg-emerald-50 text-[#10B981]'
              }">
                ${course.enrolledCount} / ${course.maxCapacity}
              </span>
            </td>
            <td class="py-3.5 px-5 text-right whitespace-nowrap space-x-2">
              <button type="button" data-admin-edit-course="${course.courseId}" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
                Edit
              </button>
              <button type="button" data-admin-delete-course="${course.courseId}" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-[#EF4444] transition cursor-pointer">
                Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // 2. Render Admin Student Records List
    const studentsListEl = document.getElementById('admin-students-list');
    const coursesMap = this.getCoursesMap();

    studentsListEl.innerHTML = students
      .map((stu) => {
        const sched = this.getScheduleForStudent(stu.studentId);
        const enrolledBadges =
          sched.registeredCourses.length === 0
            ? `<span class="text-xs text-slate-400 italic">No courses enrolled this semester.</span>`
            : sched.registeredCourses
                .map((cid) => {
                  const c = coursesMap.get(cid);
                  return `
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs font-semibold text-slate-800">
                      <span><strong class="text-[#1E3A8A]">${this.escapeHtml(cid)}</strong>${c ? `: ${this.escapeHtml(c.title)}` : ''}</span>
                      <button type="button" data-admin-drop-student="${stu.studentId}" data-admin-drop-course="${cid}" title="Drop student from ${cid}" class="text-[#EF4444] hover:text-red-700 font-extrabold cursor-pointer">
                        &times;
                      </button>
                    </span>
                  `;
                })
                .join('');

        return `
          <div class="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-slate-900">${this.escapeHtml(stu.name)}</h3>
                <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">${this.escapeHtml(stu.studentId)}</span>
                <span class="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] text-xs font-bold">Level ${stu.level}</span>
                <span class="px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#10B981] text-xs font-bold">${this.escapeHtml(stu.major)}</span>
              </div>
              <p class="text-xs text-slate-500">
                ${this.escapeHtml(stu.email)} • Load: <strong class="text-slate-800">${sched.totalCredits} / ${stu.maxCredits} Credits</strong>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:max-w-2xl">
              ${enrolledBadges}
            </div>
          </div>
        `;
      })
      .join('');
  },


  /* -------------------- Admin Course Modal Helpers -------------------- */

  openCourseModal(mode = 'add', courseId = null) {
    const modal = document.getElementById('course-modal');
    const form = document.getElementById('course-form');
    form.reset();

    document.getElementById('course-form-mode').value = mode;
    const codeInput = document.getElementById('cf-courseId');
    const levelSelect = document.getElementById('cf-level');
    const deptSelect = document.getElementById('cf-department');
    const prereqSelect = document.getElementById('cf-prerequisiteId');

    // Populate Prerequisite options
    prereqSelect.innerHTML =
      `<option value="">None (No Prerequisite)</option>` +
      this.courses
        .filter((c) => c.courseId !== courseId)
        .map((c) => `<option value="${c.courseId}">${c.courseId} — ${this.escapeHtml(c.title)}</option>`)
        .join('');

    if (mode === 'edit' && courseId) {
      const course = this.getCourseById(courseId);
      if (!course) return;
      document.getElementById('course-modal-title').textContent = `Edit Course: ${course.courseId}`;
      codeInput.value = course.courseId;
      codeInput.disabled = true;
      codeInput.classList.add('bg-slate-100', 'text-slate-500');

      document.getElementById('cf-instructor').value = course.instructor;
      document.getElementById('cf-title').value = course.title;
      document.getElementById('cf-description').value = course.description;
      levelSelect.value = String(course.level);
      deptSelect.value = course.department;
      document.getElementById('cf-credits').value = String(course.credits);
      document.getElementById('cf-maxCapacity').value = String(course.maxCapacity);

      const parts = course.timeSlot.split(' ');
      if (parts.length >= 4) {
        document.getElementById('cf-day').value = parts[0];
        document.getElementById('cf-slot').value = `${parts[1]} - ${parts[3]}`;
      }
      prereqSelect.value = course.prerequisiteId || '';
    } else {
      document.getElementById('course-modal-title').textContent = 'Add New Course';
      codeInput.disabled = false;
      codeInput.classList.remove('bg-slate-100', 'text-slate-500');
      levelSelect.value = '1';
      deptSelect.value = 'General';
    }

    this.syncCourseModalTrackState();
    modal.classList.remove('hidden');
  },


  syncCourseModalTrackState() {
    const levelVal = Number(document.getElementById('cf-level').value);
    const deptSelect = document.getElementById('cf-department');
    const hintEl = document.getElementById('cf-track-hint');

    if (levelVal <= 2) {
      deptSelect.value = 'General';
      deptSelect.disabled = true;
      deptSelect.classList.add('bg-slate-100', 'text-slate-500');
      hintEl.textContent = 'Levels 1–2 are locked to General foundation track.';
    } else {
      deptSelect.disabled = false;
      deptSelect.classList.remove('bg-slate-100', 'text-slate-500');
      hintEl.textContent = 'Select General or specialized track (CS, AI, IS, IT).';
    }
  },


  closeCourseModal() {
    document.getElementById('course-modal').classList.add('hidden');
  },
});
