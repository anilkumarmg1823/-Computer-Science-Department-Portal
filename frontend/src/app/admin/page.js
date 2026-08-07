'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaChevronRight, FaLock, FaBook, FaFlask, FaFileAlt, FaCalendarAlt, FaBars, FaTimes, FaPencilAlt, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import ReportCardsPanel from '@/components/ReportCardsPanel';

// ── Mock data ────────────────────────────────────────────────────────────────
const mockFacultyList = [
  { id: 'f1', name: 'Dr. Anil Kumar M.G.', designation: 'Hod', department: 'CSE', email: 'anilkumar@sanpoly.edu.in' },
  { id: 'f2', name: 'Mrs. Rekha Patil', designation: 'Lecturer', department: 'CSE', email: 'rekhapatil@sanpoly.edu.in' },
  { id: 'f3', name: 'Mr. Shivasharanappa K.', designation: 'Senior Lecturer', department: 'AI_DS', email: 'shiva.k@sanpoly.edu.in' },
  { id: 'f4', name: 'Miss. Deepika R.', designation: 'Asst Lecturer', department: 'AI_DS', email: 'deepikar@sanpoly.edu.in' },
  { id: 'f5', name: 'Mr. Nagaraj Gowda', designation: 'Senior Lecturer', department: 'CSE', email: 'nagarajg@sanpoly.edu.in' },
];

const mockResourcesList = [
  { id: 'r1', title: 'Data Structures and Algorithms', category: 'Notes', semester: 'Semester 3', code: 'CS-301', uploadedBy: 'Mrs. Rekha Patil' },
  { id: 'r2', title: 'Database Management Systems', category: 'Notes', semester: 'Semester 3', code: 'CS-302', uploadedBy: 'Dr. Anil Kumar M.G.' },
  { id: 'r3', title: 'PC Hardware & Troubleshooting Lab Manual', category: 'Lab Manual', semester: 'Semester 3', code: 'CSL-307', uploadedBy: 'Mr. Nagaraj Gowda' },
  { id: 'r4', title: 'Data Structures - 2024 Board Paper', category: 'Question Paper', semester: 'Semester 3', code: 'CS-301', uploadedBy: 'Dr. Anil Kumar M.G.' },
];

// ── Reusable form field components ───────────────────────────────────────────
function FieldLabel({ children }) {
  return <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{children}</label>;
}

function TextInput({ value, onChange, type = 'text', required = false }) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
    />
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
    >
      {children}
    </select>
  );
}

function SubmitButton({ children, ...props }) {
  return (
    <button
      type="submit"
      {...props}
      className={`w-full py-3 rounded-xl font-bold bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs transition-colors duration-200 shadow-md shadow-[#4a2c2a]/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white border border-[#ede6dc]/70 rounded-2xl p-5 flex items-center space-x-4">
      <div className="w-10 h-10 rounded-xl bg-[#f3ede2] border border-[#ede6dc] flex items-center justify-center text-[#4a2c2a] shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-[#2d1b18]">{value}</p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Admin() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          // If faculty, fetch their full profile from the DB
          if (parsed?.role === 'FACULTY' && parsed?.email) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/faculty/by-email/${encodeURIComponent(parsed.email)}`)
              .then(r => r.ok ? r.json() : null)
              .then(profile => { if (profile) setFacultyProfile(profile); })
              .catch(() => {});
          }
        } catch (e) {
          console.error('Failed to parse user session', e);
        }
      }
    }
  }, []);

  const [uploadSubTab, setUploadSubTab] = useState('NOTES');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar drawer when active tab changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeTab]);

  const [notification, setNotification] = useState(null);
  const [facultyProfile, setFacultyProfile] = useState(null);

  // Hover Tooltip States for Charts
  const [hoveredDoughnut, setHoveredDoughnut] = useState(null);
  const [hoveredGender, setHoveredGender] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [notesForm, setNotesForm] = useState({ title: '', semester: 'Semester 1', courseCode: '', file: null });
  const [manualsForm, setManualsForm] = useState({ title: '', lab: 'PC Hardware & Networking Lab', courseCode: '', file: null, semester: 'Semester 1' });
  const [timetableForm, setTimetableForm] = useState({ semester: 'Semester 1', effectiveFrom: '', file: null });
  const [syllabusForm, setSyllabusForm] = useState({ title: '', semester: 'Semester 1', courseCode: '', file: null });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', category: 'GENERAL', content: '', attachmentUrl: '' });
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', department: 'CSE', designation: 'Lecturer', qualification: '', experience: '', officeHours: '', publications: '' });

  // Class Manager states
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesterStudents, setSemesterStudents] = useState([]);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddFacultyModalOpen, setIsAddFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [isEditFacultyModalOpen, setIsEditFacultyModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', password: 'password123', gender: 'MALE', enrollmentId: '', group: 'Group A' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', credits: 3, theory: '4 hrs/wk', practical: '0 hrs/wk', type: 'Core Theory' });
  const [loadingSemester, setLoadingSemester] = useState(false);
  const [semesterSubjectsList, setSemesterSubjectsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSemester, setAttendanceSemester] = useState('Semester 1');
  const [attendanceSubjectId, setAttendanceSubjectId] = useState('');
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [loadingAttendanceStudents, setLoadingAttendanceStudents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [submittingFaculty, setSubmittingFaculty] = useState(false);
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [submittingSubject, setSubmittingSubject] = useState(false);
  const [dashboardAttendanceSem, setDashboardAttendanceSem] = useState('Semester 3');
  const [dashAttendanceDate, setDashAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dashAttendanceSubjectId, setDashAttendanceSubjectId] = useState('');
  const [dailyAttendanceData, setDailyAttendanceData] = useState(null);
  const [loadingDailyAttendance, setLoadingDailyAttendance] = useState(false);

  // Bulk Student Excel Import states
  const [addStudentMode, setAddStudentMode] = useState('manual'); // 'manual' | 'excel'
  const [excelFile, setExcelFile] = useState(null);
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'clear'
  const [importStatus, setImportStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [importSummary, setImportSummary] = useState(null);

  // Reset Excel states when modal closes
  useEffect(() => {
    if (!isAddStudentModalOpen) {
      setAddStudentMode('manual');
      setExcelFile(null);
      setImportMode('merge');
      setImportStatus('idle');
      setImportSummary(null);
    }
  }, [isAddStudentModalOpen]);

  // Faculty Photo Upload States
  const [facultyPhotoFile, setFacultyPhotoFile] = useState(null);
  const [editingFacultyPhotoFile, setEditingFacultyPhotoFile] = useState(null);
  const [isChangePhotoModalOpen, setIsChangePhotoModalOpen] = useState(false);
  const [changePhotoFile, setChangePhotoFile] = useState(null);
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  // Reset Faculty Photo states when modals close
  useEffect(() => {
    if (!isAddFacultyModalOpen) {
      setFacultyPhotoFile(null);
    }
  }, [isAddFacultyModalOpen]);

  useEffect(() => {
    if (!isEditFacultyModalOpen) {
      setEditingFacultyPhotoFile(null);
    }
  }, [isEditFacultyModalOpen]);

  // Custom Timetable Grid States & Functions
  const [timetableMode, setTimetableMode] = useState('upload'); // 'upload' | 'customize'
  const [selectedTimetableSem, setSelectedTimetableSem] = useState('Semester 1');
  const [customSlots, setCustomSlots] = useState([]);
  const [newSlotForm, setNewSlotForm] = useState({ timeSlot: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' });
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // Student Passwords Visibility States
  const [showAddStudentPassword, setShowAddStudentPassword] = useState(false);
  const [showEditStudentPassword, setShowEditStudentPassword] = useState(false);

  const fetchCustomSlots = async (sem) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/timetable?semester=${encodeURIComponent(sem)}`);
      if (res.ok) {
        setCustomSlots(await res.json());
      }
    } catch (err) {
      console.error('Error fetching custom slots:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'UPLOADS' && uploadSubTab === 'TIMETABLE' && timetableMode === 'customize') {
      fetchCustomSlots(selectedTimetableSem);
    }
  }, [activeTab, uploadSubTab, timetableMode, selectedTimetableSem]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newSlotForm.timeSlot) {
      triggerNotification('Time slot name is required (e.g. 09:00 AM - 10:00 AM).');
      return;
    }
    setIsSavingSlot(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: selectedTimetableSem,
          ...newSlotForm
        })
      });
      if (res.ok) {
        const newSlot = await res.json();
        setCustomSlots([...customSlots, newSlot]);
        setNewSlotForm({ timeSlot: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' });
        triggerNotification('✓ Timetable row added successfully.');
      } else {
        triggerNotification('✗ Failed to add timetable row.');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('✗ Network error saving timetable row.');
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleUpdateSlot = async (slotId, updatedData) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/timetable/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        triggerNotification('✓ Timetable slot updated successfully.');
        setCustomSlots(customSlots.map(s => s.id === slotId ? { ...s, ...updatedData } : s));
      } else {
        triggerNotification('✗ Failed to update slot.');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('✗ Network error updating slot.');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    askConfirmation(
      'Delete Timetable Slot',
      'Are you sure you want to delete this time slot row? This will update the student view immediately.',
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/timetable/${slotId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setCustomSlots(customSlots.filter(s => s.id !== slotId));
            triggerNotification('✓ Timetable slot row deleted.');
          } else {
            triggerNotification('✗ Failed to delete slot.');
          }
        } catch (err) {
          console.error(err);
          triggerNotification('✗ Network error deleting slot.');
        }
      },
      'Delete Row',
      'Cancel'
    );
  };

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isLoading: false
  });

  const askConfirmation = (title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await onConfirm();
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
      confirmText,
      cancelText,
      isLoading: false
    });
  };

  // Database loaded states
  const [resourcesList, setResourcesList] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalResources: 0,
    totalAnnouncements: 0,
    genderDistribution: { boys: 0, girls: 0 },
    semesterDistribution: {
      'Semester 1': 0,
      'Semester 2': 0,
      'Semester 3': 0,
      'Semester 4': 0,
      'Semester 5': 0,
      'Semester 6': 0
    },
    semesterGenderDistribution: {
      'Semester 1': { boys: 0, girls: 0 },
      'Semester 2': { boys: 0, girls: 0 },
      'Semester 3': { boys: 0, girls: 0 },
      'Semester 4': { boys: 0, girls: 0 },
      'Semester 5': { boys: 0, girls: 0 },
      'Semester 6': { boys: 0, girls: 0 }
    },
    resourceCategoryDistribution: {
      'Notes': 0,
      'Manuals': 0,
      'Exam Papers': 0,
      'Syllabus': 0
    },
    attendanceStats: {
      'Semester 1': { present: 0, absent: 0 },
      'Semester 2': { present: 0, absent: 0 },
      'Semester 3': { present: 0, absent: 0 },
      'Semester 4': { present: 0, absent: 0 },
      'Semester 5': { present: 0, absent: 0 },
      'Semester 6': { present: 0, absent: 0 }
    }
  });
  const [loading, setLoading] = useState(true);

  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, facultyRes, resourcesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`),
        fetch(`${API_BASE}/api/faculty`),
        fetch(`${API_BASE}/api/resources`)
      ]);
      
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (facultyRes.ok) {
        setFacultyList(await facultyRes.json());
      }
      if (resourcesRes.ok) {
        setResourcesList(await resourcesRes.json());
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/subjects`);
      if (res.ok) {
        setSubjectsList(await res.json());
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchSemesterSubjects = async (sem) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/subjects?semester=${encodeURIComponent(sem)}`);
      if (res.ok) {
        setSemesterSubjectsList(await res.json());
      }
    } catch (err) {
      console.error('Error fetching semester subjects:', err);
    }
  };

  const handleLoadAttendanceRoster = async (overrideSubId, overrideSem, overrideDate) => {
    const subId = overrideSubId || attendanceSubjectId;
    const date = overrideDate || attendanceDate;
    
    if (!subId) {
      triggerNotification('✗ Please select a subject.');
      return;
    }
    setLoadingAttendanceStudents(true);
    try {
      const sem = overrideSem || (currentUser?.role === 'FACULTY' 
        ? subjectsList.find(s => s.id === subId)?.semester 
        : attendanceSemester);

      const studentsRes = await fetch(`${API_BASE}/api/admin/semesters/${encodeURIComponent(sem)}/students`);
      const existingAttendanceRes = await fetch(`${API_BASE}/api/attendance?date=${date}&subjectId=${subId}`);
      
      if (studentsRes.ok && existingAttendanceRes.ok) {
        const students = await studentsRes.json();
        const existing = await existingAttendanceRes.json();
        
        const mapped = students.map(student => {
          const matched = existing.find(e => e.studentId === student.id);
          return {
            ...student,
            status: matched ? matched.status : 'PRESENT'
          };
        });
        setAttendanceStudents(mapped);
      } else {
        triggerNotification('✗ Failed to load student roster or existing records.');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('✗ Network error loading roster.');
    } finally {
      setLoadingAttendanceStudents(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSubjects();
  }, []);

  useEffect(() => {
    const filtered = subjectsList.filter(sub => sub.semester === dashboardAttendanceSem);
    if (filtered.length > 0) {
      if (!filtered.some(f => f.id === dashAttendanceSubjectId)) {
        setDashAttendanceSubjectId(filtered[0].id);
      }
    } else {
      setDashAttendanceSubjectId('');
    }
  }, [dashboardAttendanceSem, subjectsList]);

  const fetchDailyAttendanceStats = async () => {
    if (!dashAttendanceSubjectId) {
      setDailyAttendanceData(null);
      return;
    }
    setLoadingDailyAttendance(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/daily-attendance-stats?date=${dashAttendanceDate}&subjectId=${dashAttendanceSubjectId}`);
      if (res.ok) {
        setDailyAttendanceData(await res.json());
      } else {
        setDailyAttendanceData(null);
      }
    } catch (err) {
      console.error('Error fetching daily attendance stats:', err);
      setDailyAttendanceData(null);
    } finally {
      setLoadingDailyAttendance(false);
    }
  };

  useEffect(() => {
    fetchDailyAttendanceStats();
  }, [dashAttendanceDate, dashAttendanceSubjectId]);



  const handleNotesSubmit = async (e) => {
    e.preventDefault();
    if (!notesForm.title) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', notesForm.title);
      formData.append('description', `Study Notes for ${notesForm.semester}`);
      formData.append('category', 'NOTES');
      formData.append('courseCode', notesForm.courseCode || 'GEN-CS');
      formData.append('semester', notesForm.semester);
      if (notesForm.file) {
        formData.append('file', notesForm.file);
      }

      const res = await fetch(`${API_BASE}/api/resources`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newRes = await res.json();
        setResourcesList([newRes, ...resourcesList]);
        triggerNotification(`✓ Notes "${notesForm.title}" uploaded & cataloged successfully.`);
        setNotesForm({ title: '', semester: 'Semester 1', courseCode: '', file: null });
        
        // Refresh overview stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        triggerNotification(`✗ Failed to upload notes.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error uploading notes.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualsSubmit = async (e) => {
    e.preventDefault();
    if (!manualsForm.title) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', manualsForm.title);
      formData.append('description', `Lab Manual for ${manualsForm.lab}`);
      formData.append('category', 'LAB_MANUAL');
      formData.append('courseCode', manualsForm.courseCode || 'LAB-CS');
      formData.append('semester', manualsForm.semester);
      if (manualsForm.file) {
        formData.append('file', manualsForm.file);
      }

      const res = await fetch(`${API_BASE}/api/resources`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newRes = await res.json();
        setResourcesList([newRes, ...resourcesList]);
        triggerNotification(`✓ Lab Manual "${manualsForm.title}" uploaded.`);
        setManualsForm({ title: '', lab: 'PC Hardware & Networking Lab', courseCode: '', file: null, semester: 'Semester 1' });
        
        // Refresh overview stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        triggerNotification(`✗ Failed to upload lab manual.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error uploading lab manual.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyllabusSubmit = async (e) => {
    e.preventDefault();
    if (!syllabusForm.title) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', syllabusForm.title);
      formData.append('description', `Syllabus Guide for ${syllabusForm.semester}`);
      formData.append('category', 'SYLLABUS');
      formData.append('courseCode', syllabusForm.courseCode || 'SYL-CS');
      formData.append('semester', syllabusForm.semester);
      if (syllabusForm.file) {
        formData.append('file', syllabusForm.file);
      }

      const res = await fetch(`${API_BASE}/api/resources`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newRes = await res.json();
        setResourcesList([newRes, ...resourcesList]);
        triggerNotification(`✓ Syllabus "${syllabusForm.title}" uploaded successfully.`);
        setSyllabusForm({ title: '', semester: 'Semester 1', courseCode: '', file: null });
        
        // Refresh overview stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        triggerNotification(`✗ Failed to upload syllabus.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error uploading syllabus.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTimetableSubmit = async (e) => {
    e.preventDefault();
    if (!timetableForm.file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', `Academic Timetable - ${timetableForm.semester}`);
      formData.append('description', timetableForm.effectiveFrom ? `Effective from: ${timetableForm.effectiveFrom}` : `Academic Timetable`);
      formData.append('category', 'TIMETABLE');
      formData.append('courseCode', 'TT-CS');
      formData.append('semester', timetableForm.semester);
      formData.append('file', timetableForm.file);

      const res = await fetch(`${API_BASE}/api/resources`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newRes = await res.json();
        setResourcesList([newRes, ...resourcesList]);
        triggerNotification(`✓ Timetable for ${timetableForm.semester} uploaded & published successfully.`);
        setTimetableForm({ semester: 'Semester 1', effectiveFrom: '', file: null });
        
        // Refresh overview stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        triggerNotification(`✗ Failed to publish timetable.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error publishing timetable.`);
    } finally {
      setIsUploading(false);
    }
  };
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;
    setSubmittingAnnouncement(true);
    try {
      const res = await fetch(`${API_BASE}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementForm.title,
          content: announcementForm.content,
          category: announcementForm.category,
          attachmentUrl: announcementForm.attachmentUrl || null
        })
      });
      if (res.ok) {
        triggerNotification(`✓ Announcement "${announcementForm.title}" published successfully.`);
        setAnnouncementForm({ title: '', category: 'GENERAL', content: '', attachmentUrl: '' });
        
        // Refresh overview stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        triggerNotification(`✗ Failed to publish announcement.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error publishing announcement.`);
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    if (!facultyForm.name || !facultyForm.email) return;
    setSubmittingFaculty(true);
    try {
      const formData = new FormData();
      formData.append('name', facultyForm.name);
      formData.append('email', facultyForm.email);
      formData.append('department', facultyForm.department);
      formData.append('designation', facultyForm.designation);
      formData.append('qualification', facultyForm.qualification || 'B.E., M.Tech');
      formData.append('experience', facultyForm.experience || '2 Years of Experience');
      formData.append('officeHours', facultyForm.officeHours || 'Daily: 10:00 AM - 11:00 AM');
      formData.append('researchPublications', facultyForm.publications ? JSON.stringify(facultyForm.publications.split('\n').filter(Boolean)) : JSON.stringify([]));
      
      if (facultyPhotoFile) {
        formData.append('photo', facultyPhotoFile);
      }

      const res = await fetch(`${API_BASE}/api/faculty`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newFac = await res.json();
        setFacultyList([newFac, ...facultyList]);
        triggerNotification(`✓ Faculty profile for "${facultyForm.name}" created.`);
        setFacultyForm({ name: '', email: '', department: 'CSE', designation: 'Lecturer', qualification: '', experience: '', officeHours: '', publications: '' });
        setFacultyPhotoFile(null);
        setIsAddFacultyModalOpen(false);
        
        // Refresh overview stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        const data = await res.json();
        triggerNotification(`✗ Failed to add faculty: ${data.error || 'Check fields'}`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error adding faculty.`);
    } finally {
      setSubmittingFaculty(false);
    }
  };
  const handleRemoveFaculty = async (id, name) => {
    askConfirmation(
      'Remove Faculty Member',
      `Are you sure you want to remove ${name} from the faculty directory? This action cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/faculty/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setFacultyList(facultyList.filter(f => f.id !== id));
            triggerNotification(`✓ Removed ${name} from Faculty Directory.`);
            
            // Refresh overview stats
            const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
            if (statsRes.ok) setStats(await statsRes.json());
          } else {
            triggerNotification(`✗ Failed to remove faculty member.`);
          }
        } catch (err) {
          console.error(err);
          triggerNotification(`✗ Network error removing faculty member.`);
        }
      },
      'Remove',
      'Cancel'
    );
  };

  const handleRemoveResource = async (id, title) => {
    askConfirmation(
      'Delete Resource',
      `Are you sure you want to delete the resource "${title}"? This action will permanently remove it.`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/resources/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            setResourcesList(resourcesList.filter(r => r.id !== id));
            triggerNotification(`✓ Deleted resource "${title}".`);
            
            // Refresh overview stats
            const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
            if (statsRes.ok) setStats(await statsRes.json());
          } else {
            triggerNotification(`✗ Failed to delete resource.`);
          }
        } catch (err) {
          console.error(err);
          triggerNotification(`✗ Network error deleting resource.`);
        }
      },
      'Delete',
      'Cancel'
    );
  };


  const fetchSemesterStudents = async (sem) => {
    try {
      setLoadingSemester(true);
      const res = await fetch(`${API_BASE}/api/admin/semesters/${encodeURIComponent(sem)}/students`);
      if (res.ok) {
        setSemesterStudents(await res.json());
      } else {
        triggerNotification(`✗ Failed to load student list for ${sem}.`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Error fetching student list.`);
    } finally {
      setLoadingSemester(false);
    }
  };
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email || !studentForm.enrollmentId) return;
    setSubmittingStudent(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentForm,
          semester: selectedSemester
        })
      });

      if (res.ok) {
        triggerNotification(`✓ Student "${studentForm.name}" registered successfully.`);
        setStudentForm({ name: '', email: '', password: 'password123', gender: 'MALE', enrollmentId: '', group: 'Group A' });
        setIsAddStudentModalOpen(false);
        // Refresh list
        fetchSemesterStudents(selectedSemester);
        // Refresh global dashboard stats
        const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
        if (statsRes.ok) setStats(await statsRes.json());
      } else {
        const errData = await res.json();
        triggerNotification(`✗ Failed to register student: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error registering student.`);
    } finally {
      setSubmittingStudent(false);
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile || !selectedSemester) return;
    
    const executeImport = async () => {
      setImportStatus('uploading');
      setImportSummary(null);

      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('semester', selectedSemester);
      formData.append('mode', importMode);

      try {
        const res = await fetch(`${API_BASE}/api/admin/students/import`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setImportSummary(data);
          setImportStatus('success');
          triggerNotification(`✓ Excel import completed: ${data.successCount} added, ${data.updatedCount} updated.`);
          // Refresh student roster
          fetchSemesterStudents(selectedSemester);
          // Refresh global dashboard stats
          const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
          if (statsRes.ok) setStats(await statsRes.json());
        } else {
          const errData = await res.json();
          triggerNotification(`✗ Import failed: ${errData.error || 'Server error'}`);
          setImportStatus('error');
        }
      } catch (err) {
        console.error(err);
        triggerNotification(`✗ Network error performing bulk import.`);
        setImportStatus('error');
      }
    };

    if (importMode === 'clear') {
      askConfirmation(
        '⚠️ Dangerous Action: Clear Semester Roster',
        `This will permanently delete all students registered in ${selectedSemester} and wipe out their historical attendance records. Are you absolutely sure?`,
        executeImport,
        'Wipe and Import',
        'Cancel'
      );
    } else {
      executeImport();
    }
  };

  const handleImpersonateStudent = (student) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify({
        id: student.id,
        name: student.name,
        email: student.email,
        role: 'STUDENT',
        gender: student.gender,
        enrollmentId: student.enrollmentId,
        semester: student.semester,
        group: student.group
      }));
      localStorage.setItem('token', 'mock-student-token-by-admin');
      window.location.href = '/student/feed';
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectForm.code || !subjectForm.name) return;
    setSubmittingSubject(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subjectForm,
          semester: selectedSemester
        })
      });

      if (res.ok) {
        triggerNotification(`✓ Subject "${subjectForm.name}" (${subjectForm.code}) added successfully.`);
        setSubjectForm({ code: '', name: '', credits: 3, theory: '4 hrs/wk', practical: '0 hrs/wk', type: 'Core Theory' });
        setIsAddSubjectModalOpen(false);
        fetchSubjects();
        if (selectedSemester) {
          fetchSemesterSubjects(selectedSemester);
        }
      } else {
        const errData = await res.json();
        triggerNotification(`✗ Failed to add subject: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification(`✗ Network error adding subject.`);
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleFacultyUpdate = async (e) => {
    e.preventDefault();
    if (!editingFaculty || !editingFaculty.name || !editingFaculty.email) return;
    
    askConfirmation(
      'Update Faculty Profile',
      `Are you sure you want to save the changes for ${editingFaculty.name}?`,
      async () => {
        setSubmittingFaculty(true);
        try {
          const formData = new FormData();
          formData.append('name', editingFaculty.name);
          formData.append('email', editingFaculty.email);
          formData.append('department', editingFaculty.department);
          formData.append('designation', editingFaculty.designation);
          formData.append('qualification', editingFaculty.qualification || 'B.E., M.Tech');
          formData.append('experience', editingFaculty.experience || '2 Years of Experience');
          formData.append('officeHours', editingFaculty.officeHours || 'Daily: 10:00 AM - 11:00 AM');
          formData.append('researchPublications', editingFaculty.publications ? JSON.stringify(editingFaculty.publications.split('\n').filter(Boolean)) : JSON.stringify([]));
          
          if (editingFacultyPhotoFile) {
            formData.append('photo', editingFacultyPhotoFile);
          }

          const res = await fetch(`${API_BASE}/api/faculty/${editingFaculty.id}`, {
            method: 'PUT',
            body: formData
          });
          if (res.ok) {
            const updated = await res.json();
            setFacultyList(facultyList.map(f => f.id === updated.id ? updated : f));
            triggerNotification(`✓ Faculty profile for "${editingFaculty.name}" updated successfully.`);
            setIsEditFacultyModalOpen(false);
            setEditingFaculty(null);
            setEditingFacultyPhotoFile(null);
            
            // Refresh stats
            const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
            if (statsRes.ok) setStats(await statsRes.json());
          } else {
            const data = await res.json();
            triggerNotification(`✗ Failed to update faculty: ${data.error || 'Server error'}`);
          }
        } catch (err) {
          console.error(err);
          triggerNotification(`✗ Network error updating faculty.`);
        } finally {
          setSubmittingFaculty(false);
        }
      }
    );
  };

  const handleFacultyChangePhoto = async (e) => {
    e.preventDefault();
    if (!changePhotoFile) return;
    setSubmittingPhoto(true);
    try {
      const activeFaculty = facultyList.find(f => f.email === currentUser?.email);
      if (!activeFaculty) {
        triggerNotification('✗ Faculty profile not found.');
        return;
      }

      const formData = new FormData();
      formData.append('photo', changePhotoFile);
      formData.append('name', activeFaculty.name);
      formData.append('email', activeFaculty.email);
      formData.append('department', activeFaculty.department);
      formData.append('designation', activeFaculty.designation);
      formData.append('qualification', activeFaculty.qualification);
      formData.append('experience', activeFaculty.experience);
      formData.append('officeHours', activeFaculty.officeHours);

      const res = await fetch(`${API_BASE}/api/faculty/${activeFaculty.id}`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        const updated = await res.json();
        setFacultyList(facultyList.map(f => f.id === updated.id ? updated : f));
        
        // Update local session
        const stored = localStorage.getItem('user');
        if (stored) {
          const userObj = JSON.parse(stored);
          userObj.photoUrl = updated.photoUrl;
          localStorage.setItem('user', JSON.stringify(userObj));
          setCurrentUser(userObj);
        }

        triggerNotification('✓ Profile photo updated successfully.');
        setIsChangePhotoModalOpen(false);
        setChangePhotoFile(null);
      } else {
        const data = await res.json();
        triggerNotification(`✗ Failed to update photo: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      triggerNotification('✗ Network error updating profile photo.');
    } finally {
      setSubmittingPhoto(false);
    }
  };

  const handleSubjectUpdate = async (e) => {
    e.preventDefault();
    if (!editingSubject || !editingSubject.code || !editingSubject.name) return;

    askConfirmation(
      'Update Subject',
      `Are you sure you want to save changes for "${editingSubject.name}"?`,
      async () => {
        setSubmittingSubject(true);
        try {
          const res = await fetch(`${API_BASE}/api/admin/subjects/${editingSubject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: editingSubject.code,
              name: editingSubject.name,
              credits: parseInt(editingSubject.credits) || 0,
              theory: editingSubject.theory,
              practical: editingSubject.practical,
              type: editingSubject.type
            })
          });
          if (res.ok) {
            const updated = await res.json();
            triggerNotification(`✓ Subject "${editingSubject.name}" updated successfully.`);
            setIsEditSubjectModalOpen(false);
            setEditingSubject(null);
            fetchSubjects();
            if (selectedSemester) {
              fetchSemesterSubjects(selectedSemester);
            }
          } else {
            const data = await res.json();
            triggerNotification(`✗ Failed to update subject: ${data.error || 'Server error'}`);
          }
        } catch (err) {
          console.error(err);
          triggerNotification(`✗ Network error updating subject.`);
        } finally {
          setSubmittingSubject(false);
        }
      }
    );
  };

  const handleRemoveSubject = async (id, name) => {
    askConfirmation(
      'Delete Subject',
      `Are you sure you want to delete the subject "${name}"? This will also delete all associated attendance records. This action cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/subjects/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            triggerNotification(`✓ Subject "${name}" deleted successfully.`);
            fetchSubjects();
            if (selectedSemester) {
              fetchSemesterSubjects(selectedSemester);
            }
          } else {
            triggerNotification(`✗ Failed to delete subject.`);
          }
        } catch (err) {
          console.error(err);
          triggerNotification(`✗ Network error deleting subject.`);
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleStudentUpdate = async (e) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.name || !editingStudent.email || !editingStudent.enrollmentId) return;

    askConfirmation(
      'Update Student Profile',
      `Are you sure you want to save changes for ${editingStudent.name}?`,
      async () => {
        setSubmittingStudent(true);
        try {
          const payload = {
            name: editingStudent.name,
            email: editingStudent.email,
            enrollmentId: editingStudent.enrollmentId,
            gender: editingStudent.gender,
            group: editingStudent.group
          };
          if (editingStudent.password && editingStudent.password.trim() !== '') {
            payload.password = editingStudent.password;
          }
          const res = await fetch(`${API_BASE}/api/admin/students/${editingStudent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            triggerNotification(`✓ Student "${editingStudent.name}" updated successfully.`);
            setIsEditStudentModalOpen(false);
            setEditingStudent(null);
            if (selectedSemester) {
              fetchSemesterStudents(selectedSemester);
            }
            // Refresh global stats
            const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
            if (statsRes.ok) setStats(await statsRes.json());
          } else {
            const data = await res.json();
            triggerNotification(`✗ Failed to update student: ${data.error || 'Server error'}`);
          }
        } catch (err) {
          console.error(err);
          triggerNotification(`✗ Network error updating student.`);
        } finally {
          setSubmittingStudent(false);
        }
      }
    );
  };

  const handleRemoveStudent = async (id, name) => {
    askConfirmation(
      'Delete Student Roster Record',
      `Are you sure you want to delete student "${name}"? This will delete their console user account and all attendance history. This action cannot be undone.`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/api/admin/students/${id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            triggerNotification(`✓ Student "${name}" removed successfully.`);
            if (selectedSemester) {
              fetchSemesterStudents(selectedSemester);
            }
            // Refresh global stats
            const statsRes = await fetch(`${API_BASE}/api/admin/stats`);
            if (statsRes.ok) setStats(await statsRes.json());
          } else {
            triggerNotification(`✗ Failed to delete student.`);
          }
        } catch (err) {
          console.error(err);
          triggerNotification(`✗ Network error deleting student.`);
        }
      },
      'Delete',
      'Cancel'
    );
  };
  // ── Charts Calculations ────────────────────────────────────────────────────
  const totalStudents = stats?.totalStudents || 0;

  const semesterChartData = [
    { sem: 'Sem 1', label: 'Semester 1', total: stats?.semesterDistribution?.['Semester 1'] || 0, boys: stats?.semesterGenderDistribution?.['Semester 1']?.boys || 0, girls: stats?.semesterGenderDistribution?.['Semester 1']?.girls || 0 },
    { sem: 'Sem 2', label: 'Semester 2', total: stats?.semesterDistribution?.['Semester 2'] || 0, boys: stats?.semesterGenderDistribution?.['Semester 2']?.boys || 0, girls: stats?.semesterGenderDistribution?.['Semester 2']?.girls || 0 },
    { sem: 'Sem 3', label: 'Semester 3', total: stats?.semesterDistribution?.['Semester 3'] || 0, boys: stats?.semesterGenderDistribution?.['Semester 3']?.boys || 0, girls: stats?.semesterGenderDistribution?.['Semester 3']?.girls || 0 },
    { sem: 'Sem 4', label: 'Semester 4', total: stats?.semesterDistribution?.['Semester 4'] || 0, boys: stats?.semesterGenderDistribution?.['Semester 4']?.boys || 0, girls: stats?.semesterGenderDistribution?.['Semester 4']?.girls || 0 },
    { sem: 'Sem 5', label: 'Semester 5', total: stats?.semesterDistribution?.['Semester 5'] || 0, boys: stats?.semesterGenderDistribution?.['Semester 5']?.boys || 0, girls: stats?.semesterGenderDistribution?.['Semester 5']?.girls || 0 },
    { sem: 'Sem 6', label: 'Semester 6', total: stats?.semesterDistribution?.['Semester 6'] || 0, boys: stats?.semesterGenderDistribution?.['Semester 6']?.boys || 0, girls: stats?.semesterGenderDistribution?.['Semester 6']?.girls || 0 }
  ];
  const maxSemesterVal = Math.max(...semesterChartData.flatMap(d => [d.total, d.boys, d.girls]), 1);
  const yMaxSemester = Math.ceil(maxSemesterVal * 1.15);

  const getSemesterX = (index) => 40 + index * 86;
  const getSemesterY = (val) => 205 - (val / yMaxSemester) * 160;

  const boysPointsStr = semesterChartData.map((d, i) => `${getSemesterX(i)},${getSemesterY(d.boys)}`).join(' ');
  const girlsPointsStr = semesterChartData.map((d, i) => `${getSemesterX(i)},${getSemesterY(d.girls)}`).join(' ');


  const doughnutData = [
    { label: 'Semester 3', count: stats?.semesterDistribution?.['Semester 3'] || 0, color: '#4a2c2a' },
    { label: 'Semester 4', count: stats?.semesterDistribution?.['Semester 4'] || 0, color: '#8d6e63' },
    { label: 'Semester 5', count: stats?.semesterDistribution?.['Semester 5'] || 0, color: '#bcaaa4' },
    { label: 'Semester 6', count: stats?.semesterDistribution?.['Semester 6'] || 0, color: '#d7ccc8' }
  ];

  doughnutData.forEach(item => {
    item.percent = totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0;
  });

  const maxSemCount = Math.max(...doughnutData.map(d => d.count), 1);

  const genderData = [
    { label: 'Boys', count: stats?.genderDistribution?.boys || 0, color: '#4a2c2a' },
    { label: 'Girls', count: stats?.genderDistribution?.girls || 0, color: '#8d6e63' }
  ];

  genderData.forEach(item => {
    item.percent = totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0;
  });

  const radius = 55;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  const barData = [
    { label: 'Notes', count: stats?.resourceCategoryDistribution?.['Notes'] || 0, color: '#4a2c2a' },
    { label: 'Manuals', count: stats?.resourceCategoryDistribution?.['Manuals'] || 0, color: '#8d6e63' },
    { label: 'Exam Papers', count: stats?.resourceCategoryDistribution?.['Exam Papers'] || 0, color: '#bcaaa4' },
    { label: 'Syllabus', count: stats?.resourceCategoryDistribution?.['Syllabus'] || 0, color: '#d7ccc8' }
  ];
  const maxCount = Math.max(...barData.map(d => d.count), 1);

  const dailyTotal = dailyAttendanceData ? (dailyAttendanceData.present + dailyAttendanceData.absent) : 0;
  const dailyTotalStudents = dailyAttendanceData ? dailyAttendanceData.totalStudents : (stats?.semesterDistribution?.[dashboardAttendanceSem] || 0);
  const dailyPresent = dailyAttendanceData ? dailyAttendanceData.present : 0;
  const dailyAbsent = dailyAttendanceData ? dailyAttendanceData.absent : 0;
  const dailyPresentPercent = dailyTotalStudents > 0 ? Math.round((dailyPresent / dailyTotalStudents) * 100) : 0;
  const dailyAbsentPercent = dailyTotalStudents > 0 ? Math.round((dailyAbsent / dailyTotalStudents) * 100) : 0;
  const dailyUnmarkedPercent = dailyTotalStudents > 0 ? Math.max(0, 100 - dailyPresentPercent - dailyAbsentPercent) : 100;
  const dailyUnmarked = Math.max(0, dailyTotalStudents - dailyPresent - dailyAbsent);

  const tabs = [
    { id: 'OVERVIEW', label: 'Dashboard Overview', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )},
    { id: 'ATTENDANCE', label: 'Attendance Marking', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: 'CLASS', label: 'Class Manager', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )},
    { id: 'REPORT_CARDS', label: 'Report Cards', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )},
    { id: 'UPLOADS', label: 'Uploads', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
    )},
    { id: 'ANNOUNCEMENTS', label: 'Post Announcements', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
    )},
    { id: 'FACULTY', label: 'Add/Edit Faculty', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},

    { id: 'RESOURCES', label: 'Manage Resources', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
    )},
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-slate-805">
      {isUploading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#2d1b18]/65 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-[#ede6dc] rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#4a2c2a]/10 animate-ping"></div>
              <div className="w-16 h-16 rounded-full border-4 border-[#f3ede2] border-t-[#4a2c2a] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-[#4a2c2a]">
                <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-[#2d1b18] uppercase tracking-wider">Uploading to S3</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Please wait while your document is being securely uploaded to Amazon S3. Do not close or refresh this page.
              </p>
            </div>
            
            <div className="w-full bg-[#faf7f2] border border-[#ede6dc] rounded-2xl p-3 flex items-center space-x-2.5 text-left text-[11px] text-[#4a2c2a] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="truncate">Uploading file...</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden bg-[#faf7f2] border-b border-[#ede6dc] px-6 py-3.5 sticky top-[72px] z-30 flex items-center justify-between transition-colors duration-300 w-full shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2.5 rounded-xl bg-[#4a2c2a] text-white hover:bg-[#4a2c2a]/95 transition-all duration-200 cursor-pointer shadow-sm"
            aria-label="Toggle Navigation"
          >
            {isMobileSidebarOpen ? <FaTimes className="w-4 h-4" /> : <FaBars className="w-4 h-4" />}
          </button>
          <span className="font-extrabold text-xs tracking-wider uppercase text-[#4a2c2a]">
            {currentUser?.role === 'FACULTY' ? 'Faculty Portal' : 'Admin Console'}
          </span>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 top-[128px] z-30 bg-[#2d1b18]/45 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed md:sticky top-[128px] md:top-[72px] left-0 z-40 h-[calc(100vh-128px)] md:h-[calc(100vh-72px)] w-64 bg-[#faf7f2] border-r border-[#ede6dc] shrink-0 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 overflow-y-auto ${
        isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-6">
          <div className="flex items-center px-2">
            <button
              onClick={() => {}}
              className="p-2.5 rounded-xl bg-[#4a2c2a] text-white hover:bg-[#4a2c2a]/95 transition-all duration-200 cursor-default shadow-sm"
              aria-label="Sidebar Menu Indicator"
            >
              <FaBars className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1.5 pt-4">
            {tabs
              .filter(tab => !(currentUser?.role === 'FACULTY' && tab.id === 'FACULTY'))
              .map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-205 cursor-pointer ${
                      isActive
                        ? 'bg-[#4a2c2a] text-white shadow-md shadow-[#4a2c2a]/10'
                        : 'text-[#4a2c2a]/80 hover:text-[#4a2c2a] hover:bg-[#f3ede2]/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="shrink-0">{tab.icon}</span>
                      <span>
                        {tab.id === 'OVERVIEW' && currentUser?.role === 'FACULTY' ? 'My Profile' : tab.label}
                      </span>
                    </div>
                    {isActive && <FaChevronRight className="w-2.5 h-2.5" />}
                  </button>
                );
              })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow bg-[#fbf9f6] py-10 px-4 sm:px-6 lg:px-8 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">

          {/* ── Global Notification ────────────────────────────────────── */}
          {notification && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs animate-in slide-in-from-top-2 duration-300">
              <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{notification}</span>
            </div>
          )}

          {/* ── Stats Overview (Only show on Dashboard Overview tab when not Faculty) ── */}
          {activeTab === 'OVERVIEW' && currentUser?.role !== 'FACULTY' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in duration-300">
              <StatCard label="Faculty Members" value={stats?.totalFaculty || 0} icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              } />
              <StatCard label="Resources Uploaded" value={stats?.totalResources || 0} icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              } />
              <StatCard label="Announcements" value={stats?.totalAnnouncements || 0} icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              } />
              <StatCard label="Total Students" value={stats?.totalStudents || 0} icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
              } />
            </div>
          )}

          {/* Content Panel */}
          <div className="bg-white border border-[#ede6dc]/70 rounded-3xl p-6 sm:p-8 shadow-sm">

              {/* ── Tab: OVERVIEW (Admin only) ──────────────────────────────────── */}
              {activeTab === 'OVERVIEW' && currentUser?.role !== 'FACULTY' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Stats Distribution Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Custom SVG Line + Bar Combo Chart: Semester Distribution */}
                    <div className="bg-white border border-[#ede6dc]/70 rounded-2xl shadow-sm p-5 flex flex-col justify-between text-[#2d1b18] relative overflow-hidden">
                      <div className="w-full flex justify-between items-center border-b border-[#ede6dc]/45 pb-3 z-10">
                        <div className="flex flex-col">
                          <h3 className="text-xs font-black text-[#2d1b18] uppercase tracking-wider flex items-center space-x-1.5">
                            <svg className="w-4 h-4 text-[#4a2c2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Semester Distribution</span>
                          </h3>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Semesters 1 - 6 Student Enrollment Trends</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#4a2c2a] bg-[#faf7f2] px-2 py-1 rounded-lg border border-[#ede6dc]/80">
                          Cohort Size: <span className="text-[#4a2c2a] font-black">{totalStudents}</span>
                        </span>
                      </div>

                      {/* SVG Canvas Area */}
                      <div className="relative w-full h-56 mt-4 z-10">
                        <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
                          {/* Definitions */}
                          <defs>
                            <pattern id="sem-grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                              <circle cx="2" cy="2" r="1" fill="#4a2c2a" opacity="0.05" />
                            </pattern>
                            <linearGradient id="sem-bar-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4a2c2a" stopOpacity="0.10" />
                              <stop offset="100%" stopColor="#4a2c2a" stopOpacity="0.01" />
                            </linearGradient>
                          </defs>

                          {/* Tech Dotted Grid Background */}
                          <rect width="500" height="240" fill="url(#sem-grid-dots)" />

                          {/* Grid Lines & Y-Axis Labels */}
                          {[0, 1, 2, 3].map((valIdx) => {
                            const gridVal = Math.round((yMaxSemester / 3) * valIdx);
                            const y = getSemesterY(gridVal);
                            return (
                              <g key={valIdx}>
                                <line x1="40" y1={y} x2="470" y2={y} stroke="#ede6dc" strokeWidth="1" strokeDasharray="3 3" />
                                <text x="30" y={y + 3} textAnchor="end" fill="#94a3b8" className="text-[9px] font-mono font-bold">{gridVal}</text>
                              </g>
                            );
                          })}

                          {/* 1. Total Student Columns (Background Bars) */}
                          {semesterChartData.map((d, i) => {
                            const barWidth = 32;
                            const barX = getSemesterX(i) - barWidth / 2;
                            const barY = getSemesterY(d.total);
                            const barHeight = 205 - barY;
                            return (
                              <g key={`bar-${i}`} className="group/bar">
                                <rect
                                  x={barX}
                                  y={barY}
                                  width={barWidth}
                                  height={barHeight}
                                  rx="4"
                                  fill="url(#sem-bar-gradient)"
                                  className="transition-all duration-300 hover:fill-opacity-100 cursor-pointer"
                                />
                                {/* Label for column values on hover */}
                                <text
                                  x={getSemesterX(i)}
                                  y={barY - 10}
                                  textAnchor="middle"
                                  fill="#4a2c2a"
                                  className="text-[9px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200"
                                >
                                  Total: {d.total}
                                </text>
                              </g>
                            );
                          })}

                          {/* 2. Boys & Girls Trend Lines */}
                          <polyline points={boysPointsStr} fill="none" stroke="#4a2c2a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points={girlsPointsStr} fill="none" stroke="#8d6e63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                          {/* 3. Node Markers & Interactive Tooltips (to ensure no overlap) */}
                          {semesterChartData.map((d, i) => {
                            const x = getSemesterX(i);
                            const yBoys = getSemesterY(d.boys);
                            const yGirls = getSemesterY(d.girls);

                            // Dynamically offset labels if values are close to prevent overlap
                            const isBoysHigher = d.boys >= d.girls;
                            const diff = Math.abs(yBoys - yGirls);
                            
                            let boysLabelY = yBoys - 8;
                            let girlsLabelY = yGirls + 14;
                            
                            if (!isBoysHigher) {
                              boysLabelY = yBoys + 14;
                              girlsLabelY = yGirls - 8;
                            }
                            
                            // If they are exactly on top of each other, apply secondary offset
                            if (diff < 12) {
                              boysLabelY = isBoysHigher ? yBoys - 10 : yBoys + 16;
                              girlsLabelY = isBoysHigher ? yGirls + 16 : yGirls - 10;
                            }

                            return (
                              <g key={`nodes-${i}`}>
                                {/* Boys text label */}
                                <text x={x} y={boysLabelY} textAnchor="middle" fill="#4a2c2a" className="text-[10px] font-black select-none pointer-events-none">
                                  {d.boys}
                                </text>
                                {/* Girls text label */}
                                <text x={x} y={girlsLabelY} textAnchor="middle" fill="#8d6e63" className="text-[10px] font-black select-none pointer-events-none">
                                  {d.girls}
                                </text>

                                {/* Markers */}
                                <circle cx={x} cy={yBoys} r="4.5" fill="#ffffff" stroke="#4a2c2a" strokeWidth="2.5" className="cursor-pointer transition-transform hover:scale-125" />
                                <circle cx={x} cy={yGirls} r="4.5" fill="#ffffff" stroke="#8d6e63" strokeWidth="2.5" className="cursor-pointer transition-transform hover:scale-125" />

                                {/* Axis label */}
                                <text x={x} y="228" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-black uppercase tracking-wider">{d.sem}</text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Customized Chart Legend */}
                      <div className="flex justify-center items-center space-x-6 pt-3 mt-4 border-t border-[#ede6dc]/60 text-[10px] font-bold tracking-wide text-slate-400 z-10 shrink-0">
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-1.5 rounded-full bg-[#4a2c2a] block"></span>
                          <span className="text-[#2d1b18]">Boys ({semesterChartData.reduce((acc, d) => acc + d.boys, 0)})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-1.5 rounded-full bg-[#8d6e63] block"></span>
                          <span className="text-[#2d1b18]">Girls ({semesterChartData.reduce((acc, d) => acc + d.girls, 0)})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded bg-[#4a2c2a]/10 border border-[#4a2c2a]/20 block"></span>
                          <span className="text-[#2d1b18]">Total Enrollment</span>
                        </div>
                      </div>
                    </div>

                    {/* Radial Doughnut: Gender Breakdown */}
                    <div className="bg-white border border-[#ede6dc]/70 p-6 rounded-2xl space-y-4 flex flex-col items-center shadow-sm">
                      <div className="w-full flex justify-between items-center border-b border-[#ede6dc]/45 pb-3">
                        <h3 className="text-xs font-extrabold text-[#2d1b18] uppercase tracking-wider flex items-center space-x-1.5">
                          <svg className="w-4 h-4 text-[#4a2c2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Gender Breakdown</span>
                        </h3>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center gap-4 w-full py-4 min-w-0">
                        {/* SVG Segmented Doughnut Chart - Increased Size */}
                        <div className="relative w-36 h-36 shrink-0">
                          <svg className="w-full h-full animate-[spin_1s_ease-out_1]" viewBox="0 0 160 160">
                            {/* Base Circle */}
                            <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#faf7f2" strokeWidth={strokeWidth} />
                            {/* Segment Circles */}
                            {(() => {
                              let accumGenderPercent = 0;
                              return genderData.map((item, idx) => {
                                const percent = totalStudents > 0 ? item.count / totalStudents : 0;
                                const strokeLength = circumference * percent;
                                const strokeOffset = circumference - strokeLength + (circumference * accumGenderPercent);
                                accumGenderPercent += percent;
                                
                                const isHovered = hoveredGender === idx;

                                return (
                                  <circle
                                    key={idx}
                                    cx="80"
                                    cy="80"
                                    r={radius}
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeOffset}
                                    transform="rotate(-90 80 80)"
                                    className="transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() => setHoveredGender(idx)}
                                    onMouseLeave={() => setHoveredGender(null)}
                                  />
                                );
                              });
                            })()}
                          </svg>

                          {/* Centered Total Indicator */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                            <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider leading-none">Ratio</span>
                            <span className="text-xl font-black text-[#2d1b18] leading-tight my-1">{stats?.genderDistribution?.boys || 0}:{stats?.genderDistribution?.girls || 0}</span>
                            <span className="text-[10px] text-slate-500 font-bold leading-none">B:G</span>
                          </div>
                        </div>

                        {/* Doughnut Legends Centered Below */}
                        <div className="flex flex-row justify-center items-center space-x-6 w-full pt-2">
                          {genderData.map((item, idx) => (
                            <div 
                              key={idx}
                              onMouseEnter={() => setHoveredGender(idx)}
                              onMouseLeave={() => setHoveredGender(null)}
                              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                                hoveredGender === idx 
                                  ? 'border-[#4a2c2a] bg-[#faf7f2]/40 shadow-sm' 
                                  : 'border-transparent bg-transparent'
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-[11px] font-bold text-[#2d1b18]">{item.label}</span>
                              <span className="text-[11px] font-extrabold text-[#4a2c2a]">{item.count} ({item.percent}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Attendance Overview Chart */}
                  <div className="bg-white border border-[#ede6dc]/70 rounded-2xl shadow-sm p-6 space-y-5 text-[#2d1b18]">
                    
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b border-[#ede6dc]/45 pb-4 gap-4">
                      <div className="flex flex-col">
                        <h3 className="text-xs font-black text-[#2d1b18] uppercase tracking-wider flex items-center space-x-1.5">
                          <svg className="w-4 h-4 text-[#4a2c2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <span>Daily Attendance Monitor</span>
                        </h3>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Track present vs absent count for any specific date & subject</span>
                      </div>

                      {/* Dynamic Parameters Selectors */}
                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Date Picker */}
                        <div className="flex flex-col space-y-0.5 min-w-[120px]">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Select Date</label>
                          <input
                            type="date"
                            value={dashAttendanceDate}
                            onChange={(e) => setDashAttendanceDate(e.target.value)}
                            className="bg-[#faf7f2] border border-[#ede6dc] px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#4a2c2a] focus:outline-none focus:border-[#4a2c2a] cursor-pointer"
                          />
                        </div>

                        {/* Semester Select */}
                        <div className="flex flex-col space-y-0.5 min-w-[110px]">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Select Semester</label>
                          <select
                            value={dashboardAttendanceSem}
                            onChange={(e) => setDashboardAttendanceSem(e.target.value)}
                            className="bg-[#faf7f2] border border-[#ede6dc] px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#4a2c2a] focus:outline-none focus:border-[#4a2c2a] cursor-pointer"
                          >
                            <option value="Semester 1">Semester 1</option>
                            <option value="Semester 2">Semester 2</option>
                            <option value="Semester 3">Semester 3</option>
                            <option value="Semester 4">Semester 4</option>
                            <option value="Semester 5">Semester 5</option>
                            <option value="Semester 6">Semester 6</option>
                          </select>
                        </div>

                        {/* Subject Select */}
                        <div className="flex flex-col space-y-0.5 min-w-[150px] flex-1 sm:flex-none">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Select Subject</label>
                          <select
                            value={dashAttendanceSubjectId}
                            onChange={(e) => setDashAttendanceSubjectId(e.target.value)}
                            className="bg-[#faf7f2] border border-[#ede6dc] px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#4a2c2a] focus:outline-none focus:border-[#4a2c2a] cursor-pointer w-full"
                          >
                            <option value="">-- No Subject Selected --</option>
                            {subjectsList
                              .filter(sub => sub.semester === dashboardAttendanceSem)
                              .map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Chart / Report Content */}
                    {loadingDailyAttendance ? (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <div className="w-8 h-8 rounded-full border-4 border-[#4a2c2a]/20 border-t-[#4a2c2a] animate-spin"></div>
                        <span className="text-xs font-semibold">Loading stats...</span>
                      </div>
                    ) : !dashAttendanceSubjectId ? (
                      <div className="py-10 text-center bg-[#faf7f2]/30 border border-dashed border-[#ede6dc] rounded-2xl">
                        <span className="text-2xl">📚</span>
                        <p className="text-xs text-slate-400 font-bold mt-2">Please select a subject module to monitor attendance.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        
                        {/* Ring Chart (Left Side) */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-5 bg-[#faf7f2]/40 border border-[#ede6dc]/40 rounded-2xl select-none">
                          <div className="relative w-36 h-36">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              {/* Track */}
                              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1ece3" strokeWidth="9" />
                              {/* Present Ring (Green) */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke="#10b981"
                                strokeWidth="9"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - dailyPresentPercent / 100)}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                                className="transition-all duration-500 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-[#2d1b18]">{dailyPresentPercent}%</span>
                              <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest leading-none mt-0.5">Present Rate</span>
                            </div>
                          </div>

                          <div className="mt-4 text-xs font-bold text-slate-500">
                            Class Ratio: <span className="text-[#2d1b18] font-black">{dailyPresent} / {dailyTotalStudents}</span> present
                          </div>
                        </div>

                        {/* Breakdown Bars and Action (Right Side) */}
                        <div className="md:col-span-8 space-y-6">
                          
                          {/* Main Text Ratio */}
                          <div className="bg-[#faf7f2]/60 border border-[#ede6dc]/80 rounded-2xl p-4 space-y-1">
                            <span className="text-[8px] font-extrabold text-[#4a2c2a] uppercase tracking-wider">Attendance Status</span>
                            <p className="text-sm font-bold leading-normal text-[#2d1b18]">
                              Out of <strong className="text-[#4a2c2a] font-extrabold text-base">{dailyTotalStudents}</strong> total enrolled students, 
                              there are <strong className="text-emerald-600 font-extrabold text-base">{dailyPresent}</strong> present and 
                              <strong className="text-rose-600 font-extrabold text-base">{dailyAbsent}</strong> absent on this date.
                              {dailyUnmarked > 0 && (
                                <span className="block text-xs font-medium text-slate-500 mt-1">
                                  ⚠️ Note: {dailyUnmarked} students are not yet marked.
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Present vs Absent vs Unmarked Combined Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>Attendance Distribution</span>
                              <span>Ratio Profile</span>
                            </div>
                            <div className="w-full h-5 bg-[#f1ece3] rounded-full overflow-hidden flex border border-[#ede6dc]/80">
                              {/* Present Section */}
                              {dailyPresentPercent > 0 && (
                                <div
                                  style={{ width: `${dailyPresentPercent}%` }}
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 flex items-center justify-center text-[9px] font-black text-white"
                                  title={`Present: ${dailyPresentPercent}%`}
                                >
                                  {dailyPresentPercent >= 12 && `${dailyPresentPercent}%`}
                                </div>
                              )}
                              {/* Absent Section */}
                              {dailyAbsentPercent > 0 && (
                                <div
                                  style={{ width: `${dailyAbsentPercent}%` }}
                                  className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500 flex items-center justify-center text-[9px] font-black text-white"
                                  title={`Absent: ${dailyAbsentPercent}%`}
                                >
                                  {dailyAbsentPercent >= 12 && `${dailyAbsentPercent}%`}
                                </div>
                              )}
                              {/* Unmarked Section */}
                              {dailyUnmarkedPercent > 0 && (
                                <div
                                  style={{ width: `${dailyUnmarkedPercent}%` }}
                                  className="h-full bg-[#e2dcd0] transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-slate-500"
                                  title={`Unmarked: ${dailyUnmarkedPercent}%`}
                                >
                                  {dailyUnmarkedPercent >= 12 && `Unmarked`}
                                </div>
                              )}
                            </div>
                            
                            {/* Legend labels */}
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400 pt-1">
                              <span className="flex items-center space-x-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                                <span>Present ({dailyPresent})</span>
                              </span>
                              <span className="flex items-center space-x-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                                <span>Absent ({dailyAbsent})</span>
                              </span>
                              <span className="flex items-center space-x-1.5">
                                <span className="w-2.5 h-2.5 bg-[#e2dcd0] rounded-sm block"></span>
                                <span>Unmarked ({dailyUnmarked})</span>
                              </span>
                            </div>
                          </div>

                          {/* Quick Modification Link */}
                          <div className="pt-2 flex">
                            <button
                              onClick={() => {
                                setAttendanceSemester(dashboardAttendanceSem);
                                setAttendanceSubjectId(dashAttendanceSubjectId);
                                setAttendanceDate(dashAttendanceDate);
                                setActiveTab('ATTENDANCE');
                                handleLoadAttendanceRoster(dashAttendanceSubjectId, dashboardAttendanceSem, dashAttendanceDate);
                              }}
                              className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer shadow flex items-center space-x-2 border border-white/5 active:scale-[0.98]"
                            >
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>{dailyTotal > 0 ? 'Modify/Edit Attendance' : 'Mark Attendance for this Class'}</span>
                            </button>
                          </div>
                          
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: OVERVIEW (Faculty Profile) ───────────────── */}
              {activeTab === 'OVERVIEW' && currentUser?.role === 'FACULTY' && (() => {
                const facultyProfile = facultyList.find(f => f.email === currentUser?.email) || {
                  name: currentUser?.name || 'Mrs. Rekha Patil',
                  email: currentUser?.email || 'rekha.patil@sandur.edu',
                  designation: 'Lecturer',
                  qualification: 'M.Tech in Computer Science',
                  experience: '12 Years of Experience',
                  officeHours: 'Mon, Wed, Fri: 11:00 AM - 01:00 PM',
                  researchPublications: JSON.stringify(['A Study on Cloud Security models', 'Machine learning in education systems']),
                  photoUrl: currentUser?.photoUrl || null
                };
                return (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Faculty Profile Card */}
                    <div className="bg-white border border-[#ede6dc]/70 rounded-3xl p-6 sm:p-8 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:space-x-8 space-y-6 md:space-y-0">
                        {/* Left: Avatar/Photo */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#4a2c2a] to-[#8d6e63] flex items-center justify-center text-white text-3xl font-black shadow-md bg-cover bg-center">
                            {facultyProfile.photoUrl && !facultyProfile.photoUrl.includes('/placeholder/') ? (
                              <img 
                                src={facultyProfile.photoUrl} 
                                alt={facultyProfile.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.innerText = currentUser?.name ? currentUser.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'RP';
                                }}
                              />
                            ) : (
                              currentUser?.name ? currentUser.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'RP'
                            )}
                          </div>
                          <span className="mt-3.5 px-3 py-1 rounded-full bg-[#f3ede2] border border-[#ede6dc] text-[#4a2c2a] text-[10px] font-bold uppercase tracking-wider">
                            Faculty Member
                          </span>
                          <button
                            onClick={() => setIsChangePhotoModalOpen(true)}
                            className="mt-2.5 px-3 py-1.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-[#4a2c2a] hover:text-[#5d3a37] text-[10px] font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1 shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5 text-[#4a2c2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Change Photo</span>
                          </button>
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1 space-y-5 text-left">
                          <div className="border-b border-[#ede6dc]/60 pb-3">
                            <h2 className="text-xl font-black text-[#2d1b18]">{currentUser?.name || 'Mrs. Rekha Patil'}</h2>
                            <p className="text-xs text-[#4a2c2a] font-bold mt-0.5">Department of Computer Science & Engineering</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email</span>
                              <p className="font-semibold text-[#2d1b18]">{facultyProfile.email}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</span>
                              <p className="font-semibold text-[#2d1b18]">{facultyProfile.designation}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qualification</span>
                              <p className="font-semibold text-[#2d1b18]">{facultyProfile.qualification}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience</span>
                              <p className="font-semibold text-[#2d1b18]">{facultyProfile.experience}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Hours</span>
                              <p className="font-semibold text-[#2d1b18]">{facultyProfile.officeHours}</p>
                            </div>
                          </div>

                          {facultyProfile.researchPublications && (
                            <div className="space-y-2 pt-3 border-t border-[#ede6dc]/40">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Research Publications</span>
                              <ul className="list-disc pl-4 space-y-1 text-xs font-semibold text-slate-500">
                                {(() => {
                                  try {
                                    const pubs = typeof facultyProfile.researchPublications === 'string'
                                      ? JSON.parse(facultyProfile.researchPublications)
                                      : facultyProfile.researchPublications;
                                    return Array.isArray(pubs)
                                      ? pubs.map((pub, idx) => <li key={idx}>{pub}</li>)
                                      : <li>{facultyProfile.researchPublications}</li>;
                                  } catch (e) {
                                    return <li>{facultyProfile.researchPublications}</li>;
                                  }
                                })()}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  {/* Quick Actions Card */}
                  <div className="bg-[#faf7f2]/60 border border-[#ede6dc] rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col space-y-1 border-b border-[#ede6dc]/60 pb-3 mb-4 text-left">
                      <h3 className="text-xs font-extrabold text-[#2d1b18] uppercase tracking-wider">Quick Actions</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Navigate directly to other tools in the faculty portal</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button 
                        onClick={() => setActiveTab('UPLOADS')} 
                        className="flex items-center space-x-3 p-4 bg-white border border-[#ede6dc] rounded-2xl hover:bg-[#f3ede2] hover:border-[#4a2c2a]/30 transition-all duration-200 cursor-pointer group text-left"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#faf7f2] group-hover:bg-[#4a2c2a] flex items-center justify-center text-[#4a2c2a] group-hover:text-white transition-colors duration-200">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#2d1b18]">Upload Content</span>
                          <span className="block text-[9px] text-slate-400 font-semibold">Study notes, labs</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('CLASS')} 
                        className="flex items-center space-x-3 p-4 bg-white border border-[#ede6dc] rounded-2xl hover:bg-[#f3ede2] hover:border-[#4a2c2a]/30 transition-all duration-200 cursor-pointer group text-left"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#faf7f2] group-hover:bg-[#4a2c2a] flex items-center justify-center text-[#4a2c2a] group-hover:text-white transition-colors duration-200">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#2d1b18]">Manage Classes</span>
                          <span className="block text-[9px] text-slate-400 font-semibold">Schedules, rosters</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('ANNOUNCEMENTS')} 
                        className="flex items-center space-x-3 p-4 bg-white border border-[#ede6dc] rounded-2xl hover:bg-[#f3ede2] hover:border-[#4a2c2a]/30 transition-all duration-200 cursor-pointer group text-left"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#faf7f2] group-hover:bg-[#4a2c2a] flex items-center justify-center text-[#4a2c2a] group-hover:text-white transition-colors duration-200">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-[#2d1b18]">Notice Board</span>
                          <span className="block text-[9px] text-slate-400 font-semibold">Post announcements</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  </div>
                );
              })()}

              {/* ── Tab: ATTENDANCE MARKING ────────────────────────── */}
              {activeTab === 'ATTENDANCE' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col space-y-1.5 border-b border-[#ede6dc]/45 pb-3">
                    <h3 className="text-base font-extrabold text-[#2d1b18] flex items-center space-x-2">
                      <span className="w-1.5 h-5 bg-[#4a2c2a] rounded-full"></span>
                      <span>Daily Attendance Marking System</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Select class parameters to load the student roster and save attendance records.
                    </p>
                  </div>

                  {/* Parameters Form */}
                  <div className="bg-white border border-[#ede6dc]/70 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      {currentUser?.role !== 'FACULTY' ? (
                        <>
                          <div className="space-y-1.5">
                            <FieldLabel>Semester Class</FieldLabel>
                            <SelectInput
                              value={attendanceSemester}
                              onChange={(e) => {
                                setAttendanceSemester(e.target.value);
                                setAttendanceSubjectId('');
                                setAttendanceStudents([]);
                              }}
                            >
                              {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'].map(sem => (
                                <option key={sem} value={sem}>{sem}</option>
                              ))}
                            </SelectInput>
                          </div>

                          <div className="space-y-1.5">
                            <FieldLabel>Subject Module</FieldLabel>
                            <SelectInput
                              value={attendanceSubjectId}
                              onChange={(e) => {
                                setAttendanceSubjectId(e.target.value);
                                setAttendanceStudents([]);
                              }}
                            >
                              <option value="">-- Select Subject --</option>
                              {subjectsList
                                .filter(sub => sub.semester === attendanceSemester)
                                .map(sub => (
                                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                                ))}
                            </SelectInput>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1.5 md:col-span-2">
                          <FieldLabel>My Associated Subjects</FieldLabel>
                          <SelectInput
                            value={attendanceSubjectId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAttendanceSubjectId(val);
                              setAttendanceStudents([]);
                              if (val) {
                                const selectedSub = subjectsList.find(s => s.id === val);
                                if (selectedSub) {
                                  setAttendanceSemester(selectedSub.semester);
                                }
                              }
                            }}
                          >
                            <option value="">-- Select Subject --</option>
                            {subjectsList
                              .filter(sub => sub.facultyEmail === currentUser?.email)
                              .map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code}) - {sub.semester}</option>
                              ))}
                          </SelectInput>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <FieldLabel>Attendance Date</FieldLabel>
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => {
                            setAttendanceDate(e.target.value);
                            setAttendanceStudents([]);
                          }}
                          className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                        />
                      </div>

                      <button
                        onClick={handleLoadAttendanceRoster}
                        className="py-3 px-4 rounded-xl font-bold bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs transition-colors duration-200 shadow-md shadow-[#4a2c2a]/15 cursor-pointer flex items-center justify-center space-x-2"
                      >
                        {loadingAttendanceStudents ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                          </svg>
                        )}
                        <span>Load Student Roster</span>
                      </button>
                    </div>
                  </div>

                  {/* Roster Marking Panel */}
                  {attendanceStudents.length > 0 && (
                    <div className="bg-white border border-[#ede6dc]/70 rounded-3xl overflow-hidden shadow-sm space-y-4 p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#ede6dc]/45 pb-3 gap-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#2d1b18]">Mark Student Statuses</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Semester: {attendanceSemester} | Subject: {subjectsList.find(s => s.id === attendanceSubjectId)?.name}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setAttendanceStudents(attendanceStudents.map(s => ({ ...s, status: 'PRESENT' })));
                            }}
                            className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            All Present
                          </button>
                          <button
                            onClick={() => {
                              setAttendanceStudents(attendanceStudents.map(s => ({ ...s, status: 'ABSENT' })));
                            }}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            All Absent
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-[#ede6dc]/60 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#faf7f2]/50 text-slate-500 border-b border-[#ede6dc]/60 font-bold uppercase tracking-wider">
                              <th className="p-4 pl-6">USN / Enrollment ID</th>
                              <th className="p-4">Student Name</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Group</th>
                              <th className="p-4 text-center w-36">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ede6dc]/30 bg-white">
                            {attendanceStudents.map((student, idx) => (
                              <tr key={student.id} className="hover:bg-[#faf7f2]/10 transition-colors">
                                <td className="p-4 pl-6 font-mono font-bold text-[#4a2c2a]">{student.enrollmentId || 'N/A'}</td>
                                <td className="p-4 font-bold text-slate-800">{student.name}</td>
                                <td className="p-4 text-slate-500 font-semibold">{student.email}</td>
                                <td className="p-4 font-bold text-slate-500">{student.group || 'Group A'}</td>
                                <td className="p-4 text-center">
                                  <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                                    <button
                                      onClick={() => {
                                        const updated = [...attendanceStudents];
                                        updated[idx].status = 'PRESENT';
                                        setAttendanceStudents(updated);
                                      }}
                                      className={`px-3.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                        student.status === 'PRESENT'
                                          ? 'bg-emerald-600 text-white shadow-sm'
                                          : 'text-slate-500 hover:text-slate-850'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updated = [...attendanceStudents];
                                        updated[idx].status = 'ABSENT';
                                        setAttendanceStudents(updated);
                                      }}
                                      className={`px-3.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                        student.status === 'ABSENT'
                                          ? 'bg-rose-600 text-white shadow-sm'
                                          : 'text-slate-500 hover:text-slate-850'
                                      }`}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={() => {
                            askConfirmation(
                              'Save Attendance',
                              `Are you sure you want to submit attendance records for ${attendanceStudents.length} students?`,
                              async () => {
                                setSavingAttendance(true);
                                try {
                                  const res = await fetch(`${API_BASE}/api/attendance`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      date: attendanceDate,
                                      semester: currentUser?.role === 'FACULTY' 
                                        ? subjectsList.find(s => s.id === attendanceSubjectId)?.semester 
                                        : attendanceSemester,
                                      subjectId: attendanceSubjectId,
                                      records: attendanceStudents.map(s => ({ studentId: s.id, status: s.status })),
                                      markedBy: currentUser?.email || 'Admin'
                                    })
                                  });
                                  if (res.ok) {
                                    triggerNotification('✓ Attendance submitted successfully.');
                                    setAttendanceStudents([]);
                                    setAttendanceSubjectId('');
                                  } else {
                                    triggerNotification('✗ Failed to save attendance.');
                                  }
                                } catch (err) {
                                  console.error(err);
                                  triggerNotification('✗ Network error saving attendance.');
                                } finally {
                                  setSavingAttendance(false);
                                }
                              }
                            );
                          }}
                          disabled={savingAttendance}
                          className="px-6 py-3 rounded-xl font-bold bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs tracking-wider transition-colors duration-200 cursor-pointer shadow-md shadow-emerald-600/10 flex items-center space-x-2"
                        >
                          {savingAttendance && <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>}
                          <span>Submit Attendance Records</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: CLASS MANAGER ────────────────────────────── */}
              {activeTab === 'CLASS' && (

                <div className="space-y-6 animate-in fade-in duration-300">
                  {selectedSemester === null ? (
                    // 6 Semester Cards View
                    <div className="space-y-6">
                      <div className="flex flex-col space-y-1.5 border-b border-[#ede6dc]/45 pb-3">
                        <h3 className="text-base font-extrabold text-[#2d1b18] flex items-center space-x-2">
                          <span className="w-1.5 h-5 bg-[#4a2c2a] rounded-full"></span>
                          <span>Class & Semester Manager</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Select a semester class to manage students and subjects.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'].map((semName, idx) => {
                          const studentCount = stats?.semesterDistribution?.[semName] || 0;
                          const yearLabel = idx < 2 ? '1st Year Class' : idx < 4 ? '2nd Year Class' : '3rd Year Class';
                          
                          return (
                            <div
                              key={semName}
                              onClick={() => {
                                setSelectedSemester(semName);
                                fetchSemesterStudents(semName);
                                fetchSemesterSubjects(semName);
                              }}
                              className="bg-white border border-[#ede6dc] hover:border-[#4a2c2a] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group"
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#4a2c2a] bg-[#f3ede2] border border-[#ede6dc] px-2 py-0.5 rounded-md">
                                    {yearLabel}
                                  </span>
                                  <h4 className="text-sm font-extrabold text-[#2d1b18] group-hover:text-[#4a2c2a] transition-colors pt-2">
                                    {semName}
                                  </h4>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fbf9f6] to-[#f3ede2] border border-[#ede6dc] flex items-center justify-center text-[#4a2c2a] group-hover:from-[#4a2c2a] group-hover:to-[#5d3a37] group-hover:text-white transition-all duration-250">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                              </div>

                              <div className="flex justify-between items-center border-t border-[#ede6dc]/50 pt-4 text-xs font-semibold">
                                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Enrolled Students</span>
                                <span className="text-xs font-black text-[#2d1b18]">{studentCount} Students</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Detailed Semester List View
                    <div className="space-y-6">
                      {/* Back and title bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#ede6dc]/45 pb-4 space-y-4 sm:space-y-0">
                        <div className="flex items-center space-x-3.5">
                          <button
                            onClick={() => setSelectedSemester(null)}
                            className="p-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-[#4a2c2a] text-xs font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back</span>
                          </button>
                          <div>
                            <h3 className="text-base font-extrabold text-[#2d1b18]">{selectedSemester} Class Roster</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Enrolled: {semesterStudents.length} Students</p>
                          </div>
                        </div>

                        {/* Action buttons — only show for admin */}
                        {currentUser?.role !== 'FACULTY' && (
                          <div className="flex items-center space-x-2.5">
                            <button
                              onClick={() => setIsAddStudentModalOpen(true)}
                              className="px-4 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-[#4a2c2a]/10"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Add Student</span>
                            </button>
                            <button
                              onClick={() => setIsAddSubjectModalOpen(true)}
                              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#faf7f2] border border-[#ede6dc] text-[#4a2c2a] text-xs font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Add Subject</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Student List Table */}
                      <div className="bg-[#fbf9f6]/40 border border-[#ede6dc]/60 rounded-2xl overflow-hidden">
                        {loadingSemester ? (
                          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                            <div className="w-8 h-8 rounded-full border-3 border-[#ede6dc] border-t-[#4a2c2a] animate-spin"></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading class roster...</span>
                          </div>
                        ) : semesterStudents.length === 0 ? (
                          <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#f3ede2]/60 border border-[#ede6dc] flex items-center justify-center text-slate-400">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="space-y-1 max-w-sm px-4">
                              <h4 className="text-sm font-extrabold text-[#2d1b18]">Roster is Empty</h4>
                              <p className="text-[11px] text-slate-400 font-medium">There are currently no students registered in {selectedSemester} for the Computer Science department portal.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                            <table className="w-full border-collapse text-left">
                              <thead className="sticky top-0 z-10 bg-[#f3ede2]">
                                <tr className="border-b border-[#ede6dc]/60 bg-[#f3ede2] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <th className="px-5 py-4">Enrollment ID</th>
                                  <th className="px-5 py-4">Student Name</th>
                                  <th className="px-5 py-4">Email Address</th>
                                  <th className="px-5 py-4">Console Access</th>
                                  <th className="px-5 py-4">Gender</th>
                                  <th className="px-5 py-4">Group</th>
                                  <th className="px-5 py-4 text-center">Registered Date</th>
                                  <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#ede6dc]/40 text-xs text-[#2d1b18] font-medium bg-white">
                                {semesterStudents.map((student) => (
                                  <tr key={student.id} className="hover:bg-[#faf7f2]/40 transition-colors">
                                    <td className="px-5 py-4 font-mono font-bold text-[10px] text-[#4a2c2a]">
                                      {student.enrollmentId || 'N/A'}
                                    </td>
                                    <td className="px-5 py-4 font-bold">{student.name}</td>
                                    <td className="px-5 py-4 text-slate-500 font-semibold">{student.email}</td>
                                    <td className="px-5 py-4">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Temporary Password">
                                          PW: password123
                                        </span>
                                        <button
                                          onClick={() => handleImpersonateStudent(student)}
                                          className="px-2 py-1 rounded bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-[9px] font-extrabold uppercase transition-colors duration-200 cursor-pointer shadow-3xs flex items-center space-x-1"
                                        >
                                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                                          </svg>
                                          <span>Login As</span>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 text-[10px]">
                                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                        student.gender === 'FEMALE' 
                                          ? 'bg-orange-50 border border-orange-200 text-orange-600'
                                          : 'bg-cyan-50 border border-cyan-200 text-cyan-600'
                                      }`}>
                                        {student.gender === 'FEMALE' ? 'Girls' : 'Boys'}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 font-bold text-slate-500">{student.group || 'N/A'}</td>
                                    <td className="px-5 py-4 text-right text-slate-400 font-semibold">
                                      {new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <button
                                          onClick={() => {
                                            setEditingStudent(student);
                                            setIsEditStudentModalOpen(true);
                                          }}
                                          title="Edit Student"
                                          className="p-2 rounded-lg text-[#4a2c2a] bg-[#f3ede2] hover:bg-[#ede6dc] transition-colors cursor-pointer border border-[#ede6dc]"
                                        >
                                          <FaPencilAlt className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveStudent(student.id, student.name)}
                                          title="Remove Student"
                                          className="p-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200"
                                        >
                                          <FaTrash className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Semester Subjects Section */}
                      <div className="bg-white border border-[#ede6dc]/60 rounded-2xl p-5 space-y-4 mt-6">
                        <div className="flex items-center justify-between border-b border-[#ede6dc]/45 pb-3">
                          <h4 className="text-sm font-extrabold text-[#2d1b18] flex items-center space-x-2">
                            <span className="w-1.5 h-4 bg-[#4a2c2a] rounded-full"></span>
                            <span>Subjects and Instructors</span>
                          </h4>
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total: {semesterSubjectsList.length} Subjects</span>
                        </div>

                        {semesterSubjectsList.length === 0 ? (
                          <p className="text-xs text-slate-400 font-semibold py-4 text-center">No subjects registered for this semester yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-[#ede6dc]/60 bg-[#faf7f2]/50 text-slate-500 font-bold uppercase tracking-wider">
                                  <th className="p-3">Code</th>
                                  <th className="p-3">Subject Name</th>
                                  <th className="p-3">Type</th>
                                  <th className="p-3">Credits</th>
                                  <th className="p-3">Assigned Faculty</th>
                                  <th className="p-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#ede6dc]/30 bg-white">
                                {semesterSubjectsList.map((subject) => (
                                  <tr key={subject.id} className="hover:bg-[#faf7f2]/20">
                                    <td className="p-3 font-mono font-bold text-[#4a2c2a]">{subject.code}</td>
                                    <td className="p-3 font-bold text-slate-800">{subject.name}</td>
                                    <td className="p-3 text-slate-500 uppercase text-[10px] font-semibold">{subject.type}</td>
                                    <td className="p-3 font-bold text-slate-600">{subject.credits}</td>
                                    <td className="p-3">
                                      <select
                                        value={subject.facultyEmail || ''}
                                        onChange={(e) => {
                                          const email = e.target.value;
                                          const facName = facultyList.find(f => f.email === email)?.name || 'None';
                                          askConfirmation(
                                            'Assign Faculty',
                                            `Are you sure you want to assign ${facName} to "${subject.name}"?`,
                                            async () => {
                                              try {
                                                const res = await fetch(`${API_BASE}/api/admin/subjects/${subject.id}/assign-faculty`, {
                                                  method: 'PUT',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ facultyEmail: email || null })
                                                });
                                                if (res.ok) {
                                                  triggerNotification(`✓ Faculty assigned successfully.`);
                                                  fetchSemesterSubjects(selectedSemester);
                                                  fetchSubjects();
                                                } else {
                                                  triggerNotification('✗ Failed to assign faculty.');
                                                }
                                              } catch (err) {
                                                console.error(err);
                                                triggerNotification('✗ Network error assigning faculty.');
                                              }
                                            }
                                          );
                                        }}
                                        className="bg-[#faf7f2] border border-[#ede6dc] px-2 py-1 rounded-lg text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] font-semibold max-w-[200px]"
                                      >
                                        <option value="">-- Unassigned --</option>
                                        {facultyList.map(fac => (
                                          <option key={fac.id} value={fac.email}>{fac.name} ({fac.designation})</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <button
                                          onClick={() => {
                                            setEditingSubject(subject);
                                            setIsEditSubjectModalOpen(true);
                                          }}
                                          className="text-[10px] font-bold text-[#4a2c2a] bg-[#f3ede2] border border-[#ede6dc] px-2 py-1 rounded-md hover:bg-[#ede6dc] transition-colors cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleRemoveSubject(subject.id, subject.name)}
                                          className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: Report Cards ─────────────────────────────── */}
              {activeTab === 'REPORT_CARDS' && (
                <ReportCardsPanel
                  API_BASE={API_BASE}
                  triggerNotification={triggerNotification}
                />
              )}

              {/* ── Tab: Uploads ──────────────────────────────────── */}
              {activeTab === 'UPLOADS' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col space-y-1.5 border-b border-[#ede6dc]/45 pb-3">
                    <h3 className="text-base font-extrabold text-[#2d1b18] flex items-center space-x-2">
                      <span className="w-1.5 h-5 bg-[#4a2c2a] rounded-full"></span>
                      <span>Upload Academic Content</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Publish notes, lab manuals, and timetables to the portal.</p>
                  </div>

                  {/* Sub-tab Pill Switcher */}
                  <div className="flex bg-[#faf7f2] border border-[#ede6dc] p-1 rounded-2xl max-w-md gap-1">
                    <button
                      type="button"
                      onClick={() => setUploadSubTab('NOTES')}
                      className={`flex items-center justify-center space-x-1.5 flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        uploadSubTab === 'NOTES'
                          ? 'bg-[#4a2c2a] text-white shadow-sm shadow-[#4a2c2a]/10'
                          : 'text-[#4a2c2a]/80 hover:text-[#4a2c2a] hover:bg-[#f3ede2]/30'
                      }`}
                    >
                      <FaBook className="w-3.5 h-3.5 shrink-0" />
                      <span>Study Notes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadSubTab('MANUALS')}
                      className={`flex items-center justify-center space-x-1.5 flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        uploadSubTab === 'MANUALS'
                          ? 'bg-[#4a2c2a] text-white shadow-sm shadow-[#4a2c2a]/10'
                          : 'text-[#4a2c2a]/80 hover:text-[#4a2c2a] hover:bg-[#f3ede2]/30'
                      }`}
                    >
                      <FaFlask className="w-3.5 h-3.5 shrink-0" />
                      <span>Lab Manuals</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadSubTab('SYLLABUS')}
                      className={`flex items-center justify-center space-x-1.5 flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        uploadSubTab === 'SYLLABUS'
                          ? 'bg-[#4a2c2a] text-white shadow-sm shadow-[#4a2c2a]/10'
                          : 'text-[#4a2c2a]/80 hover:text-[#4a2c2a] hover:bg-[#f3ede2]/30'
                      }`}
                    >
                      <FaFileAlt className="w-3.5 h-3.5 shrink-0" />
                      <span>Syllabus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadSubTab('TIMETABLE')}
                      className={`flex items-center justify-center space-x-1.5 flex-1 text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        uploadSubTab === 'TIMETABLE'
                          ? 'bg-[#4a2c2a] text-white shadow-sm shadow-[#4a2c2a]/10'
                          : 'text-[#4a2c2a]/80 hover:text-[#4a2c2a] hover:bg-[#f3ede2]/30'
                      }`}
                    >
                      <FaCalendarAlt className="w-3.5 h-3.5 shrink-0" />
                      <span>Timetable</span>
                    </button>
                  </div>

                  {/* Sub-tab content */}
                  <div className="pt-2">
                    {uploadSubTab === 'NOTES' && (
                      <form onSubmit={handleNotesSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <FieldLabel>Document Title *</FieldLabel>
                            <TextInput required value={notesForm.title} onChange={(e) => setNotesForm({ ...notesForm, title: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel>Course Code</FieldLabel>
                            <TextInput value={notesForm.courseCode} onChange={(e) => setNotesForm({ ...notesForm, courseCode: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel>Semester</FieldLabel>
                          <SelectInput value={notesForm.semester} onChange={(e) => setNotesForm({ ...notesForm, semester: e.target.value })}>
                            <option>Semester 1</option>
                            <option>Semester 2</option>
                            <option>Semester 3</option>
                            <option>Semester 4</option>
                            <option>Semester 5</option>
                            <option>Semester 6</option>
                          </SelectInput>
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel>Upload PDF File *</FieldLabel>
                          <input
                            type="file"
                            accept=".pdf"
                            required
                            onChange={(e) => setNotesForm({ ...notesForm, file: e.target.files[0] })}
                            className="w-full bg-[#faf7f2] border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#4a2c2a] file:text-white cursor-pointer"
                          />
                        </div>
                        <SubmitButton disabled={isUploading}>{isUploading ? 'Uploading file to S3...' : 'Upload Notes'}</SubmitButton>
                      </form>
                    )}

                    {uploadSubTab === 'MANUALS' && (
                      <form onSubmit={handleManualsSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <FieldLabel>Manual Title *</FieldLabel>
                            <TextInput required value={manualsForm.title} onChange={(e) => setManualsForm({ ...manualsForm, title: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel>Lab Code</FieldLabel>
                            <TextInput value={manualsForm.courseCode} onChange={(e) => setManualsForm({ ...manualsForm, courseCode: e.target.value })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <FieldLabel>Lab / Facility</FieldLabel>
                            <SelectInput value={manualsForm.lab} onChange={(e) => setManualsForm({ ...manualsForm, lab: e.target.value })}>
                              <option>PC Hardware & Networking Lab</option>
                              <option>Software Centre</option>
                              <option>IT Skills Lab</option>
                            </SelectInput>
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel>Semester</FieldLabel>
                            <SelectInput value={manualsForm.semester} onChange={(e) => setManualsForm({ ...manualsForm, semester: e.target.value })}>
                              <option>Semester 1</option>
                              <option>Semester 2</option>
                              <option>Semester 3</option>
                              <option>Semester 4</option>
                              <option>Semester 5</option>
                              <option>Semester 6</option>
                            </SelectInput>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel>Upload PDF File *</FieldLabel>
                          <input
                            type="file"
                            accept=".pdf"
                            required
                            onChange={(e) => setManualsForm({ ...manualsForm, file: e.target.files[0] })}
                            className="w-full bg-[#faf7f2] border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#4a2c2a] file:text-white cursor-pointer"
                          />
                        </div>
                        <SubmitButton disabled={isUploading}>{isUploading ? 'Uploading file to S3...' : 'Upload Lab Manual'}</SubmitButton>
                      </form>
                    )}

                    {uploadSubTab === 'SYLLABUS' && (
                      <form onSubmit={handleSyllabusSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <FieldLabel>Syllabus Title *</FieldLabel>
                            <TextInput required value={syllabusForm.title} onChange={(e) => setSyllabusForm({ ...syllabusForm, title: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <FieldLabel>Subject Code</FieldLabel>
                            <TextInput value={syllabusForm.courseCode} onChange={(e) => setSyllabusForm({ ...syllabusForm, courseCode: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel>Semester</FieldLabel>
                          <SelectInput value={syllabusForm.semester} onChange={(e) => setSyllabusForm({ ...syllabusForm, semester: e.target.value })}>
                            <option>Semester 1</option>
                            <option>Semester 2</option>
                            <option>Semester 3</option>
                            <option>Semester 4</option>
                            <option>Semester 5</option>
                            <option>Semester 6</option>
                          </SelectInput>
                        </div>
                        <div className="space-y-1.5">
                          <FieldLabel>Upload PDF File *</FieldLabel>
                          <input
                            type="file"
                            accept=".pdf"
                            required
                            onChange={(e) => setSyllabusForm({ ...syllabusForm, file: e.target.files[0] })}
                            className="w-full bg-[#faf7f2] border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#4a2c2a] file:text-white cursor-pointer"
                          />
                        </div>
                        <SubmitButton disabled={isUploading}>{isUploading ? 'Uploading file to S3...' : 'Upload Syllabus'}</SubmitButton>
                      </form>
                    )}

                    {uploadSubTab === 'TIMETABLE' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Timetable Mode Toggle */}
                        <div className="flex bg-[#faf7f2] p-1 rounded-xl border border-[#ede6dc] max-w-md">
                          <button
                            type="button"
                            onClick={() => setTimetableMode('upload')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 ${
                              timetableMode === 'upload'
                                ? 'bg-[#4a2c2a] text-white shadow-sm'
                                : 'text-[#4a2c2a]/70 hover:text-[#4a2c2a]'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>1. Upload Timetable File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimetableMode('customize')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 ${
                              timetableMode === 'customize'
                                ? 'bg-[#4a2c2a] text-white shadow-sm'
                                : 'text-[#4a2c2a]/70 hover:text-[#4a2c2a]'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <span>2. Customize Grid</span>
                          </button>
                        </div>

                        {/* Mode 1: File Upload */}
                        {timetableMode === 'upload' && (
                          <form onSubmit={handleTimetableSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <FieldLabel>Semester *</FieldLabel>
                                <SelectInput value={timetableForm.semester} onChange={(e) => setTimetableForm({ ...timetableForm, semester: e.target.value })}>
                                  <option>Semester 1</option>
                                  <option>Semester 2</option>
                                  <option>Semester 3</option>
                                  <option>Semester 4</option>
                                  <option>Semester 5</option>
                                  <option>Semester 6</option>
                                </SelectInput>
                              </div>
                              <div className="space-y-1.5">
                                <FieldLabel>Effective From</FieldLabel>
                                <TextInput type="date" value={timetableForm.effectiveFrom} onChange={(e) => setTimetableForm({ ...timetableForm, effectiveFrom: e.target.value })} />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <FieldLabel>Upload Timetable File (PDF/Image) *</FieldLabel>
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                required
                                onChange={(e) => setTimetableForm({ ...timetableForm, file: e.target.files[0] })}
                                className="w-full bg-[#faf7f2] border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#4a2c2a] file:text-white cursor-pointer"
                              />
                            </div>
                            <div className="bg-[#faf7f2] border border-[#ede6dc] rounded-xl p-4 text-xs text-slate-500 flex items-start space-x-2">
                              <svg className="w-4 h-4 text-[#4a2c2a] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p>Uploading a new timetable will replace the existing one for the selected semester. Students will see the updated timetable image directly on their dashboard.</p>
                            </div>
                            <SubmitButton disabled={isUploading}>{isUploading ? 'Uploading timetable to S3...' : 'Publish Timetable'}</SubmitButton>
                          </form>
                        )}

                        {/* Mode 2: Interactive Grid Customizer */}
                        {timetableMode === 'customize' && (
                          <div className="space-y-6">
                            {/* Semester Selection */}
                            <div className="max-w-xs space-y-1.5">
                              <FieldLabel>Select Semester to Customize</FieldLabel>
                              <SelectInput value={selectedTimetableSem} onChange={(e) => setSelectedTimetableSem(e.target.value)}>
                                <option>Semester 1</option>
                                <option>Semester 2</option>
                                <option>Semester 3</option>
                                <option>Semester 4</option>
                                <option>Semester 5</option>
                                <option>Semester 6</option>
                              </SelectInput>
                            </div>

                            {/* Table of Custom Slots */}
                            <div className="border border-[#ede6dc] rounded-2xl overflow-hidden bg-white shadow-3xs">
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                  <thead>
                                    <tr className="bg-[#faf7f2]/55 border-b border-[#ede6dc] text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                      <th className="p-3 pl-5 w-44">Time Slot</th>
                                      <th className="p-3">Monday</th>
                                      <th className="p-3">Tuesday</th>
                                      <th className="p-3">Wednesday</th>
                                      <th className="p-3">Thursday</th>
                                      <th className="p-3">Friday</th>
                                      <th className="p-3 text-center w-24">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#ede6dc]/60 text-xs">
                                    {customSlots.map((slot) => (
                                      <tr key={slot.id} className="hover:bg-[#faf7f2]/20 transition-colors duration-200">
                                        <td className="p-2 pl-4">
                                          <input
                                            type="text"
                                            value={slot.timeSlot}
                                            onChange={(e) => setCustomSlots(customSlots.map(s => s.id === slot.id ? { ...s, timeSlot: e.target.value } : s))}
                                            className="w-full bg-transparent border-b border-transparent focus:border-[#4a2c2a] focus:outline-none p-1 font-bold text-[#4a2c2a] text-xs"
                                          />
                                        </td>
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
                                          <td key={day} className="p-2">
                                            <input
                                              type="text"
                                              value={slot[day] || ''}
                                              onChange={(e) => setCustomSlots(customSlots.map(s => s.id === slot.id ? { ...s, [day]: e.target.value } : s))}
                                              className="w-full bg-transparent border-b border-transparent focus:border-[#4a2c2a] focus:outline-none p-1 text-slate-700 text-xs"
                                              placeholder="-"
                                            />
                                          </td>
                                        ))}
                                        <td className="p-2 text-center">
                                          <div className="flex items-center justify-center space-x-1.5">
                                            <button
                                              onClick={() => handleUpdateSlot(slot.id, {
                                                timeSlot: slot.timeSlot,
                                                monday: slot.monday,
                                                tuesday: slot.tuesday,
                                                wednesday: slot.wednesday,
                                                thursday: slot.thursday,
                                                friday: slot.friday
                                              })}
                                              title="Save Row Changes"
                                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                            >
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSlot(slot.id)}
                                              title="Delete Row"
                                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                            >
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}

                                    {/* Add New Row Form */}
                                    <tr className="bg-[#faf7f2]/10">
                                      <td className="p-2 pl-4">
                                        <input
                                          type="text"
                                          placeholder="New Slot (e.g. 09:00 AM - 10:00 AM)"
                                          value={newSlotForm.timeSlot}
                                          onChange={(e) => setNewSlotForm({ ...newSlotForm, timeSlot: e.target.value })}
                                          className="w-full bg-white border border-[#ede6dc] px-2 py-1.5 rounded-lg text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] font-bold placeholder-slate-400"
                                        />
                                      </td>
                                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
                                        <td key={day} className="p-2">
                                          <input
                                            type="text"
                                            placeholder="Subject / Lab"
                                            value={newSlotForm[day]}
                                            onChange={(e) => setNewSlotForm({ ...newSlotForm, [day]: e.target.value })}
                                            className="w-full bg-white border border-[#ede6dc] px-2 py-1.5 rounded-lg text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] placeholder-slate-400"
                                          />
                                        </td>
                                      ))}
                                      <td className="p-2 text-center">
                                        <button
                                          onClick={handleCreateSlot}
                                          disabled={isSavingSlot || !newSlotForm.timeSlot}
                                          className="px-3.5 py-1.5 rounded-lg bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
                                        >
                                          {isSavingSlot ? 'Saving...' : 'Add Row'}
                                        </button>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            {customSlots.length === 0 && (
                              <p className="text-center text-slate-400 font-semibold text-xs py-4 border border-dashed border-[#ede6dc] rounded-2xl">
                                No custom slots configured for {selectedTimetableSem} yet. Enter a slot name and details below to create one.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Post Announcements ────────────────────────── */}
              {activeTab === 'ANNOUNCEMENTS' && (
                <form onSubmit={handleAnnouncementSubmit} className="space-y-5">
                  <h3 className="text-base font-extrabold text-[#2d1b18] flex items-center space-x-2">
                    <span className="w-1.5 h-5 bg-[#4a2c2a] rounded-full"></span>
                    <span>Post Announcement</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <FieldLabel>Announcement Title *</FieldLabel>
                      <TextInput required value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Category</FieldLabel>
                      <SelectInput value={announcementForm.category} onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}>
                        <option value="GENERAL">General Notice</option>
                        <option value="EXAMS">Exams Board</option>
                        <option value="PLACEMENT">Placements</option>
                        <option value="SEMINAR">Expert Seminar</option>
                        <option value="HOLIDAY">Holiday / Event</option>
                      </SelectInput>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Circular Details *</FieldLabel>
                    <textarea
                      required
                      rows={4}

                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      className="w-full bg-white border border-[#ede6dc] p-4 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] resize-none transition-colors duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>Attachment PDF Link (Optional)</FieldLabel>
                    <TextInput type="url" value={announcementForm.attachmentUrl} onChange={(e) => setAnnouncementForm({ ...announcementForm, attachmentUrl: e.target.value })} />
                  </div>
                  <SubmitButton disabled={submittingAnnouncement}>
                    {submittingAnnouncement ? 'Publishing...' : 'Publish Announcement'}
                  </SubmitButton>

                </form>
              )}

              {/* ── Tab: Add/Edit Faculty (Admin only) ──────────────────────────── */}
              {activeTab === 'FACULTY' && currentUser?.role !== 'FACULTY' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Header bar with Add Faculty button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#ede6dc]/45 pb-4 space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3.5">
                      <span className="w-1.5 h-5 bg-[#4a2c2a] rounded-full"></span>
                      <div>
                        <h3 className="text-base font-extrabold text-[#2d1b18]">Faculty Directory</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Members: {facultyList.length} Members</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAddFacultyModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-[#4a2c2a]/10"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Add Faculty</span>
                    </button>
                  </div>

                  {/* Existing Faculty List */}
                  <div className="space-y-2 pt-2">
                    {facultyList.map((f) => (
                      <div key={f.id} className="flex items-center justify-between bg-[#faf7f2] border border-[#ede6dc]/70 px-4 py-3.5 rounded-xl hover:bg-[#ede6dc]/20 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4a2c2a] to-[#8d6e63] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {f.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#2d1b18]">{f.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{f.designation} · {f.department === 'AI_DS' ? 'AI & DS' : f.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => {
                              let publicationsText = '';
                              try {
                                if (f.researchPublications) {
                                  const parsed = JSON.parse(f.researchPublications);
                                  if (Array.isArray(parsed)) {
                                    publicationsText = parsed.join('\n');
                                  } else {
                                    publicationsText = f.researchPublications;
                                  }
                                }
                              } catch (e) {
                                publicationsText = f.researchPublications || '';
                              }
                              setEditingFaculty({
                                ...f,
                                publications: publicationsText
                              });
                              setIsEditFacultyModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-[#4a2c2a] bg-[#f3ede2] border border-[#ede6dc] px-3 py-1.5 rounded-lg hover:bg-[#ede6dc] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleRemoveFaculty(f.id, f.name)}
                            className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: Manage Resources ──────────────────────────── */}
              {activeTab === 'RESOURCES' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col space-y-1.5 border-b border-[#ede6dc]/45 pb-3">
                    <h3 className="text-base font-extrabold text-[#2d1b18] flex items-center space-x-2">
                      <span className="w-1.5 h-5 bg-[#4a2c2a] rounded-full"></span>
                      <span>Manage Student Resources</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Review and moderate all study materials, notes, and lab manuals.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {resourcesList.map((res) => (
                      <div 
                        key={res.id} 
                        className="bg-white border border-[#ede6dc] hover:border-[#4a2c2a]/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="space-y-3">
                          {/* Top Row: Category & Code */}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-[#4a2c2a] bg-[#f3ede2] border border-[#ede6dc] px-2 py-0.5 rounded-md">
                              {res.code || 'CS-GEN'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                              {res.category === 'LAB_MANUAL' ? 'Lab Manual' : res.category === 'NOTES' ? 'Notes' : res.category}
                            </span>
                          </div>

                          {/* Icon & Title */}
                          <div className="flex items-start space-x-3 pt-1">
                            <div className="w-9 h-9 rounded-xl bg-[#faf7f2] border border-[#ede6dc] flex items-center justify-center text-[#4a2c2a] shrink-0 group-hover:bg-[#4a2c2a] group-hover:text-white transition-colors duration-200">
                              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs font-bold text-[#2d1b18] line-clamp-2 leading-relaxed" title={res.title}>
                                {res.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold">{res.semester}</p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Metadata & Actions */}
                        <div className="border-t border-[#ede6dc]/50 pt-3 flex flex-col space-y-3">
                          <div className="flex items-center justify-between text-[9px] text-slate-450 font-semibold">
                            <span>Uploaded by:</span>
                            <span className="text-[#4a2c2a] font-bold truncate max-w-[125px]">{res.uploadedBy || 'Faculty'}</span>
                          </div>

                          <div className="grid gap-2 pt-1" style={{ gridTemplateColumns: currentUser?.role === 'FACULTY' ? '1fr' : '1fr 1fr' }}>
                            <button 
                              onClick={() => {
                                if (res.fileUrl) {
                                  window.open(res.fileUrl, '_blank');
                                } else {
                                  triggerNotification('✗ No file URL found for this resource.');
                                }
                              }}
                              className="py-2 text-[10px] font-bold text-slate-500 bg-[#faf7f2] hover:bg-[#ede6dc]/30 border border-[#ede6dc]/80 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              View
                            </button>
                            {currentUser?.role !== 'FACULTY' && (
                              <button 
                                onClick={() => handleRemoveResource(res.id, res.title)}
                                className="py-2 text-[10px] font-bold text-red-600 bg-red-50/50 hover:bg-red-50 border border-red-200/60 rounded-lg transition-colors cursor-pointer text-center"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center pt-2">Showing {resourcesList.length} of 24 resources · <span className="text-[#4a2c2a] font-bold cursor-pointer hover:underline">Load more</span></p>
                </div>
              )}

            </div>
          </div>
        </main>

        {/* ── Modal: Add Student ──────────────────────────────── */}
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 bg-[#2d1b18]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-[#ede6dc] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <div className="flex justify-between items-center border-b border-[#ede6dc]/60 pb-3">
                <h3 className="text-sm font-extrabold text-[#2d1b18] flex items-center space-x-2">
                  <span className="w-1.5 h-4 bg-[#4a2c2a] rounded-full"></span>
                  <span>Register Student ({selectedSemester})</span>
                </h3>
                <button 
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-[#ede6dc]/40 pb-0.5">
                <button
                  type="button"
                  onClick={() => setAddStudentMode('manual')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    addStudentMode === 'manual'
                      ? 'border-[#4a2c2a] text-[#4a2c2a]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setAddStudentMode('excel')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    addStudentMode === 'excel'
                      ? 'border-[#4a2c2a] text-[#4a2c2a]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Excel Sheet Import
                </button>
              </div>

              {addStudentMode === 'manual' ? (
                <form onSubmit={handleStudentSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <FieldLabel>Full Name *</FieldLabel>
                        <TextInput 
                          required 
                          value={studentForm.name} 
                          onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Official Email *</FieldLabel>
                        <TextInput 
                          required 
                          type="email" 
                          value={studentForm.email} 
                          onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Enrollment ID *</FieldLabel>
                        <TextInput 
                          required 
                          value={studentForm.enrollmentId} 
                          onChange={(e) => setStudentForm({ ...studentForm, enrollmentId: e.target.value })} 
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <FieldLabel>Gender</FieldLabel>
                        <SelectInput 
                          value={studentForm.gender} 
                          onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                        >
                          <option value="MALE">Boys (MALE)</option>
                          <option value="FEMALE">Girls (FEMALE)</option>
                        </SelectInput>
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Group</FieldLabel>
                        <SelectInput 
                          value={studentForm.group} 
                          onChange={(e) => setStudentForm({ ...studentForm, group: e.target.value })}
                        >
                          <option value="Group A">Group A</option>
                          <option value="Group B">Group B</option>
                        </SelectInput>
                      </div>
                      <div className="space-y-1">
                        <FieldLabel>Temporary Password *</FieldLabel>
                        <div className="relative">
                          <input
                            type={showAddStudentPassword ? "text" : "password"}
                            required
                            value={studentForm.password}
                            onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                            className="w-full bg-white border border-[#ede6dc] pl-3.5 pr-10 py-2.5 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAddStudentPassword(!showAddStudentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                          >
                            {showAddStudentPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStudent}
                      className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                    >
                      {submittingStudent ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Registering...</span>
                        </>
                      ) : (
                        <span>Register Student</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleExcelImport} className="space-y-5">
                  <div className="space-y-4">
                    {/* Instructions and Download Template */}
                    <div className="bg-[#faf7f2] border border-[#ede6dc] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#2d1b18]">Download Sample Template</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Use our template with pre-configured headers for a seamless import.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.open(`${API_BASE}/api/admin/students/sample-sheet`, '_blank')}
                        className="self-start sm:self-center px-4 py-2 rounded-xl bg-white border border-[#ede6dc] text-[#4a2c2a] hover:bg-[#ede6dc]/15 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download Excel</span>
                      </button>
                    </div>

                    {/* File Upload zone */}
                    <div className="space-y-1.5">
                      <FieldLabel>Select Excel Spreadsheet (.xlsx, .xls) *</FieldLabel>
                      <div className="border-2 border-dashed border-[#ede6dc] hover:border-[#4a2c2a]/60 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/30">
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          required
                          onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#4a2c2a]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          {excelFile ? (
                            <span className="text-xs font-bold text-[#4a2c2a] truncate max-w-xs">{excelFile.name}</span>
                          ) : (
                            <>
                              <span className="text-xs font-bold text-[#2d1b18]">Drag & drop file or click to browse</span>
                              <span className="text-[10px] text-slate-400 font-semibold">Supports spreadsheets containing email, name, gender (M/F)</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Import Mode selection */}
                    <div className="space-y-2">
                      <FieldLabel>Import Strategy</FieldLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`border rounded-2xl p-3.5 flex items-start space-x-3 cursor-pointer transition-all ${
                          importMode === 'merge'
                            ? 'border-[#4a2c2a] bg-[#4a2c2a]/5 shadow-3xs'
                            : 'border-[#ede6dc] hover:bg-[#faf7f2]'
                        }`}>
                          <input
                            type="radio"
                            name="importMode"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                            className="mt-0.5 text-[#4a2c2a] focus:ring-[#4a2c2a]"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-[#2d1b18] block">Merge / Append Entries</span>
                            <span className="text-[10px] text-slate-400 font-medium leading-relaxed block">
                              Safe mode. Updates details of existing students (matching emails) and registers new ones. Preserves attendance history.
                            </span>
                          </div>
                        </label>

                        <label className={`border rounded-2xl p-3.5 flex items-start space-x-3 cursor-pointer transition-all ${
                          importMode === 'clear'
                            ? 'border-rose-500 bg-rose-500/5 shadow-3xs'
                            : 'border-[#ede6dc] hover:bg-[#faf7f2]'
                        }`}>
                          <input
                            type="radio"
                            name="importMode"
                            value="clear"
                            checked={importMode === 'clear'}
                            onChange={() => setImportMode('clear')}
                            className="mt-0.5 text-rose-500 focus:ring-rose-500"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-[#2d1b18] block text-rose-600">Clear & Fresh Import</span>
                            <span className="text-[10px] text-slate-400 font-medium leading-relaxed block">
                              Destructive mode. Deletes all student accounts currently enrolled in {selectedSemester} and wipes their attendance logs before importing the sheet.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Warning Notice if Clear mode is selected */}
                    {importMode === 'clear' && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold p-3.5 rounded-xl leading-relaxed">
                        ⚠️ <strong>Warning:</strong> Selecting "Clear & Fresh Import" is destructive. You will lose all current students and attendance history for {selectedSemester} once the upload succeeds.
                      </div>
                    )}

                    {/* Import Status/Result Display */}
                    {importStatus === 'uploading' && (
                      <div className="bg-[#faf7f2] border border-[#ede6dc] p-4 rounded-2xl flex items-center justify-center space-x-2.5">
                        <div className="w-4 h-4 border-2 border-[#4a2c2a] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-[#4a2c2a]">Processing spreadsheet, registering students...</span>
                      </div>
                    )}

                    {importStatus === 'success' && importSummary && (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center space-x-2 text-emerald-800 text-xs font-extrabold">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Import Completed Successfully!</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center pt-1 text-[10px] font-bold">
                          <div className="bg-emerald-100/50 p-2 rounded-xl text-emerald-900">
                            <div className="text-xs font-black">{importSummary.successCount}</div>
                            <div>Added</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded-xl text-blue-900">
                            <div className="text-xs font-black">{importSummary.updatedCount}</div>
                            <div>Updated</div>
                          </div>
                          <div className="bg-amber-50 p-2 rounded-xl text-amber-900">
                            <div className="text-xs font-black">{importSummary.skipCount}</div>
                            <div>Skipped</div>
                          </div>
                          <div className="bg-rose-50 p-2 rounded-xl text-rose-900">
                            <div className="text-xs font-black">{importSummary.failCount}</div>
                            <div>Failed</div>
                          </div>
                        </div>
                        {importSummary.warnings && importSummary.warnings.length > 0 && (
                          <div className="pt-2 text-[9px] text-amber-800 space-y-1">
                            <div className="font-extrabold uppercase">Warnings/Skip Logs:</div>
                            <div className="max-h-24 overflow-y-auto bg-white/50 border border-amber-200 p-2 rounded-lg font-semibold space-y-1">
                              {importSummary.warnings.map((warn, wIdx) => (
                                <div key={wIdx}>• {warn}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {importStatus === 'error' && (
                      <div className="bg-rose-50 border border-rose-250 text-rose-700 text-xs px-4 py-3 rounded-2xl font-bold">
                        ✗ An error occurred while uploading and parsing the Excel file. Please ensure it matches our template and contains valid emails.
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                    >
                      Close
                    </button>
                    {importStatus !== 'success' && (
                      <button
                        type="submit"
                        disabled={importStatus === 'uploading' || !excelFile}
                        className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                      >
                        {importStatus === 'uploading' ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Importing...</span>
                          </>
                        ) : (
                          <span>Start Import</span>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── Modal: Add Subject ──────────────────────────────── */}
        {isAddSubjectModalOpen && (
          <div className="fixed inset-0 bg-[#2d1b18]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-[#ede6dc] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <div className="flex justify-between items-center border-b border-[#ede6dc]/60 pb-3">
                <h3 className="text-sm font-extrabold text-[#2d1b18] flex items-center space-x-2">
                  <span className="w-1.5 h-4 bg-[#4a2c2a] rounded-full"></span>
                  <span>Add Subject ({selectedSemester})</span>
                </h3>
                <button 
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubjectSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Subject Name *</FieldLabel>
                      <TextInput 
                        required 
                        value={subjectForm.name} 
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Course Code *</FieldLabel>
                      <TextInput 
                        required 
                        value={subjectForm.code} 
                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Credits *</FieldLabel>
                      <input
                        type="number"
                        required
                        min="1"
                        max="10"
                        value={subjectForm.credits}
                        onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Course Type</FieldLabel>
                      <SelectInput 
                        value={subjectForm.type} 
                        onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                      >
                        <option value="Core Theory">Core Theory</option>
                        <option value="Practical Lab">Practical Lab</option>
                        <option value="Elective">Elective</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Theory Hours / Week</FieldLabel>
                      <TextInput 
                        value={subjectForm.theory} 
                        onChange={(e) => setSubjectForm({ ...subjectForm, theory: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Practical Hours / Week</FieldLabel>
                      <TextInput 
                        value={subjectForm.practical} 
                        onChange={(e) => setSubjectForm({ ...subjectForm, practical: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSubject}
                    className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    {submittingSubject ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Subject</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Add Faculty ──────────────────────────────── */}
        {isAddFacultyModalOpen && (
          <div className="fixed inset-0 bg-[#2d1b18]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-[#ede6dc] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <div className="flex justify-between items-center border-b border-[#ede6dc]/60 pb-3">
                <h3 className="text-sm font-extrabold text-[#2d1b18] flex items-center space-x-2">
                  <span className="w-1.5 h-4 bg-[#4a2c2a] rounded-full"></span>
                  <span>Add New Faculty Member</span>
                </h3>
                <button 
                  onClick={() => setIsAddFacultyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                await handleFacultySubmit(e);
                setIsAddFacultyModalOpen(false);
              }} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Full Name *</FieldLabel>
                      <TextInput 
                        required 
                        value={facultyForm.name} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Official Email *</FieldLabel>
                      <TextInput 
                        required 
                        type="email" 
                        value={facultyForm.email} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Department</FieldLabel>
                      <SelectInput 
                        value={facultyForm.department} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                      >
                        <option value="CSE">Computer Science (CSE)</option>
                        <option value="AI_DS">AI & Data Science</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Designation</FieldLabel>
                      <SelectInput 
                        value={facultyForm.designation} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                      >
                        <option>Admin</option>
                        <option>Hod</option>
                        <option>Senior Lecturer</option>
                        <option>Lecturer</option>
                        <option>Asst Lecturer</option>
                        <option>System admin</option>
                        <option>Instructor</option>
                      </SelectInput>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Qualifications</FieldLabel>
                      <TextInput 
                        value={facultyForm.qualification} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, qualification: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Experience</FieldLabel>
                      <TextInput 
                        value={facultyForm.experience} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, experience: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Office Hours</FieldLabel>
                      <TextInput 
                        value={facultyForm.officeHours} 
                        onChange={(e) => setFacultyForm({ ...facultyForm, officeHours: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Research Publications (separate with ';')</FieldLabel>
                      <textarea
                        rows={2}
                        value={facultyForm.publications}
                        onChange={(e) => setFacultyForm({ ...facultyForm, publications: e.target.value })}
                        className="w-full bg-white border border-[#ede6dc] p-2.5 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] resize-none transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Profile Picture</FieldLabel>
                      {facultyPhotoFile && (
                        <div className="flex items-center space-x-3 mb-2 animate-in fade-in duration-200">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#ede6dc] shrink-0 bg-[#faf7f2]">
                            <img 
                              src={URL.createObjectURL(facultyPhotoFile)} 
                              alt="Selected preview" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="text-[10px] text-[#8d6e63] font-bold uppercase tracking-wider">New Selected Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFacultyPhotoFile(e.target.files?.[0] || null)}
                        className="w-full bg-white border border-[#ede6dc] px-3 py-2 rounded-xl text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                  <button
                    type="button"
                    onClick={() => setIsAddFacultyModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFaculty}
                    className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    {submittingFaculty ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>Add Faculty Member</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ── Modal: Edit Student ──────────────────────────────── */}
        {isEditStudentModalOpen && editingStudent && (
          <div className="fixed inset-0 bg-[#2d1b18]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-[#ede6dc] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <div className="flex justify-between items-center border-b border-[#ede6dc]/60 pb-3">
                <h3 className="text-sm font-extrabold text-[#2d1b18] flex items-center space-x-2">
                  <span className="w-1.5 h-4 bg-[#4a2c2a] rounded-full"></span>
                  <span>Edit Student Profile ({editingStudent.name})</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsEditStudentModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleStudentUpdate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Full Name *</FieldLabel>
                      <TextInput 
                        required 
                        value={editingStudent.name} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Official Email *</FieldLabel>
                      <TextInput 
                        required 
                        type="email" 
                        value={editingStudent.email} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Enrollment ID *</FieldLabel>
                      <TextInput 
                        required 
                        value={editingStudent.enrollmentId} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, enrollmentId: e.target.value })} 
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Gender</FieldLabel>
                      <SelectInput 
                        value={editingStudent.gender} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                      >
                        <option value="MALE">Boys (MALE)</option>
                        <option value="FEMALE">Girls (FEMALE)</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Group</FieldLabel>
                      <SelectInput 
                        value={editingStudent.group} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, group: e.target.value })}
                      >
                        <option value="Group A">Group A</option>
                        <option value="Group B">Group B</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Change Password (leave blank to keep current)</FieldLabel>
                      <div className="relative">
                        <input
                          type={showEditStudentPassword ? "text" : "password"}
                          value={editingStudent.password || ''}
                          onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                          className="w-full bg-white border border-[#ede6dc] pl-3.5 pr-10 py-2.5 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                          placeholder="Leave blank to keep current"
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditStudentPassword(!showEditStudentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
                        >
                          {showEditStudentPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditStudentModalOpen(false);
                      setEditingStudent(null);
                    }}
                    className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStudent}
                    className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    {submittingStudent ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Edit Subject ──────────────────────────────── */}
        {isEditSubjectModalOpen && editingSubject && (
          <div className="fixed inset-0 bg-[#2d1b18]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-[#ede6dc] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <div className="flex justify-between items-center border-b border-[#ede6dc]/60 pb-3">
                <h3 className="text-sm font-extrabold text-[#2d1b18] flex items-center space-x-2">
                  <span className="w-1.5 h-4 bg-[#4a2c2a] rounded-full"></span>
                  <span>Edit Subject ({editingSubject.name})</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsEditSubjectModalOpen(false);
                    setEditingSubject(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubjectUpdate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Subject Name *</FieldLabel>
                      <TextInput 
                        required 
                        value={editingSubject.name} 
                        onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Course Code *</FieldLabel>
                      <TextInput 
                        required 
                        value={editingSubject.code} 
                        onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Credits *</FieldLabel>
                      <input
                        type="number"
                        required
                        min="1"
                        max="10"
                        value={editingSubject.credits}
                        onChange={(e) => setEditingSubject({ ...editingSubject, credits: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white border border-[#ede6dc] px-3.5 py-2.5 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Course Type</FieldLabel>
                      <SelectInput 
                        value={editingSubject.type} 
                        onChange={(e) => setEditingSubject({ ...editingSubject, type: e.target.value })}
                      >
                        <option value="Core Theory">Core Theory</option>
                        <option value="Practical Lab">Practical Lab</option>
                        <option value="Elective">Elective</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Theory Hours / Week</FieldLabel>
                      <TextInput 
                        value={editingSubject.theory} 
                        onChange={(e) => setEditingSubject({ ...editingSubject, theory: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Practical Hours / Week</FieldLabel>
                      <TextInput 
                        value={editingSubject.practical} 
                        onChange={(e) => setEditingSubject({ ...editingSubject, practical: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditSubjectModalOpen(false);
                      setEditingSubject(null);
                    }}
                    className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSubject}
                    className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    {submittingSubject ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Edit Faculty ──────────────────────────────── */}
        {isEditFacultyModalOpen && editingFaculty && (
          <div className="fixed inset-0 bg-[#2d1b18]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-[#ede6dc] rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <div className="flex justify-between items-center border-b border-[#ede6dc]/60 pb-3">
                <h3 className="text-sm font-extrabold text-[#2d1b18] flex items-center space-x-2">
                  <span className="w-1.5 h-4 bg-[#4a2c2a] rounded-full"></span>
                  <span>Edit Faculty Profile ({editingFaculty.name})</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsEditFacultyModalOpen(false);
                    setEditingFaculty(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleFacultyUpdate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Full Name *</FieldLabel>
                      <TextInput 
                        required 
                        value={editingFaculty.name} 
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Official Email *</FieldLabel>
                      <TextInput 
                        required 
                        type="email" 
                        value={editingFaculty.email} 
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Department</FieldLabel>
                      <SelectInput 
                        value={editingFaculty.department} 
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, department: e.target.value })}
                      >
                        <option value="CSE">Computer Science (CSE)</option>
                        <option value="AI_DS">AI & Data Science</option>
                      </SelectInput>
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Designation</FieldLabel>
                      <SelectInput 
                        value={editingFaculty.designation} 
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, designation: e.target.value })}
                      >
                        <option>Admin</option>
                        <option>Hod</option>
                        <option>Senior Lecturer</option>
                        <option>Lecturer</option>
                        <option>Asst Lecturer</option>
                        <option>System admin</option>
                        <option>Instructor</option>
                      </SelectInput>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <FieldLabel>Qualifications</FieldLabel>
                      <TextInput 
                        value={editingFaculty.qualification} 
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, qualification: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Experience</FieldLabel>
                      <TextInput 
                        value={editingFaculty.experience} 
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, experience: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Office Hours</FieldLabel>
                      <TextInput 
                        value={editingFaculty.officeHours} 
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, officeHours: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Research Publications (separate with newlines)</FieldLabel>
                      <textarea
                        rows={2}
                        value={editingFaculty.publications}
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, publications: e.target.value })}
                        className="w-full bg-white border border-[#ede6dc] p-2.5 rounded-xl text-xs text-[#2d1b18] placeholder-slate-400 focus:outline-none focus:border-[#4a2c2a] resize-none transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Profile Picture</FieldLabel>
                      {(editingFacultyPhotoFile || editingFaculty.photoUrl) && (
                        <div className="flex items-center space-x-3 mb-2 animate-in fade-in duration-200">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#ede6dc] shrink-0 bg-[#faf7f2] flex items-center justify-center text-xs font-bold text-[#4a2c2a]">
                            <img 
                              src={editingFacultyPhotoFile ? URL.createObjectURL(editingFacultyPhotoFile) : editingFaculty.photoUrl} 
                              alt="Profile preview" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerText = editingFaculty.name ? editingFaculty.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-[#8d6e63] font-bold uppercase tracking-wider">
                            {editingFacultyPhotoFile ? 'New Selected Photo' : 'Current Picture'}
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditingFacultyPhotoFile(e.target.files?.[0] || null)}
                        className="w-full bg-white border border-[#ede6dc] px-3 py-2 rounded-xl text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditFacultyModalOpen(false);
                      setEditingFaculty(null);
                    }}
                    className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFaculty}
                    className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    {submittingFaculty ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card-bg border border-card-border p-6 rounded-3xl shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-200 text-foreground">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">{confirmModal.title}</h3>
              <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{confirmModal.message}</p>
              <div className="flex items-center space-x-3 mt-6">
                <button
                  disabled={confirmModal.isLoading}
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`flex-1 py-2.5 rounded-xl border border-card-border bg-white text-foreground hover:bg-primary-brown-light text-xs font-bold transition-colors cursor-pointer ${confirmModal.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {confirmModal.cancelText}
                </button>
                <button
                  disabled={confirmModal.isLoading}
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-2.5 rounded-xl bg-primary-brown hover:bg-primary-brown-hover text-white text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center justify-center ${confirmModal.isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {confirmModal.isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    confirmModal.confirmText
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isChangePhotoModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#faf7f2] border border-[#ede6dc] p-6 rounded-3xl shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-200 text-slate-800">
              <button
                onClick={() => {
                  setIsChangePhotoModalOpen(false);
                  setChangePhotoFile(null);
                }}
                className="absolute top-4 right-4 text-[#4a2c2a] hover:text-[#5d3a37] bg-[#f3ede2] p-2.5 rounded-xl border border-[#ede6dc] hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
              
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#2d1b18] border-b border-[#ede6dc] pb-2">Change Profile Photo</h3>
              
              <form onSubmit={handleFacultyChangePhoto} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <FieldLabel>Select Profile Picture</FieldLabel>
                  
                  {/* Preview Container */}
                  {changePhotoFile && (
                    <div className="flex items-center space-x-3 mb-2 animate-in fade-in duration-200">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#ede6dc] shrink-0 bg-[#faf7f2]">
                        <img 
                          src={URL.createObjectURL(changePhotoFile)} 
                          alt="New preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <span className="text-[10px] text-[#8d6e63] font-bold uppercase tracking-wider">New Selected Photo</span>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setChangePhotoFile(e.target.files?.[0] || null)}
                    className="w-full bg-white border border-[#ede6dc] px-3 py-2 rounded-xl text-xs text-[#2d1b18] focus:outline-none focus:border-[#4a2c2a] transition-colors duration-200"
                  />
                </div>
                
                <div className="pt-3 flex justify-end space-x-3 border-t border-[#ede6dc]/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePhotoModalOpen(false);
                      setChangePhotoFile(null);
                    }}
                    className="px-6 py-2.5 rounded-xl border border-[#ede6dc] bg-white hover:bg-[#faf7f2] text-slate-500 hover:text-slate-700 text-xs font-bold transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPhoto}
                    className="px-6 py-2.5 rounded-xl bg-[#4a2c2a] hover:bg-[#5d3a37] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#4a2c2a]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    {submittingPhoto ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <span>Upload Photo</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

