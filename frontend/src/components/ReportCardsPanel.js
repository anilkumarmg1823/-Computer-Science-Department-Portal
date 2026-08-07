'use client';

import { useState, useEffect, useCallback } from 'react';

const DA_COMPONENTS = ['DA-1', 'DA-2', 'DA-3', 'DA-4', 'DA-5', 'DA-6', 'DA-7'];
const CIE_COMPONENTS = ['CIE-1', 'CIE-2', 'CIE-3', 'CIE-4', 'CIE-5'];
const HOD_PHONE = '8660155525';

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function resultClass(result) {
  if (result === 'PASS') return 'text-[#00B050] font-bold';
  if (result === 'FAIL' || result === 'Absent') return 'text-red-600 font-bold';
  return 'text-black';
}

function ReportHeader({ subjectLabel, monthLabel }) {
  return (
    <div className="relative mb-3">
      <div className="flex items-start gap-3">
        <img
          src="/sandur_logo.png"
          alt="Sandur Polytechnic"
          className="w-16 h-16 object-contain shrink-0"
        />
        <div className="flex-1 text-center pr-16">
          <h1 className="text-[18px] md:text-[22px] font-extrabold text-red-600 uppercase tracking-wide leading-tight">
            SANDUR POLYTECHNIC, YESHWANTNAGAR
          </h1>
          <p className="text-[13px] md:text-[15px] font-bold text-[#0070C0] uppercase mt-0.5">
            DEPARTMENT OF COMPUTER SCIENCE &amp; ENGG
          </p>
          <p className="text-[13px] md:text-[14px] font-bold text-black underline uppercase mt-1">
            IA MARKS &amp; ATTENDANCE DETAILS
          </p>
          {subjectLabel && (
            <p className="text-[13px] font-bold text-black underline mt-1">
              SUBJECT: {subjectLabel}
            </p>
          )}
        </div>
      </div>
      {monthLabel && (
        <p className="absolute top-0 right-0 text-[11px] font-bold text-black">
          MONTH/YEAR: {monthLabel}
        </p>
      )}
    </div>
  );
}

function StudentAttendanceSlip({ student, subjectName, monthLabel, semester, cell, th }) {
  return (
    <div className="bg-[#fffef0] border-2 border-black p-5 max-w-[210mm] mx-auto text-black">
      <ReportHeader subjectLabel={subjectName} monthLabel={monthLabel} />
      <p className="text-center text-[13px] font-bold underline mb-3 uppercase">
        Student Attendance Report
      </p>
      <div className="text-[12px] font-bold space-y-1 mb-4">
        <p>REGISTER NO: <span className="underline decoration-dotted">{student.enrollmentId || '—'}</span></p>
        <p>STUDENT NAME: <span className="underline decoration-dotted uppercase">{student.name}</span></p>
        <p>SEMESTER: {semester}</p>
      </div>
      <table className="w-full max-w-xl border-collapse mb-4">
        <thead>
          <tr>
            <th className={th}>Attendance</th>
            <th className={th}>No of classes taken</th>
            <th className={th}>No of classes present</th>
            <th className={th}>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={cell}></td>
            <td className={`${cell} font-bold`}>{student.classesTaken}</td>
            <td className={`${cell} font-bold`}>{student.classesPresent}</td>
            <td className={`${cell} font-bold text-[#00B0F0]`}>{student.percentage}</td>
          </tr>
        </tbody>
      </table>
      <div className="text-[11px] space-y-1 mb-10">
        {student.percentage < 75 ? (
          <p className="font-bold text-red-600 uppercase">
            Attention: Attendance is below 75%. Please contact HOD.
          </p>
        ) : (
          <p className="font-semibold text-emerald-700">Attendance status is satisfactory.</p>
        )}
        <p className="font-extrabold text-red-600">HOD: {HOD_PHONE}</p>
      </div>
      <div className="flex justify-between text-[13px] font-extrabold px-4">
        <span>HOD</span>
        <span>PRINCIPAL</span>
      </div>
    </div>
  );
}

export default function ReportCardsPanel({ API_BASE, triggerNotification }) {
  const [subTab, setSubTab] = useState('MARKS');
  const [semester, setSemester] = useState('Semester 3');
  const [subjectId, setSubjectId] = useState('');
  const [month, setMonth] = useState(currentMonthValue());
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [printMode, setPrintMode] = useState(null); // 'card' | 'attendance' | 'student-slip' | 'all-slips'
  const [selectedAttStudent, setSelectedAttStudent] = useState(null);
  const [showAttPreview, setShowAttPreview] = useState(false);

  const [marksRows, setMarksRows] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [importingMarks, setImportingMarks] = useState(false);

  const [attRows, setAttRows] = useState([]);
  const [attClassesTaken, setAttClassesTaken] = useState(0);
  const [attMonthLabel, setAttMonthLabel] = useState('');
  const [attSubject, setAttSubject] = useState(null);
  const [loadingAtt, setLoadingAtt] = useState(false);

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/subjects?semester=${encodeURIComponent(semester)}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
        setSubjectId((prev) => {
          if (prev && data.some((s) => s.id === prev)) return prev;
          return data[0]?.id || '';
        });
      } else {
        setSubjects([]);
        setSubjectId('');
      }
    } catch {
      setSubjects([]);
      setSubjectId('');
    } finally {
      setLoadingSubjects(false);
    }
  }, [API_BASE, semester]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const loadMarks = useCallback(async () => {
    if (!subjectId || !month) return;
    setLoadingMarks(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/report-cards/marks?semester=${encodeURIComponent(semester)}&subjectId=${encodeURIComponent(subjectId)}&month=${encodeURIComponent(month)}`
      );
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMarksRows(data.rows || []);
    } catch {
      setMarksRows([]);
      triggerNotification?.('✗ Failed to load marks sheet.');
    } finally {
      setLoadingMarks(false);
    }
  }, [API_BASE, semester, subjectId, month, triggerNotification]);

  const loadAttendance = useCallback(async () => {
    if (!subjectId || !month) return;
    setLoadingAtt(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/report-cards/attendance-monthly?semester=${encodeURIComponent(semester)}&subjectId=${encodeURIComponent(subjectId)}&month=${encodeURIComponent(month)}`
      );
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAttRows(data.students || []);
      setAttClassesTaken(data.classesTaken || 0);
      setAttMonthLabel(data.monthLabel || month);
      setAttSubject(data.subject || null);
    } catch {
      setAttRows([]);
      setAttClassesTaken(0);
      triggerNotification?.('✗ Failed to load monthly attendance.');
    } finally {
      setLoadingAtt(false);
    }
  }, [API_BASE, semester, subjectId, month, triggerNotification]);

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/semesters/${encodeURIComponent(semester)}/students`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        setSelectedStudentId((prev) => {
          if (prev && data.some((s) => s.id === prev)) return prev;
          return data[0]?.id || '';
        });
      }
    } catch {
      setStudents([]);
    }
  }, [API_BASE, semester]);

  useEffect(() => {
    if (subTab === 'MARKS') loadMarks();
    if (subTab === 'ATTENDANCE') loadAttendance();
    if (subTab === 'GENERATE') {
      loadStudents();
      setReportCard(null);
    }
  }, [subTab, loadMarks, loadAttendance, loadStudents]);

  const updateMarkCell = (studentId, component, value) => {
    setMarksRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        return {
          ...row,
          marks: {
            ...row.marks,
            [component]: { ...(row.marks[component] || {}), value }
          }
        };
      })
    );
  };

  const saveMarks = async () => {
    setSavingMarks(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/report-cards/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semester, subjectId, month, rows: marksRows })
      });
      if (!res.ok) throw new Error('Failed');
      triggerNotification?.('✓ Marks sheet saved.');
      await loadMarks();
    } catch {
      triggerNotification?.('✗ Failed to save marks.');
    } finally {
      setSavingMarks(false);
    }
  };

  const downloadMarksSample = () => {
    window.open(`${API_BASE}/api/admin/report-cards/marks/sample`, '_blank');
  };

  const importMarksFile = async (file) => {
    if (!file) return;
    setImportingMarks(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('semester', semester);
      fd.append('subjectId', subjectId);
      fd.append('month', month);
      const res = await fetch(`${API_BASE}/api/admin/report-cards/marks/import`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      triggerNotification?.(`✓ Imported marks for ${data.matched} student(s).`);
      await loadMarks();
    } catch (e) {
      triggerNotification?.(`✗ ${e.message || 'Import failed'}`);
    } finally {
      setImportingMarks(false);
    }
  };

  const exportAttendance = () => {
    const url = `${API_BASE}/api/admin/report-cards/attendance-monthly/export?semester=${encodeURIComponent(semester)}&subjectId=${encodeURIComponent(subjectId)}&month=${encodeURIComponent(month)}`;
    window.open(url, '_blank');
  };

  const loadReportCard = async () => {
    if (!selectedStudentId) return;
    setLoadingCard(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/report-cards/generate?semester=${encodeURIComponent(semester)}&subjectId=${encodeURIComponent(subjectId)}&month=${encodeURIComponent(month)}&studentId=${encodeURIComponent(selectedStudentId)}`
      );
      if (!res.ok) throw new Error('Failed');
      setReportCard(await res.json());
    } catch {
      setReportCard(null);
      triggerNotification?.('✗ Failed to generate report card.');
    } finally {
      setLoadingCard(false);
    }
  };

  const downloadExcel = (all = false) => {
    const params = new URLSearchParams({
      semester,
      subjectId,
      month,
      ...(all ? { all: 'true' } : { studentId: selectedStudentId })
    });
    window.open(`${API_BASE}/api/admin/report-cards/generate.xlsx?${params.toString()}`, '_blank');
  };

  const printCard = () => {
    setPrintMode('card');
    setTimeout(() => window.print(), 50);
  };

  const printAttendanceReport = () => {
    setSelectedAttStudent(null);
    setPrintMode('attendance');
    setTimeout(() => window.print(), 50);
  };

  const buildStudentAttMessage = (s) => {
    const subjectName = attSubject?.name || selectedSubject?.name || 'Subject';
    const status =
      s.percentage < 75
        ? `⚠️ Attendance is below 75%. Please contact HOD (${HOD_PHONE}).`
        : 'Attendance status is satisfactory.';
    return [
      `*Sandur Polytechnic — Student Attendance Report*`,
      `Semester: ${semester}`,
      `Subject: ${subjectName}`,
      `Month: ${attMonthLabel || month}`,
      '',
      `Register No: ${s.enrollmentId || '—'}`,
      `Student: ${s.name}`,
      `Classes taken: ${s.classesTaken}`,
      `Classes present: ${s.classesPresent}`,
      `Attendance %: ${s.percentage}%`,
      '',
      status,
      `HOD: ${HOD_PHONE}`
    ].join('\n');
  };

  const normalizeWhatsAppPhone = (phone) => {
    if (phone === null || phone === undefined || phone === '') return null;
    let raw = phone;
    if (typeof phone === 'number') {
      raw = Math.trunc(phone).toString();
    } else {
      raw = String(phone).trim();
      if (/e\+?/i.test(raw)) {
        raw = Math.trunc(Number(raw)).toString();
      }
    }
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.length === 10) digits = `91${digits}`;
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = `91${digits.slice(1)}`;
    }
    if (digits.length < 11 || digits.length > 15) return null;
    return digits;
  };

  const copyStudentAttMessage = async (s) => {
    try {
      await navigator.clipboard.writeText(buildStudentAttMessage(s));
      triggerNotification?.(`✓ ${s.name}'s attendance message copied.`);
    } catch {
      triggerNotification?.('✗ Could not copy to clipboard.');
    }
  };

  const sendStudentWhatsApp = (s) => {
    let phone = normalizeWhatsAppPhone(s.phone);
    if (!phone) {
      const entered = window.prompt(
        `No valid phone on file for ${s.name}.\nEnter WhatsApp number (10 digits or with country code):`,
        s.phone ? String(s.phone) : ''
      );
      if (!entered) {
        triggerNotification?.('WhatsApp cancelled — no number entered.');
        return;
      }
      phone = normalizeWhatsAppPhone(entered);
      if (!phone) {
        triggerNotification?.('✗ Invalid WhatsApp number.');
        return;
      }
    }
    const text = encodeURIComponent(buildStudentAttMessage(s));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    triggerNotification?.(`✓ Opening WhatsApp for ${s.name} (${phone})`);
  };

  const previewStudentSlip = (s) => {
    setSelectedAttStudent(s);
    setPrintMode(null);
    setShowAttPreview(true);
  };

  const printStudentSlip = (s) => {
    setSelectedAttStudent(s);
    setShowAttPreview(true);
    setPrintMode('student-slip');
    setTimeout(() => window.print(), 80);
  };

  const printAllStudentSlips = () => {
    setShowAttPreview(false);
    setSelectedAttStudent(null);
    setPrintMode('all-slips');
    setTimeout(() => window.print(), 80);
  };

  const downloadStudentSlipExcel = (s) => {
    const params = new URLSearchParams({
      semester,
      subjectId,
      month,
      studentId: s.studentId
    });
    window.open(
      `${API_BASE}/api/admin/report-cards/attendance-monthly/student-slips.xlsx?${params}`,
      '_blank'
    );
  };

  const downloadAllStudentSlipsExcel = () => {
    const params = new URLSearchParams({
      semester,
      subjectId,
      month,
      all: 'true'
    });
    window.open(
      `${API_BASE}/api/admin/report-cards/attendance-monthly/student-slips.xlsx?${params}`,
      '_blank'
    );
  };

  const copyAttendanceSummary = async () => {
    const subjectName = attSubject?.name || selectedSubject?.name || 'Subject';
    const lines = [
      `Sandur Polytechnic — Monthly Attendance`,
      `${semester} | ${subjectName} | ${attMonthLabel || month}`,
      `Classes taken: ${attClassesTaken}`,
      '',
      ...attRows.map(
        (s) =>
          `${s.enrollmentId || '-'} | ${s.name} | Present ${s.classesPresent}/${s.classesTaken} | ${s.percentage}%`
      )
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      triggerNotification?.('✓ Attendance summary copied — paste in WhatsApp / email.');
    } catch {
      triggerNotification?.('✗ Could not copy to clipboard.');
    }
  };

  const subTabs = [
    { id: 'MARKS', label: 'Marks Sheet' },
    { id: 'ATTENDANCE', label: 'Monthly Attendance' },
    { id: 'GENERATE', label: 'Generate Report Card' }
  ];

  const cell = 'border border-black px-1.5 py-1 text-center text-[11px]';
  const th = 'border border-black px-1.5 py-1 text-center text-[10px] font-bold uppercase bg-[#fffde7]';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col space-y-1.5 border-b border-[#ede6dc]/45 pb-3 print:hidden">
        <h3 className="text-base font-extrabold text-[#2d1b18] flex items-center space-x-2">
          <span className="w-1.5 h-5 bg-[#4a2c2a] rounded-full"></span>
          <span>Report Cards</span>
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Marks sheet, monthly attendance reports, and Sandur Polytechnic IA report cards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18]"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={`Semester ${n}`}>Semester {n}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={loadingSubjects || subjects.length === 0}
            className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18]"
          >
            {subjects.length === 0 && <option value="">No subjects</option>}
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {subTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
              subTab === t.id
                ? 'bg-[#4a2c2a] text-white'
                : 'bg-[#f3ede2] text-[#4a2c2a] border border-[#ede6dc] hover:bg-[#ede6dc]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MARKS */}
      {subTab === 'MARKS' && (
        <div className="space-y-4 print:hidden">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadMarks} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">Refresh</button>
            <button type="button" onClick={downloadMarksSample} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">Download Template</button>
            <label className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">
              {importingMarks ? 'Importing…' : 'Import Excel'}
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={importingMarks || !subjectId}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importMarksFile(f);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              type="button"
              onClick={saveMarks}
              disabled={savingMarks || !subjectId || marksRows.length === 0}
              className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#4a2c2a] text-white cursor-pointer disabled:opacity-50"
            >
              {savingMarks ? 'Saving…' : 'Save Marks'}
            </button>
          </div>

          {loadingMarks ? (
            <p className="text-xs text-slate-500">Loading marks…</p>
          ) : (
            <div className="overflow-x-auto border border-[#ede6dc] rounded-2xl bg-white">
              <table className="min-w-full text-[10px]">
                <thead className="bg-[#faf7f2] sticky top-0">
                  <tr className="text-left text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-2 font-bold whitespace-nowrap">Reg No</th>
                    <th className="px-3 py-2 font-bold whitespace-nowrap">Name</th>
                    {[...DA_COMPONENTS, ...CIE_COMPONENTS].map((c) => (
                      <th key={c} className="px-2 py-2 font-bold text-center">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marksRows.map((row) => (
                    <tr key={row.studentId} className="border-t border-[#ede6dc]/60">
                      <td className="px-3 py-1.5 whitespace-nowrap font-semibold">{row.enrollmentId || '—'}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap font-semibold">{row.name}</td>
                      {[...DA_COMPONENTS, ...CIE_COMPONENTS].map((c) => (
                        <td key={c} className="px-1 py-1">
                          <input
                            value={row.marks?.[c]?.value ?? ''}
                            onChange={(e) => updateMarkCell(row.studentId, c, e.target.value)}
                            placeholder="—"
                            className="w-12 text-center border border-[#ede6dc] rounded-md px-1 py-1 text-[10px] focus:outline-none focus:border-[#4a2c2a]"
                            title="Number or AB"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {marksRows.length === 0 && (
                    <tr>
                      <td colSpan={2 + DA_COMPONENTS.length + CIE_COMPONENTS.length} className="px-3 py-6 text-center text-slate-400">
                        No students for this semester, or select a subject.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            DA max 10 / pass 4 · CIE max 30 / pass 18 · Use <strong>AB</strong> for absent.
          </p>
        </div>
      )}

      {/* MONTHLY ATTENDANCE — class report + per-student send */}
      {subTab === 'ATTENDANCE' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center print:hidden">
            <button type="button" onClick={loadAttendance} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">Refresh</button>
            <button type="button" onClick={exportAttendance} disabled={!subjectId} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#4a2c2a] text-white cursor-pointer disabled:opacity-50">Export Class Excel</button>
            <button type="button" onClick={printAttendanceReport} disabled={attRows.length === 0} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer disabled:opacity-50">Print Class Report</button>
            <button type="button" onClick={downloadAllStudentSlipsExcel} disabled={attRows.length === 0} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer disabled:opacity-50">Download All Student Slips</button>
            <button type="button" onClick={printAllStudentSlips} disabled={attRows.length === 0} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer disabled:opacity-50">Print All Student Slips</button>
            <button type="button" onClick={copyAttendanceSummary} disabled={attRows.length === 0} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer disabled:opacity-50">Copy Class Summary</button>
            <span className="text-[11px] text-slate-500 font-medium">
              Classes taken: <strong className="text-[#2d1b18]">{attClassesTaken}</strong>
            </span>
          </div>

          {loadingAtt ? (
            <p className="text-xs text-slate-500 print:hidden">Loading attendance…</p>
          ) : (
            <>
              <div className="overflow-x-auto border border-[#ede6dc] rounded-2xl bg-white print:hidden">
                <table className="min-w-full text-xs">
                  <thead className="bg-[#faf7f2]">
                    <tr className="text-left text-[10px] text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3 font-bold">Reg No</th>
                      <th className="px-4 py-3 font-bold">Name</th>
                      <th className="px-4 py-3 font-bold">Phone</th>
                      <th className="px-4 py-3 font-bold text-center">Taken</th>
                      <th className="px-4 py-3 font-bold text-center">Present</th>
                      <th className="px-4 py-3 font-bold text-center">%</th>
                      <th className="px-4 py-3 font-bold text-center">Send report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attRows.map((s) => (
                      <tr key={s.studentId} className={`border-t border-[#ede6dc]/60 ${selectedAttStudent?.studentId === s.studentId ? 'bg-[#faf7f2]' : ''}`}>
                        <td className="px-4 py-2.5 font-semibold">{s.enrollmentId || '—'}</td>
                        <td className="px-4 py-2.5 font-semibold">{s.name}</td>
                        <td className="px-4 py-2.5 text-[10px] text-slate-600 whitespace-nowrap">
                          {s.phone || <span className="text-red-500">No phone</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">{s.classesTaken}</td>
                        <td className="px-4 py-2.5 text-center">{s.classesPresent}</td>
                        <td className={`px-4 py-2.5 text-center font-bold ${s.percentage < 75 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {s.percentage}%
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            <button type="button" onClick={() => previewStudentSlip(s)} className="px-2 py-1 rounded-md text-[9px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">Preview</button>
                            <button type="button" onClick={() => printStudentSlip(s)} className="px-2 py-1 rounded-md text-[9px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">Print</button>
                            <button type="button" onClick={() => downloadStudentSlipExcel(s)} className="px-2 py-1 rounded-md text-[9px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">Excel</button>
                            <button type="button" onClick={() => copyStudentAttMessage(s)} className="px-2 py-1 rounded-md text-[9px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer">Copy</button>
                            <button type="button" onClick={() => sendStudentWhatsApp(s)} className="px-2 py-1 rounded-md text-[9px] font-bold bg-[#25D366] text-white cursor-pointer">WhatsApp</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {attRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-xs">
                          No attendance data for this month/subject.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Preview modal — always visible on Preview click */}
              {showAttPreview && selectedAttStudent && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 print:hidden">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-[900px] w-full max-h-[92vh] overflow-y-auto relative">
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-white border-b border-[#ede6dc] px-4 py-3 rounded-t-2xl">
                      <div>
                        <p className="text-xs font-extrabold text-[#2d1b18]">Student Attendance Slip</p>
                        <p className="text-[10px] text-slate-500">
                          {selectedAttStudent.name}
                          {selectedAttStudent.phone ? ` · ${selectedAttStudent.phone}` : ' · No phone on file'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => printStudentSlip(selectedAttStudent)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#4a2c2a] text-white cursor-pointer"
                        >
                          Print / PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => sendStudentWhatsApp(selectedAttStudent)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#25D366] text-white cursor-pointer"
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAttPreview(false)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <StudentAttendanceSlip
                        student={selectedAttStudent}
                        subjectName={attSubject?.name || selectedSubject?.name}
                        monthLabel={attMonthLabel || month}
                        semester={semester}
                        cell={cell}
                        th={th}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Print: class report */}
              <div
                id="attendance-report-print"
                className="hidden print:block bg-[#fffef0] border-2 border-black p-5 max-w-[210mm] mx-auto text-black"
              >
                <ReportHeader
                  subjectLabel={attSubject?.name || selectedSubject?.name}
                  monthLabel={attMonthLabel || month}
                />
                <p className="text-center text-[12px] font-bold underline mb-3">
                  MONTHLY ATTENDANCE REPORT — {semester}
                </p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>Sl.No</th>
                      <th className={th}>Register No</th>
                      <th className={th}>Student Name</th>
                      <th className={th}>Classes Taken</th>
                      <th className={th}>Present</th>
                      <th className={th}>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attRows.map((s, i) => (
                      <tr key={s.studentId}>
                        <td className={cell}>{i + 1}</td>
                        <td className={cell}>{s.enrollmentId || '—'}</td>
                        <td className={`${cell} text-left font-semibold`}>{s.name}</td>
                        <td className={cell}>{s.classesTaken}</td>
                        <td className={cell}>{s.classesPresent}</td>
                        <td className={`${cell} font-bold ${s.percentage < 75 ? 'text-red-600' : 'text-[#0070C0]'}`}>
                          {s.percentage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-red-600 mt-3 font-semibold">
                  Note: Students below 75% attendance must contact HOD ({HOD_PHONE}).
                </p>
                <div className="flex justify-between text-[12px] font-bold mt-14 px-4">
                  <span>HOD</span>
                  <span>PRINCIPAL</span>
                </div>
              </div>

              {/* Print: single student slip */}
              {selectedAttStudent && (
                <div id="student-att-slip-print" className="hidden print:block">
                  <StudentAttendanceSlip
                    student={selectedAttStudent}
                    subjectName={attSubject?.name || selectedSubject?.name}
                    monthLabel={attMonthLabel || month}
                    semester={semester}
                    cell={cell}
                    th={th}
                  />
                </div>
              )}

              {/* Print: all student slips */}
              <div id="all-student-slips-print" className="hidden print:block">
                {attRows.map((s) => (
                  <div key={s.studentId} className="student-slip-page mb-6">
                    <StudentAttendanceSlip
                      student={s}
                      subjectName={attSubject?.name || selectedSubject?.name}
                      monthLabel={attMonthLabel || month}
                      semester={semester}
                      cell={cell}
                      th={th}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* GENERATE — branded report card like XLSM */}
      {subTab === 'GENERATE' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end print:hidden">
            <div className="space-y-1 min-w-[220px] flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(s.enrollmentId || '—') + ' — ' + s.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={loadReportCard} disabled={!selectedStudentId || !subjectId || loadingCard} className="px-4 py-2.5 rounded-xl text-[11px] font-bold bg-[#4a2c2a] text-white cursor-pointer disabled:opacity-50">
              {loadingCard ? 'Loading…' : 'Preview'}
            </button>
            <button type="button" onClick={() => downloadExcel(false)} disabled={!selectedStudentId || !subjectId} className="px-4 py-2.5 rounded-xl text-[11px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer disabled:opacity-50">
              Download Excel
            </button>
            <button type="button" onClick={() => downloadExcel(true)} disabled={!subjectId} className="px-4 py-2.5 rounded-xl text-[11px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer disabled:opacity-50">
              Download All Excel
            </button>
            <button type="button" onClick={printCard} disabled={!reportCard} className="px-4 py-2.5 rounded-xl text-[11px] font-bold bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] cursor-pointer disabled:opacity-50">
              Print / PDF
            </button>
          </div>

          {reportCard && (
            <div
              id="report-card-print"
              className="bg-[#fffef0] border-2 border-black p-4 md:p-6 max-w-[210mm] mx-auto text-black shadow-sm print:shadow-none"
            >
              <ReportHeader
                subjectLabel={reportCard.subject.name}
                monthLabel={reportCard.monthLabel}
              />

              <div className="grid grid-cols-1 gap-1 text-[12px] font-bold mb-3 mt-2">
                <p>
                  REGISTER NO:&nbsp;
                  <span className="underline decoration-dotted">{reportCard.student.enrollmentId || '—'}</span>
                </p>
                <p>
                  STUDENT NAME:&nbsp;
                  <span className="underline decoration-dotted uppercase">{reportCard.student.name}</span>
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 items-start">
                {/* DA table */}
                <table className="w-full lg:w-[48%] border-collapse shrink-0">
                  <thead>
                    <tr>
                      <th className={th}></th>
                      <th className={th}>TOTAL MARKS</th>
                      <th className={th}>PASSING</th>
                      <th className={th}>MARKS OBTAINED</th>
                      <th className={th}>PASS/FAIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard.da.map((r) => (
                      <tr key={r.component}>
                        <td className={`${cell} font-bold text-left`}>{r.component}</td>
                        <td className={cell}>{r.total}</td>
                        <td className={cell}>{r.passing}</td>
                        <td className={cell}>{r.obtained || '—'}</td>
                        <td className={`${cell} ${resultClass(r.result)}`}>{r.result || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* CIE + attendance + note */}
                <div className="w-full lg:w-[52%] space-y-3">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={th}></th>
                        <th className={th}>TOTAL MARKS</th>
                        <th className={th}>PASSING MARKS</th>
                        <th className={th}>MARKS OBTAINED</th>
                        <th className={th}>PASS/FAIL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCard.cie.map((r) => (
                        <tr key={r.component}>
                          <td className={`${cell} font-bold text-left`}>{r.component}</td>
                          <td className={cell}>{r.total}</td>
                          <td className={cell}>{r.passing}</td>
                          <td className={cell}>{r.obtained || '—'}</td>
                          <td className={`${cell} ${resultClass(r.result)}`}>{r.result || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={`${th} w-[22%]`}>Attendance</th>
                        <th className={th}>No of classes taken</th>
                        <th className={th}>No of classes present</th>
                        <th className={th}>Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={cell}></td>
                        <td className={`${cell} font-bold`}>{reportCard.attendance.classesTaken}</td>
                        <td className={`${cell} font-bold`}>{reportCard.attendance.classesPresent}</td>
                        <td className={`${cell} font-bold text-[#00B0F0]`}>
                          {reportCard.attendance.percentage}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-[11px] leading-snug space-y-1 pl-1">
                    <p className="font-bold uppercase">
                      PLEASE CONTACT HOD,<br />
                      IF YOUR SON/DAUGHTER IS FAILED IN ANY SUBJECT.
                    </p>
                    <p className="font-extrabold text-red-600">HOD: {HOD_PHONE}</p>
                    <p className="text-red-600 text-[10px]">
                      Note: As we are sending only attendance % and Test is not conducted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[13px] font-extrabold mt-16 px-6">
                <span>HOD</span>
                <span>PRINCIPAL</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden !important; }
          ${
            printMode === 'attendance'
              ? '#attendance-report-print, #attendance-report-print *'
              : printMode === 'student-slip'
                ? '#student-att-slip-print, #student-att-slip-print *'
                : printMode === 'all-slips'
                  ? '#all-student-slips-print, #all-student-slips-print *'
                  : '#report-card-print, #report-card-print *'
          } {
            visibility: visible !important;
          }
          ${
            printMode === 'attendance'
              ? '#attendance-report-print'
              : printMode === 'student-slip'
                ? '#student-att-slip-print'
                : printMode === 'all-slips'
                  ? '#all-student-slips-print'
                  : '#report-card-print'
          } {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background: #fffef0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .student-slip-page {
            page-break-after: always;
            break-after: page;
          }
          .student-slip-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
