const { prisma } = require('../lib/prisma');
const {
  DA_COMPONENTS,
  CIE_COMPONENTS,
  ALL_COMPONENTS,
  SCHEME,
  evaluatePassFail,
  monthDateRange,
  formatMonthLabel
} = require('../lib/reportCardConstants');

async function ensureSession({ semester, subjectId, academicMonth, label, note }) {
  return prisma.assessmentSession.upsert({
    where: {
      semester_subjectId_academicMonth: {
        semester,
        subjectId,
        academicMonth
      }
    },
    update: {
      ...(label !== undefined ? { label } : {}),
      ...(note !== undefined ? { note } : {})
    },
    create: {
      semester,
      subjectId,
      academicMonth,
      label: label || null,
      note: note || null
    }
  });
}

async function getStudentsForSemester(semester) {
  return prisma.user.findMany({
    where: { role: 'STUDENT', semester },
    orderBy: [{ enrollmentId: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      enrollmentId: true,
      phone: true,
      semester: true
    }
  });
}

async function aggregateAttendance({ semester, subjectId, month }) {
  const range = monthDateRange(month);
  if (!range) {
    throw new Error('Invalid month. Use YYYY-MM.');
  }

  const students = await getStudentsForSemester(semester);
  const records = await prisma.attendance.findMany({
    where: {
      semester,
      subjectId,
      date: {
        gte: range.start,
        lt: range.end
      }
    },
    select: {
      studentId: true,
      date: true,
      status: true
    }
  });

  // Classes taken = distinct dates that have any attendance for this subject/semester in the month
  const takenDates = new Set(records.map((r) => r.date.toISOString().slice(0, 10)));
  const classesTaken = takenDates.size;

  const byStudent = new Map();
  for (const s of students) {
    byStudent.set(s.id, {
      studentId: s.id,
      name: s.name,
      enrollmentId: s.enrollmentId,
      email: s.email,
      phone: s.phone,
      classesTaken,
      classesPresent: 0,
      percentage: 0
    });
  }

  for (const r of records) {
    const row = byStudent.get(r.studentId);
    if (!row) continue;
    if (r.status === 'PRESENT') {
      row.classesPresent += 1;
    }
  }

  const rows = Array.from(byStudent.values()).map((row) => ({
    ...row,
    percentage: row.classesTaken > 0
      ? Math.round((row.classesPresent / row.classesTaken) * 10000) / 100
      : 0
  }));

  return { month, classesTaken, students: rows };
}

function buildMarksRow(student, marksByComponent) {
  const marks = {};
  for (const c of ALL_COMPONENTS) {
    const raw = marksByComponent[c] ?? '';
    const evaluated = evaluatePassFail(c, raw);
    marks[c] = {
      value: raw === null || raw === undefined ? '' : String(raw),
      result: evaluated.result
    };
  }
  return {
    studentId: student.id,
    name: student.name,
    enrollmentId: student.enrollmentId,
    email: student.email,
    phone: student.phone,
    marks
  };
}

// GET marks sheet
const getMarksSheet = async (req, res) => {
  try {
    const { semester, subjectId, month } = req.query;
    if (!semester || !subjectId || !month) {
      return res.status(400).json({ error: 'Missing query: semester, subjectId, month' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const session = await ensureSession({ semester, subjectId, academicMonth: month });
    const students = await getStudentsForSemester(semester);
    const markRows = await prisma.studentMark.findMany({
      where: { sessionId: session.id }
    });

    const byStudent = {};
    for (const m of markRows) {
      if (!byStudent[m.studentId]) byStudent[m.studentId] = {};
      byStudent[m.studentId][m.component] = m.value ?? '';
    }

    res.status(200).json({
      session: {
        id: session.id,
        semester: session.semester,
        subjectId: session.subjectId,
        academicMonth: session.academicMonth,
        label: session.label,
        note: session.note
      },
      subject,
      scheme: SCHEME,
      components: { da: DA_COMPONENTS, cie: CIE_COMPONENTS },
      rows: students.map((s) => buildMarksRow(s, byStudent[s.id] || {}))
    });
  } catch (error) {
    console.error('Error fetching marks sheet:', error);
    res.status(500).json({ error: 'Failed to fetch marks sheet' });
  }
};

// POST save marks sheet (bulk upsert)
const saveMarksSheet = async (req, res) => {
  try {
    const { semester, subjectId, month, rows, label, note } = req.body;
    if (!semester || !subjectId || !month || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Missing fields: semester, subjectId, month, rows' });
    }

    const session = await ensureSession({ semester, subjectId, academicMonth: month, label, note });

    const ops = [];
    for (const row of rows) {
      if (!row.studentId || !row.marks) continue;
      for (const component of ALL_COMPONENTS) {
        const entry = row.marks[component];
        const value = entry && typeof entry === 'object' ? entry.value : entry;
        const normalized =
          value === null || value === undefined || String(value).trim() === ''
            ? null
            : String(value).trim();

        ops.push(
          prisma.studentMark.upsert({
            where: {
              sessionId_studentId_component: {
                sessionId: session.id,
                studentId: row.studentId,
                component
              }
            },
            update: { value: normalized },
            create: {
              sessionId: session.id,
              studentId: row.studentId,
              component,
              value: normalized
            }
          })
        );
      }
    }

    // Batch in chunks to avoid huge transactions
    const chunkSize = 100;
    for (let i = 0; i < ops.length; i += chunkSize) {
      await prisma.$transaction(ops.slice(i, i + chunkSize));
    }

    res.status(200).json({ message: 'Marks saved', sessionId: session.id, count: ops.length });
  } catch (error) {
    console.error('Error saving marks sheet:', error);
    res.status(500).json({ error: 'Failed to save marks sheet' });
  }
};

const getMarksSampleSheet = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const headers = [
      'Register No',
      'Student Name',
      ...DA_COMPONENTS,
      ...CIE_COMPONENTS
    ];
    const data = [
      headers,
      ['', '', ...ALL_COMPONENTS.map(() => '')]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'marks');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=marks_import_template.xlsx');
    return res.status(200).send(buf);
  } catch (error) {
    console.error('Error generating marks sample:', error);
    res.status(500).json({ error: 'Failed to generate marks template' });
  }
};

const importMarksSheet = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { semester, subjectId, month } = req.body;
    if (!semester || !subjectId || !month) {
      return res.status(400).json({ error: 'Missing fields: semester, subjectId, month' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

    const students = await getStudentsForSemester(semester);
    const byEnrollment = new Map();
    const byName = new Map();
    for (const s of students) {
      if (s.enrollmentId) byEnrollment.set(String(s.enrollmentId).trim().toLowerCase(), s);
      byName.set(String(s.name).trim().toLowerCase(), s);
    }

    const session = await ensureSession({ semester, subjectId, academicMonth: month });
    let matched = 0;
    let unmatched = 0;
    const ops = [];

    for (const row of rows) {
      const reg =
        row['Register No'] ??
        row['Reg No'] ??
        row['enrollmentId'] ??
        row['Register Number'] ??
        '';
      const name = row['Student Name'] ?? row['Name'] ?? '';

      let student =
        (reg !== '' && byEnrollment.get(String(reg).trim().toLowerCase())) ||
        (name && byName.get(String(name).trim().toLowerCase())) ||
        null;

      if (!student) {
        unmatched += 1;
        continue;
      }
      matched += 1;

      for (const component of ALL_COMPONENTS) {
        const raw = row[component];
        const normalized =
          raw === null || raw === undefined || String(raw).trim() === ''
            ? null
            : String(raw).trim();

        ops.push(
          prisma.studentMark.upsert({
            where: {
              sessionId_studentId_component: {
                sessionId: session.id,
                studentId: student.id,
                component
              }
            },
            update: { value: normalized },
            create: {
              sessionId: session.id,
              studentId: student.id,
              component,
              value: normalized
            }
          })
        );
      }
    }

    const chunkSize = 100;
    for (let i = 0; i < ops.length; i += chunkSize) {
      await prisma.$transaction(ops.slice(i, i + chunkSize));
    }

    res.status(200).json({
      message: 'Marks imported',
      matched,
      unmatched,
      updatedCells: ops.length
    });
  } catch (error) {
    console.error('Error importing marks:', error);
    res.status(500).json({ error: 'Failed to import marks sheet' });
  }
};

const getMonthlyAttendance = async (req, res) => {
  try {
    const { semester, subjectId, month } = req.query;
    if (!semester || !subjectId || !month) {
      return res.status(400).json({ error: 'Missing query: semester, subjectId, month' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const result = await aggregateAttendance({ semester, subjectId, month });
    res.status(200).json({
      semester,
      subject,
      month,
      monthLabel: formatMonthLabel(month),
      classesTaken: result.classesTaken,
      students: result.students
    });
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch monthly attendance' });
  }
};

const exportMonthlyAttendanceExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { semester, subjectId, month } = req.query;
    if (!semester || !subjectId || !month) {
      return res.status(400).json({ error: 'Missing query: semester, subjectId, month' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const result = await aggregateAttendance({ semester, subjectId, month });
    const data = [
      ['SANDUR POLYTECHNIC, YESHWANTNAGAR'],
      ['DEPARTMENT OF COMPUTER SCIENCE & ENGG'],
      ['MONTHLY ATTENDANCE REPORT'],
      [`Semester: ${semester}`, `Subject: ${subject.name}`, `Month: ${formatMonthLabel(month)}`],
      [`Classes taken: ${result.classesTaken}`],
      [],
      ['Sl.No', 'Register No', 'Student Name', 'Classes Taken', 'Classes Present', 'Attendance %'],
      ...result.students.map((s, i) => [
        i + 1,
        s.enrollmentId || '',
        s.name,
        s.classesTaken,
        s.classesPresent,
        s.percentage
      ]),
      [],
      ['HOD', '', '', '', '', 'PRINCIPAL']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'attendance');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_${month}_${subject.code}.xlsx`
    );
    return res.status(200).send(buf);
  } catch (error) {
    console.error('Error exporting monthly attendance:', error);
    res.status(500).json({ error: 'Failed to export monthly attendance' });
  }
};

function buildStudentAttendanceSlipRows({ subject, semester, monthLabel, student }) {
  return [
    ['SANDUR POLYTECHNIC, YESHWANTNAGAR'],
    ['DEPARTMENT OF COMPUTER SCIENCE & ENGG'],
    ['STUDENT ATTENDANCE REPORT'],
    [`SUBJECT: ${subject.name}`, '', '', `MONTH/YEAR: ${monthLabel}`],
    [],
    [`REGISTER NO: ${student.enrollmentId || ''}`],
    [`STUDENT NAME: ${student.name}`],
    [`SEMESTER: ${semester}`],
    [],
    ['Attendance', 'No of classes taken', 'No of classes present', 'Attendance %'],
    ['', student.classesTaken, student.classesPresent, student.percentage],
    [],
    [
      student.percentage < 75
        ? 'ATTENTION: Attendance is below 75%. Please contact HOD.'
        : 'Attendance status is satisfactory.'
    ],
    ['HOD: 8660155525'],
    [],
    ['HOD', '', '', 'PRINCIPAL']
  ];
}

// Per-student attendance slips Excel (one sheet each, or single student)
const exportStudentAttendanceSlipsExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { semester, subjectId, month, studentId, all } = req.query;
    if (!semester || !subjectId || !month) {
      return res.status(400).json({ error: 'Missing query: semester, subjectId, month' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    const result = await aggregateAttendance({ semester, subjectId, month });
    const monthLabel = formatMonthLabel(month);

    let students = result.students;
    if (!(all === 'true' || all === '1')) {
      if (!studentId) {
        return res.status(400).json({ error: 'Pass studentId or all=true' });
      }
      students = result.students.filter((s) => s.studentId === studentId);
      if (students.length === 0) {
        return res.status(404).json({ error: 'Student attendance not found' });
      }
    }

    const wb = XLSX.utils.book_new();
    students.forEach((student, idx) => {
      const aoa = buildStudentAttendanceSlipRows({
        subject,
        semester,
        monthLabel,
        student
      });
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const sheetName = (student.enrollmentId || student.name || `S${idx + 1}`)
        .toString()
        .slice(0, 28)
        .replace(/[\\/?*[\]]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, sheetName || `S${idx + 1}`);
    });

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=student_attendance_slips_${month}.xlsx`
    );
    return res.status(200).send(buf);
  } catch (error) {
    console.error('Error exporting student attendance slips:', error);
    res.status(500).json({ error: 'Failed to export student attendance slips' });
  }
};

async function buildReportCardPayload({ semester, subjectId, month, studentId }) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw Object.assign(new Error('Subject not found'), { status: 404 });

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      enrollmentId: true,
      phone: true,
      semester: true
    }
  });
  if (!student) throw Object.assign(new Error('Student not found'), { status: 404 });

  const session = await prisma.assessmentSession.findUnique({
    where: {
      semester_subjectId_academicMonth: {
        semester,
        subjectId,
        academicMonth: month
      }
    }
  });

  const markRows = session
    ? await prisma.studentMark.findMany({ where: { sessionId: session.id, studentId } })
    : [];

  const marksByComponent = {};
  for (const m of markRows) marksByComponent[m.component] = m.value ?? '';

  const da = DA_COMPONENTS.map((c) => {
    const evaluated = evaluatePassFail(c, marksByComponent[c]);
    return {
      component: c,
      total: SCHEME.DA.total,
      passing: SCHEME.DA.passing,
      obtained: evaluated.display,
      result: evaluated.result
    };
  });

  const cie = CIE_COMPONENTS.map((c) => {
    const evaluated = evaluatePassFail(c, marksByComponent[c]);
    return {
      component: c,
      total: SCHEME.CIE.total,
      passing: SCHEME.CIE.passing,
      obtained: evaluated.display,
      result: evaluated.result
    };
  });

  const attendance = await aggregateAttendance({ semester, subjectId, month });
  const studentAtt =
    attendance.students.find((s) => s.studentId === studentId) || {
      classesTaken: attendance.classesTaken,
      classesPresent: 0,
      percentage: 0
    };

  return {
    semester,
    month,
    monthLabel: formatMonthLabel(month),
    subject: {
      id: subject.id,
      code: subject.code,
      name: subject.name
    },
    student: {
      id: student.id,
      name: student.name,
      enrollmentId: student.enrollmentId,
      email: student.email,
      phone: student.phone
    },
    da,
    cie,
    attendance: {
      classesTaken: studentAtt.classesTaken,
      classesPresent: studentAtt.classesPresent,
      percentage: studentAtt.percentage
    },
    note: session?.note ||
      'PLEASE CONTACT HOD, IF YOUR SON/DAUGHTER IS FAILED IN ANY SUBJECT.',
    hodPhone: '8660155525',
    college: 'SANDUR POLYTECHNIC, YESHWANTNAGAR',
    department: 'DEPARTMENT OF COMPUTER SCIENCE & ENGG'
  };
}

const generateReportCard = async (req, res) => {
  try {
    const { semester, subjectId, month, studentId } = req.query;
    if (!semester || !subjectId || !month || !studentId) {
      return res.status(400).json({
        error: 'Missing query: semester, subjectId, month, studentId'
      });
    }

    const payload = await buildReportCardPayload({
      semester,
      subjectId,
      month,
      studentId
    });
    res.status(200).json(payload);
  } catch (error) {
    console.error('Error generating report card:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to generate report card' });
  }
};

const generateReportCardExcel = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { semester, subjectId, month, studentId, all } = req.query;
    if (!semester || !subjectId || !month) {
      return res.status(400).json({ error: 'Missing query: semester, subjectId, month' });
    }

    const students = all === 'true' || all === '1'
      ? await getStudentsForSemester(semester)
      : studentId
        ? [await prisma.user.findUnique({ where: { id: studentId } })].filter(Boolean)
        : [];

    if (students.length === 0) {
      return res.status(400).json({ error: 'No students selected. Pass studentId or all=true' });
    }

    const wb = XLSX.utils.book_new();

    for (const student of students) {
      const card = await buildReportCardPayload({
        semester,
        subjectId,
        month,
        studentId: student.id
      });

      const aoa = [
        ['SANDUR POLYTECHNIC, YESHWANTNAGAR'],
        ['DEPARTMENT OF COMPUTER SCIENCE & ENGG'],
        ['IA MARKS & ATTENDANCE DETAILS'],
        [`SUBJECT: ${card.subject.name}`, '', '', '', '', '', `MONTH/YEAR: ${card.monthLabel}`],
        [],
        [`REGISTER NO: ${card.student.enrollmentId || ''}`],
        [`STUDENT NAME: ${card.student.name}`],
        [],
        ['', 'TOTAL MARKS', 'PASSING', 'MARKS OBTAINED', 'PASS/FAIL', '', '', 'TOTAL MARKS', 'PASSING MARKS', 'MARKS OBTAINED', 'PASS/FAIL'],
      ];

      const maxRows = Math.max(card.da.length, card.cie.length);
      for (let i = 0; i < maxRows; i++) {
        const da = card.da[i];
        const cie = card.cie[i];
        aoa.push([
          da ? da.component : '',
          da ? da.total : '',
          da ? da.passing : '',
          da ? da.obtained : '',
          da ? da.result : '',
          '',
          cie ? cie.component : '',
          cie ? cie.total : '',
          cie ? cie.passing : '',
          cie ? cie.obtained : '',
          cie ? cie.result : ''
        ]);
      }

      aoa.push([]);
      aoa.push(['Attendance', 'No of classes taken', 'No of classes present', 'Attendance %']);
      aoa.push([
        '',
        card.attendance.classesTaken,
        card.attendance.classesPresent,
        card.attendance.percentage
      ]);
      aoa.push([]);
      aoa.push([card.note]);
      aoa.push([`HOD: ${card.hodPhone || '8660155525'}`]);
      aoa.push(['Note: As we are sending only attendance % and Test is not conducted.']);
      aoa.push([]);
      aoa.push(['HOD', '', '', '', '', '', '', '', 'PRINCIPAL']);

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const sheetName = (card.student.enrollmentId || card.student.name || 'student')
        .toString()
        .slice(0, 28)
        .replace(/[\\/?*[\]]/g, '_');
      XLSX.utils.book_append_sheet(wb, ws, sheetName || `S${students.indexOf(student) + 1}`);
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report_cards_${month}.xlsx`
    );
    return res.status(200).send(buf);
  } catch (error) {
    console.error('Error generating report card excel:', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to generate Excel' });
  }
};

module.exports = {
  getMarksSheet,
  saveMarksSheet,
  getMarksSampleSheet,
  importMarksSheet,
  getMonthlyAttendance,
  exportMonthlyAttendanceExcel,
  exportStudentAttendanceSlipsExcel,
  generateReportCard,
  generateReportCardExcel,
  ALL_COMPONENTS,
  SCHEME
};
