const DA_COMPONENTS = ['DA-1', 'DA-2', 'DA-3', 'DA-4', 'DA-5', 'DA-6', 'DA-7'];
const CIE_COMPONENTS = ['CIE-1', 'CIE-2', 'CIE-3', 'CIE-4', 'CIE-5'];
const ALL_COMPONENTS = [...DA_COMPONENTS, ...CIE_COMPONENTS];

const SCHEME = {
  DA: { total: 10, passing: 4 },
  CIE: { total: 30, passing: 18 }
};

function getSchemeForComponent(component) {
  if (component.startsWith('DA')) return SCHEME.DA;
  if (component.startsWith('CIE')) return SCHEME.CIE;
  return { total: 0, passing: 0 };
}

function evaluatePassFail(component, value) {
  if (value === null || value === undefined || value === '') {
    return { display: '', result: '' };
  }
  const raw = String(value).trim().toUpperCase();
  if (raw === 'AB') {
    return { display: 'AB', result: 'Absent' };
  }
  const num = Number(raw);
  if (Number.isNaN(num)) {
    return { display: String(value), result: '' };
  }
  const { passing } = getSchemeForComponent(component);
  return {
    display: String(num),
    result: num < passing ? 'FAIL' : 'PASS'
  };
}

function monthDateRange(month) {
  // month: YYYY-MM
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return null;
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

function formatMonthLabel(month) {
  const [y, m] = (month || '').split('-').map(Number);
  if (!y || !m) return month || '';
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

module.exports = {
  DA_COMPONENTS,
  CIE_COMPONENTS,
  ALL_COMPONENTS,
  SCHEME,
  getSchemeForComponent,
  evaluatePassFail,
  monthDateRange,
  formatMonthLabel
};
