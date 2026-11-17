// Shared data layer: every module reads/writes this one DB (LocalStorage), so all pages stay in sync.
const TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
// Standard ABO/Rh red-cell rules: recipient type -> donor types it can receive.
const COMPAT = { 'A+': ['A+', 'A-', 'O+', 'O-'], 'A-': ['A-', 'O-'], 'B+': ['B+', 'B-', 'O+', 'O-'], 'B-': ['B-', 'O-'], 'AB+': TYPES, 'AB-': ['A-', 'B-', 'AB-', 'O-'], 'O+': ['O+', 'O-'], 'O-': ['O-'] };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) };
const today = () => day(0);
const addDays = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) };
const pad = n => String(n).padStart(4, '0');
const nid = (p, l) => p + '-' + pad(l.reduce((m, x) => Math.max(m, +x.id.split('-')[1]), 0) + 1);
function seed() {
    const dn = ['Ahmed Hassan', 'Sara Ali', 'Omar Khaled', 'Mona Samir', 'Youssef Adel', 'Nour Ibrahim'], bt = ['O+', 'A+', 'B+', 'O-', 'AB+', 'A-'];
    const ut = ['O+', 'O+', 'O+', 'O+', 'A+', 'A+', 'A+', 'B+', 'B+', 'B+', 'AB+', 'AB+', 'AB+', 'A-', 'O-', 'B-'];
    return {
        admin: { user: 'admin', pass: 'admin123', name: 'Admin' }, warn: 7, min: Object.fromEntries(TYPES.map(t => [t, 3])), alerts: [],
        donors: dn.map((n, i) => ({ id: 'D-' + pad(i + 1), name: n, age: 22 + i * 4, gender: i % 2 ? 'Female' : 'Male', phone: '+2010000000' + i + '1', email: n.split(' ')[0].toLowerCase() + '@mail.com', address: 'Cairo', bt: bt[i], weight: 60 + i * 5, last: i < 3 ? day(-90) : null, reg: day(-200), active: true })),
        units: ut.map((t, i) => ({ id: 'U-' + pad(i + 1), type: t, collected: day(-2 - i * 3), expires: day(40 - i * 3), status: 'Available' })),
        donations: [{ id: 'DN-0001', donorId: 'D-0001', donor: 'Ahmed Hassan', date: day(-90), qty: 450, screening: 'Passed', status: 'Accepted' }, { id: 'DN-0002', donorId: 'D-0005', donor: 'Youssef Adel', date: today(), qty: 450, screening: 'Passed', status: 'Pending' }, { id: 'DN-0003', donorId: 'D-0006', donor: 'Nour Ibrahim', date: today(), qty: 450, screening: 'Failed', status: 'Pending' }],
        requests: [{ id: 'R-0001', type: 'Patient', patient: 'Mariam Fathy', hospital: '', contact: '01011112222', bt: 'A+', qty: 2, date: day(-3), priority: 'Normal', status: 'Pending', units: [], history: [day(-3) + ': Pending'] },
        { id: 'R-0002', type: 'Hospital', patient: 'Ali Mostafa', hospital: 'Kasr Al Ainy', contact: '0225551234', bt: 'B+', qty: 3, date: today(), priority: 'Emergency', status: 'Pending', units: [], history: [today() + ': Pending'] },
        { id: 'R-0003', type: 'Patient', patient: 'Hoda Said', hospital: '', contact: '01099998888', bt: 'O+', qty: 1, date: day(-10), priority: 'Urgent', status: 'Fulfilled', units: ['U-0099'], history: [day(-10) + ': Pending', day(-9) + ': Approved', day(-9) + ': Fulfilled'] }]
    };
}
let DB = JSON.parse(localStorage.getItem('bbms') || 'null') || seed();
// Donor eligibility rules: age 18-65, weight >= 50 kg, 56 days since last donation.
function elig(d) {
    if (!d.active) return 'Inactive';
    if (d.age < 18 || d.age > 65) return 'Ineligible (age)';
    if (d.weight < 50) return 'Ineligible (weight)';
    if (d.last && (new Date() - new Date(d.last)) / 864e5 < 56) return 'Deferred (56-day rule)';
    return 'Eligible';
}
// Regenerates alerts from current data. One alert per condition key; auto-resolves when the condition clears.
function refreshAlerts() {
    DB.units.forEach(u => { if (u.status == 'Available' && u.expires < today()) u.status = 'Expired' });
    const c = {}, w = day(DB.warn), A = DB.units.filter(u => u.status == 'Available');
    TYPES.forEach(t => { if (A.filter(u => u.type == t).length < DB.min[t]) c['low:' + t] = ['Low Stock', `${t} stock is below the minimum of ${DB.min[t]} units`] });
    DB.units.forEach(u => { if (u.status == 'Expired') c['expd:' + u.id] = ['Expired', `${u.id} (${u.type}) expired on ${u.expires}`]; else if (u.status == 'Available' && u.expires <= w) c['exp:' + u.id] = ['Expiring', `${u.id} (${u.type}) expires on ${u.expires}`] });
    DB.requests.filter(r => r.status == 'Pending').forEach(r => { if (r.priority != 'Normal') c['urg:' + r.id] = ['Urgent Request', `${r.priority} request ${r.id}: ${r.qty} x ${r.bt}`]; if (r.date <= day(-2)) c['pend:' + r.id] = ['Pending Request', `${r.id} has been pending since ${r.date}`] });
    DB.alerts.forEach(a => { if (!c[a.key] && !a.gone && !a.ev) { a.gone = 1; a.status = 'Resolved' } });
    for (const k in c) if (!DB.alerts.some(a => a.key == k && !a.gone)) DB.alerts.push({ key: k, type: c[k][0], msg: c[k][1], date: today(), status: 'Unread' });
}
// Event notification (activity log entry shown in the bell). Not tied to a condition, so it never auto-resolves.
function notify(m) { DB.alerts.push({ key: 'ev:' + Date.now() + Math.random().toString(36).slice(2, 6), type: 'Activity', msg: m, date: today(), status: 'Unread', ev: 1 }) }
function save() { refreshAlerts(); localStorage.setItem('bbms', JSON.stringify(DB)) }
save();
