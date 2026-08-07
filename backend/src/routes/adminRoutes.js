const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer to store files in memory buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

const {
  getDashboardStats,
  getSemesterStudents,
  createStudent,
  createSubject,
  getSubjects,
  assignFacultyToSubject,
  getTimetableSlots,
  updateSubject,
  deleteSubject,
  updateStudent,
  deleteStudent,
  getDailyAttendanceStats,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  getSampleSheet,
  importSemesterStudents
} = require('../controllers/adminController');

const {
  getMarksSheet,
  saveMarksSheet,
  getMarksSampleSheet,
  importMarksSheet,
  getMonthlyAttendance,
  exportMonthlyAttendanceExcel,
  exportStudentAttendanceSlipsExcel,
  generateReportCard,
  generateReportCardExcel
} = require('../controllers/reportCardController');

router.get('/stats', getDashboardStats);
router.get('/daily-attendance-stats', getDailyAttendanceStats);
router.get('/semesters/:semester/students', getSemesterStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.get('/students/sample-sheet', getSampleSheet);
router.post('/students/import', upload.single('file'), importSemesterStudents);
router.post('/subjects', createSubject);
router.get('/subjects', getSubjects);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);
router.put('/subjects/:id/assign-faculty', assignFacultyToSubject);
router.get('/timetable', getTimetableSlots);
router.post('/timetable', createTimetableSlot);
router.put('/timetable/:id', updateTimetableSlot);
router.delete('/timetable/:id', deleteTimetableSlot);

// Report cards / marks / monthly attendance
router.get('/report-cards/marks', getMarksSheet);
router.post('/report-cards/marks', saveMarksSheet);
router.get('/report-cards/marks/sample', getMarksSampleSheet);
router.post('/report-cards/marks/import', upload.single('file'), importMarksSheet);
router.get('/report-cards/attendance-monthly', getMonthlyAttendance);
router.get('/report-cards/attendance-monthly/export', exportMonthlyAttendanceExcel);
router.get('/report-cards/attendance-monthly/student-slips.xlsx', exportStudentAttendanceSlipsExcel);
router.get('/report-cards/generate', generateReportCard);
router.get('/report-cards/generate.xlsx', generateReportCardExcel);

module.exports = router;

