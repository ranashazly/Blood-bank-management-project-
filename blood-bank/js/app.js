if (!sessionStorage.admin) location = 'login.html';
const $ = s => document.querySelector(s), S = {}; let route = 'dashboard', chart;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const badge = s => `<span class="b ${String(s).split(' (')[0].replace(/\s/g, '')}">${esc(s)}</span>`;
const F = (p, k) => (S[p] || {})[k] || '', on = v => v && !v.startsWith('All');
function toast(m, bad) { const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = m; $('#toasts').append(t); setTimeout(() => t.remove(), 3000) }
function modal(t, b) { $('#modal').innerHTML = `<div class="box"><button class="x" onclick="closeModal()">×</button><h3>${t}</h3>${b}</div>`; $('#modal').classList.add('on') }
const closeModal = () => $('#modal').classList.remove('on');
function ask(msg, fn) { modal('Please confirm', `<p>${msg}</p><div class="row"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" id="yes">Confirm</button></div>`); $('#yes').onclick = () => { closeModal(); fn() } }
function form(title, fields, fn) {
    modal(title, `<form>${fields.map(f => `<label>${f.l}${f.o ? `<select name="${f.n}">${f.o.map(o => `<option ${o == f.v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input name="${f.n}" type="${f.t || 'text'}" value="${esc(f.v ?? '')}">`}</label>`).join('')}<p class="err"></p><div class="row"><button type="button" class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn">Save</button></div></form>`);
    $('#modal form').onsubmit = e => { e.preventDefault(); const err = fn(Object.fromEntries(new FormData(e.target))); if (err) $('#modal .err').textContent = err; else closeModal() }
}
function table(id, cols, rows) {
    const s = S['sort_' + id] || {}, txt = (c, r) => String(c.v(r)).replace(/<[^>]+>/g, '');
    if (s.k) { const c = cols.find(c => c.h == s.k); rows = [...rows].sort((a, b) => txt(c, a).localeCompare(txt(c, b), undefined, { numeric: true }) * s.d) }
    return `<div class="tw"><table><tr>${cols.map(c => `<th onclick="sortBy('${id}','${c.h}')">${c.h}${s.k == c.h ? (s.d > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr>${rows.map(r => `<tr>${cols.map(c => `<td>${c.v(r)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}" class="empty">No records match. Adjust the filters or add a new one.</td></tr>`}</table></div>`
}
function sortBy(id, h) { const s = S['sort_' + id] = S['sort_' + id] || {}; s.d = s.k == h ? -s.d : 1; s.k = h; $('#tb') ? $('#tb').innerHTML = tbl[route]() : render() }
function bar(p, fs, btn) { return `<div class="bar">${fs.map(f => f.o ? `<select onchange="flt('${p}','${f.k}',this.value)">${f.o.map(o => `<option ${F(p, f.k) == o ? 'selected' : ''}>${o}</option>`).join('')}</select>` : `<input type="${f.t || 'search'}" placeholder="${f.p}" title="${f.p}" value="${esc(F(p, f.k))}" oninput="flt('${p}','${f.k}',this.value)">`).join('')}${btn || ''}</div>` }
function flt(p, k, v) { (S[p] = S[p] || {})[k] = v; $('#tb').innerHTML = tbl[route]() }
const q = (p, r) => (r.id + ' ' + (r.name || r.patient || r.donor || '')).toLowerCase().includes(F(p, 'q').toLowerCase());
const act = (l, fn, c = '') => `<button class="btn sm ${c}" onclick="${fn}">${l}</button>`;
const ST = ['All status'], ty = ['All types', ...TYPES];
const tbl = {}, pages = {};

/* ---------- Donors ---------- */
tbl.donors = () => table('donors', [{ h: 'ID', v: d => d.id }, { h: 'Name', v: d => esc(d.name) }, { h: 'Age', v: d => d.age }, { h: 'Gender', v: d => d.gender }, { h: 'Phone', v: d => esc(d.phone) }, { h: 'Blood', v: d => btp(d.bt) }, { h: 'Weight', v: d => d.weight + ' kg' }, { h: 'Last donation', v: d => d.last || '-' }, { h: 'Eligibility', v: d => badge(elig(d)) },
{ h: 'Actions', v: d => act(ic('eye', 15), `viewDonor('${d.id}')`, 'ghost') + act('Edit', `donorForm('${d.id}')`, 'ghost') + act(d.active ? 'Deactivate' : 'Activate', `toggleDonor('${d.id}')`, d.active ? 'red' : '') }],
    DB.donors.filter(d => q('donors', d) && (!on(F('donors', 't')) || d.bt == F('donors', 't')) && (!on(F('donors', 'e')) || elig(d).startsWith(F('donors', 'e')))));
pages.donors = () => `<h2>Donor Management</h2>` + bar('donors', [{ k: 'q', p: 'Search donor name or ID' }, { k: 't', o: ty }, { k: 'e', o: ['All eligibility', 'Eligible', 'Ineligible', 'Deferred', 'Inactive'] }], act('+ Add donor', `donorForm()`)) + `<div id="tb">${tbl.donors()}</div>`;
function donorForm(id) {
    const d = DB.donors.find(x => x.id == id) || {};
    form(id ? 'Edit donor' : 'Add donor', [{ n: 'name', l: 'Full name', v: d.name }, { n: 'age', l: 'Age', t: 'number', v: d.age }, { n: 'gender', l: 'Gender', o: ['Male', 'Female'], v: d.gender }, { n: 'phone', l: 'Phone', v: d.phone }, { n: 'email', l: 'Email', v: d.email }, { n: 'address', l: 'Address', v: d.address }, { n: 'bt', l: 'Blood type', o: TYPES, v: d.bt }, { n: 'weight', l: 'Weight (kg)', t: 'number', v: d.weight }, { n: 'last', l: 'Last donation date (optional)', t: 'date', v: d.last }], v => {
        if (v.name.trim().length < 3) return 'Name must be at least 3 characters.';
        if (!(v.age >= 16 && v.age <= 100)) return 'Age must be between 16 and 100.';
        if (!/^\+?\d{8,15}$/.test(v.phone)) return 'Phone must be 8-15 digits.';
        if (!/^\S+@\S+\.\S+$/.test(v.email)) return 'Enter a valid email address.';
        if (!(v.weight >= 30 && v.weight <= 250)) return 'Enter a valid weight in kg.';
        if (!v.address.trim()) return 'Address is required.';
        Object.assign(d, v, { age: +v.age, weight: +v.weight, last: v.last || null });
        if (!id) DB.donors.push({ ...d, id: nid('D', DB.donors), reg: today(), active: true });
        save(); render(); toast(id ? 'Donor updated' : 'Donor added')
    })
}
function toggleDonor(id) { const d = DB.donors.find(x => x.id == id); ask(`${d.active ? 'Deactivate' : 'Activate'} ${esc(d.name)}? Donation history is kept.`, () => { d.active = !d.active; save(); render(); toast('Donor ' + (d.active ? 'activated' : 'deactivated')) }) }
function viewDonor(id) {
    const d = DB.donors.find(x => x.id == id), h = DB.donations.filter(x => x.donorId == id);
    modal(esc(d.name), `<p>${d.id} | ${d.bt} | ${d.gender}, ${d.age} | ${esc(d.phone)}<br>${esc(d.email)} | ${esc(d.address)}<br>Registered ${d.reg} | ${badge(elig(d))}</p><b>Donation history</b>${h.map(x => `<p>${x.id}: ${x.date}, ${x.qty} ml, ${badge(x.status)}</p>`).join('') || '<p class="muted">No donations yet.</p>'}<div class="row"><button class="btn" onclick="closeModal()">Close</button></div>`)
}

/* ---------- Donations ---------- */
tbl.donations = () => table('donations', [{ h: 'ID', v: d => d.id }, { h: 'Donor ID', v: d => d.donorId }, { h: 'Donor', v: d => esc(d.donor) }, { h: 'Date', v: d => d.date }, { h: 'Qty', v: d => d.qty + ' ml' }, { h: 'Screening', v: d => badge(d.screening) }, { h: 'Status', v: d => badge(d.status) },
{ h: 'Actions', v: d => d.status == 'Pending' ? act('Accept', `acceptDon('${d.id}')`) + act('Reject', `rejectDon('${d.id}')`, 'red') : '-' }],
    DB.donations.filter(d => q('donations', d) && (!on(F('donations', 's')) || d.status == F('donations', 's')) && (!F('donations', 'd') || d.date == F('donations', 'd'))));
pages.donations = () => `<h2>Donation Management</h2>` + bar('donations', [{ k: 'q', p: 'Search donation ID or donor' }, { k: 's', o: [...ST, 'Pending', 'Accepted', 'Rejected'] }, { k: 'd', t: 'date', p: 'Filter by date' }], act('+ Register donation', `donationForm()`)) + `<div id="tb">${tbl.donations()}</div>`;
function donationForm() {
    const ok = DB.donors.filter(d => elig(d) == 'Eligible');
    if (!ok.length) return toast('No eligible donors available.', 1);
    form('Register donation (450 ml)', [{ n: 'donor', l: 'Donor (eligible only)', o: ok.map(d => d.id + ' ' + d.name) }, { n: 'date', l: 'Donation date', t: 'date', v: today() }, { n: 'screening', l: 'Medical screening result', o: ['Passed', 'Failed'] }], v => {
        if (!v.date || v.date > today()) return 'Date cannot be empty or in the future.';
        const d = DB.donors.find(x => x.id == v.donor.split(' ')[0]);
        DB.donations.push({ id: nid('DN', DB.donations), donorId: d.id, donor: d.name, date: v.date, qty: 450, screening: v.screening, status: 'Pending' }); notify(`Donation registered for ${d.name} (screening ${v.screening})`); save(); render(); toast('Donation registered')
    })
}
// Only a Pending donation with passed screening can create a unit; status change blocks double processing.
function acceptDon(id) {
    const d = DB.donations.find(x => x.id == id);
    if (d.status != 'Pending') return toast('Already processed', 1);
    if (d.screening != 'Passed') return toast('Screening failed: reject this donation instead', 1);
    ask(`Accept ${d.id} and add one ${DB.donors.find(x => x.id == d.donorId).bt} unit to inventory?`, () => {
        const dn = DB.donors.find(x => x.id == d.donorId);
        d.status = 'Accepted'; dn.last = d.date; DB.units.push({ id: nid('U', DB.units), type: dn.bt, collected: d.date, expires: addDays(d.date, 42), status: 'Available' }); notify(`Donation ${d.id} accepted: 1 x ${dn.bt} unit added to inventory`); save(); render(); toast('Accepted: inventory updated')
    })
}
function rejectDon(id) { const d = DB.donations.find(x => x.id == id); ask(`Reject ${d.id}? Inventory will not change.`, () => { d.status = 'Rejected'; notify(`Donation ${d.id} rejected (inventory unchanged)`); save(); render(); toast('Donation rejected') }) }

/* ---------- Inventory ---------- */
tbl.inventory = () => table('inventory', [{ h: 'Unit ID', v: u => u.id }, { h: 'Blood', v: u => btp(u.type) }, { h: 'Quantity', v: u => '450 ml' }, { h: 'Collected', v: u => u.collected }, { h: 'Expires', v: u => u.expires }, { h: 'Status', v: u => badge(u.status) },
{ h: 'Actions', v: u => ['Available', 'Expired'].includes(u.status) ? act('Discard', `discardUnit('${u.id}')`, 'red') : '-' }],
    DB.units.filter(u => u.id.toLowerCase().includes(F('inventory', 'q').toLowerCase()) && (!on(F('inventory', 't')) || u.type == F('inventory', 't')) && (!on(F('inventory', 's')) || u.status == F('inventory', 's'))));
pages.inventory = () => `<h2>Blood Inventory</h2>` + invCards() + bar('inventory', [{ k: 'q', p: 'Search unit ID' }, { k: 't', o: ty }, { k: 's', o: [...ST, 'Available', 'Reserved', 'Used', 'Expired', 'Discarded'] }], act('+ Add unit', `unitForm()`)) + `<div id="tb">${tbl.inventory()}</div>`;
function unitForm() {
    form('Add blood unit', [{ n: 'bt', l: 'Blood type', o: TYPES }, { n: 'c', l: 'Collection date', t: 'date', v: today() }], v => {
        if (!v.c || v.c > today()) return 'Collection date cannot be empty or in the future.';
        DB.units.push({ id: nid('U', DB.units), type: v.bt, collected: v.c, expires: addDays(v.c, 42), status: 'Available' }); notify(`Unit ${DB.units[DB.units.length - 1].id} (${v.bt}) added to inventory`); save(); render(); toast('Unit added (expires in 42 days)')
    })
}
function discardUnit(id) { ask('Discard ' + id + '? It can no longer be used.', () => { DB.units.find(u => u.id == id).status = 'Discarded'; notify(`Unit ${id} discarded`); save(); render(); toast('Unit discarded') }) }

/* ---------- Requests ---------- */
const rank = { Emergency: 0, Urgent: 1, Normal: 2 }, log = (r, s) => { r.status = s; r.history.push(today() + ': ' + s) };
tbl.requests = () => table('requests', [{ h: 'ID', v: r => r.id }, { h: 'Requester', v: r => r.type }, { h: 'Patient', v: r => esc(r.patient) }, { h: 'Hospital', v: r => esc(r.hospital || '-') }, { h: 'Blood', v: r => btp(r.bt) }, { h: 'Qty', v: r => r.qty }, { h: 'Date', v: r => r.date }, { h: 'Priority', v: r => badge(r.priority) }, { h: 'Status', v: r => badge(r.status) },
{ h: 'Actions', v: r => act('View', `viewReq('${r.id}')`, 'ghost') + (r.status == 'Pending' ? act('Approve', `approve('${r.id}')`) + act('Reject', `reject('${r.id}')`, 'red') : '') + (r.status == 'Approved' ? act('Issue', `issue('${r.id}')`) + act('Cancel', `reject('${r.id}')`, 'red') : '') }],
    DB.requests.filter(r => q('requests', r) && (!on(F('requests', 's')) || r.status == F('requests', 's')) && (!on(F('requests', 'p')) || r.priority == F('requests', 'p')) && (!on(F('requests', 't')) || r.bt == F('requests', 't')) && (!F('requests', 'd') || r.date == F('requests', 'd'))).sort((a, b) => S.sort_requests ? 0 : rank[a.priority] - rank[b.priority]));
pages.requests = () => `<h2>Blood Requests</h2>` + reqCards() + bar('requests', [{ k: 'q', p: 'Search request ID or patient' }, { k: 's', o: [...ST, 'Pending', 'Approved', 'Rejected', 'Partially Fulfilled', 'Fulfilled'] }, { k: 'p', o: ['All priorities', 'Emergency', 'Urgent', 'Normal'] }, { k: 't', o: ty }, { k: 'd', t: 'date', p: 'Filter by date' }], act('+ New request', `reqForm()`)) + `<div id="tb">${tbl.requests()}</div>`;
function reqForm(id) {
    const r = DB.requests.find(x => x.id == id) || {};
    form(id ? 'Edit request' : 'New blood request', [{ n: 'type', l: 'Requester type', o: ['Patient', 'Hospital'], v: r.type }, { n: 'patient', l: 'Patient name', v: r.patient }, { n: 'hospital', l: 'Hospital name (if Hospital)', v: r.hospital }, { n: 'contact', l: 'Contact', v: r.contact }, { n: 'bt', l: 'Blood type', o: TYPES, v: r.bt }, { n: 'qty', l: 'Units required', t: 'number', v: r.qty }, { n: 'priority', l: 'Priority', o: ['Normal', 'Urgent', 'Emergency'], v: r.priority }], v => {
        if (v.patient.trim().length < 3) return 'Patient name is required.';
        if (v.type == 'Hospital' && !v.hospital.trim()) return 'Hospital name is required for hospital requests.';
        if (!/^\+?\d{6,15}$/.test(v.contact)) return 'Contact must be 6-15 digits.';
        if (!(Number.isInteger(+v.qty) && v.qty >= 1 && v.qty <= 20)) return 'Units must be a whole number from 1 to 20.';
        Object.assign(r, v, { qty: +v.qty, hospital: v.type == 'Hospital' ? v.hospital : '' });
        if (!id) DB.requests.push({ ...r, id: nid('R', DB.requests), date: today(), status: 'Pending', units: [], history: [today() + ': Pending'] });
        notify(id ? `Request ${id} updated` : `New ${v.priority} request ${DB.requests[DB.requests.length - 1].id}: ${v.qty} x ${v.bt}`); save(); render(); toast(id ? 'Request updated' : 'Request created')
    })
}
// Allocation: unexpired Available units of a compatible type; exact match first, then earliest expiry. Partial allowed.
function approve(id) {
    const r = DB.requests.find(x => x.id == id);
    const pool = DB.units.filter(u => u.status == 'Available' && u.expires >= today() && COMPAT[r.bt].includes(u.type)).sort((a, b) => (b.type == r.bt) - (a.type == r.bt) || a.expires.localeCompare(b.expires)).slice(0, r.qty);
    if (!pool.length) return toast('No compatible, unexpired units in stock', 1);
    ask(`Reserve ${pool.length} of ${r.qty} unit(s): ${pool.map(u => u.id + ' (' + u.type + ')').join(', ')}?${pool.length < r.qty ? ' <b>Partial: stock is short.</b>' : ''}`, () => { pool.forEach(u => u.status = 'Reserved'); r.units = pool.map(u => u.id); log(r, 'Approved'); notify(`Request ${r.id} approved: ${pool.length} unit(s) reserved`); save(); render(); toast('Request approved, units reserved') })
}
function issue(id) {
    const r = DB.requests.find(x => x.id == id), us = DB.units.filter(u => r.units.includes(u.id) && u.status == 'Reserved');
    if (us.some(u => u.expires < today())) return toast('A reserved unit has expired. Cancel and re-approve.', 1);
    ask(`Issue ${us.length} unit(s) for ${r.id}?`, () => { us.forEach(u => u.status = 'Used'); log(r, us.length >= r.qty ? 'Fulfilled' : 'Partially Fulfilled'); notify(`Request ${r.id} ${r.status.toLowerCase()}: ${us.length} unit(s) issued`); save(); render(); toast('Units issued') })
}
function reject(id) { const r = DB.requests.find(x => x.id == id); ask(`Reject/cancel ${r.id}? Reserved units return to stock.`, () => { DB.units.forEach(u => { if (r.units.includes(u.id) && u.status == 'Reserved') u.status = 'Available' }); r.units = []; log(r, 'Rejected'); notify(`Request ${r.id} rejected or cancelled; reserved units returned to stock`); save(); render(); toast('Request rejected') }) }
function viewReq(id) { const r = DB.requests.find(x => x.id == id); modal(r.id, `<p>${r.type}: ${esc(r.patient)} ${r.hospital ? '(' + esc(r.hospital) + ')' : ''}<br>Contact ${esc(r.contact)} | ${r.qty} x ${r.bt} | ${badge(r.priority)} ${badge(r.status)}<br>Units: ${r.units.join(', ') || 'none'}</p><b>History</b>${r.history.map(h => `<p>${h}</p>`).join('')}<div class="row">${['Pending'].includes(r.status) ? act('Edit', `closeModal();reqForm('${r.id}')`, 'ghost') : ''}<button class="btn" onclick="closeModal()">Close</button></div>`) }

/* ---------- Compatibility ---------- */
tbl.compat = () => {
    const t = F('compat', 't') || 'A+'; return table('compat', [{ h: 'Donor type', v: x => x.t }, { h: 'Available units', v: x => x.n }, { h: 'Earliest expiry', v: x => x.e || '-' }, { h: 'Note', v: x => x.soon ? badge('Expiring soon') : '' }],
        COMPAT[t].map(d => { const us = DB.units.filter(u => u.type == d && u.status == 'Available').sort((a, b) => a.expires.localeCompare(b.expires)); return { t: d, n: us.length, e: us[0]?.expires, soon: us.some(u => u.expires <= day(DB.warn)) } }))
};
pages.compat = () => `<h2>Compatibility Checker</h2><div class="bar"><select onchange="flt('compat','t',this.value)">${TYPES.map(t => `<option ${F('compat', 't') == t ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div id="tb">${tbl.compat()}</div><p class="note">Preliminary guidance only (standard ABO/Rh rules). It does not replace laboratory crossmatching or medical approval.</p>`;

/* ---------- Alerts ---------- */
tbl.alerts = () => table('alerts', [{ h: 'Type', v: a => badge(a.type) }, { h: 'Message', v: a => esc(a.msg) }, { h: 'Date', v: a => a.date }, { h: 'Status', v: a => badge(a.status) }, { h: 'Actions', v: a => (a.status == 'Unread' ? act('Mark read', `setAlert('${a.key}','Read')`, 'ghost') : '') + (a.status != 'Resolved' ? act('Resolve', `setAlert('${a.key}','Resolved')`) : '') }],
    DB.alerts.filter(a => !a.gone || a.status == 'Resolved').filter(a => (!on(F('alerts', 't')) || a.type == F('alerts', 't')) && (!on(F('alerts', 's')) || a.status == F('alerts', 's'))).reverse());
pages.alerts = () => `<h2>Alerts & Notifications</h2>` + bar('alerts', [{ k: 't', o: ['All types', 'Low Stock', 'Expiring', 'Expired', 'Urgent Request', 'Pending Request', 'Activity'] }, { k: 's', o: [...ST, 'Unread', 'Read', 'Resolved'] }], act('Mark all read', `readAll()`, 'ghost')) + `<div id="tb">${tbl.alerts()}</div>`;
function setAlert(k, s) { DB.alerts.filter(a => a.key == k && !a.gone).forEach(a => a.status = s); save(); render() }
function readAll() { DB.alerts.forEach(a => { if (a.status == 'Unread') a.status = 'Read' }); save(); render() }

/* ---------- Settings ---------- */
pages.settings = () => `<h2>Settings</h2><div class="grid2"><form class="card" onsubmit="saveProfile(event)"><h3>Admin profile</h3><label>Display name<input name="n" value="${esc(DB.admin.name)}"></label><label>Username<input name="u" value="${esc(DB.admin.user)}"></label><p class="err"></p><button class="btn">Save profile</button></form>
<form class="card" onsubmit="savePass(event)"><h3>Change password</h3><label>Current password<input name="c" type="password"></label><label>New password (6+ characters)<input name="n" type="password"></label><label>Confirm new password<input name="m" type="password"></label><p class="err"></p><button class="btn">Change password</button></form>
<form class="card" onsubmit="saveStock(event)"><h3>Stock rules</h3><label>Expiration warning (days)<input name="warn" type="number" value="${DB.warn}"></label>${TYPES.map(t => `<label>Minimum units for ${t}<input name="${t}" type="number" value="${DB.min[t]}"></label>`).join('')}<p class="err"></p><button class="btn">Save rules</button></form></div>`;
function fe(e, m) { e.preventDefault(); e.target.querySelector('.err').textContent = m || ''; return !m }
function saveProfile(e) { const f = e.target; if (fe(e, (!f.n.value.trim() || f.u.value.trim().length < 3) && 'Enter a name and a username of 3+ characters.')) { DB.admin.name = f.n.value.trim(); DB.admin.user = f.u.value.trim(); save(); render(); toast('Profile saved') } }
function savePass(e) {
    const f = e.target; if (fe(e, f.c.value != DB.admin.pass ? 'Current password is wrong.' : f.n.value.length < 6 ? 'New password needs 6+ characters.' : f.n.value != f.m.value ? 'Passwords do not match.' : '')) { DB.admin.pass = f.n.value; save(); f.reset(); toast('Password changed') }
}
function saveStock(e) { const f = e.target; if (fe(e, TYPES.concat('warn').some(k => !(+f[k].value >= 0 && f[k].value !== '')) && 'All values must be zero or more.')) { DB.warn = +f.warn.value; TYPES.forEach(t => DB.min[t] = +f[t].value); save(); render(); toast('Rules saved, alerts refreshed') } }

/* ---------- Search & Dashboard ---------- */
pages.search = () => {
    const k = (S.gq || '').toLowerCase(), m = (a, f) => a.filter(x => f(x).toLowerCase().includes(k));
    const g = [['Donors', m(DB.donors, d => d.id + d.name), 'donors'], ['Donations', m(DB.donations, d => d.id + d.donorId + d.donor), 'donations'], ['Units', m(DB.units, u => u.id), 'inventory'], ['Requests', m(DB.requests, r => r.id + r.patient + r.hospital), 'requests']];
    return `<h2>Search results for "${esc(S.gq)}"</h2>` + g.map(([n, l, p]) => `<div class="card" style="margin-bottom:12px"><b>${n} (${l.length})</b>${l.map(x => `<p><a href="#${p}" onclick="S['${p}']={q:'${x.id}'}">${x.id}</a> ${esc(x.name || x.donor || x.patient || x.type || '')}</p>`).join('')}</div>`).join('')
};
pages.dashboard = () => {
    const A = DB.units.filter(u => u.status == 'Available'), low = TYPES.filter(t => A.filter(u => u.type == t).length < DB.min[t]), exp = A.filter(u => u.expires <= day(DB.warn)), al = DB.alerts.filter(a => !a.gone && a.status != 'Resolved');
    const c = [['Total donors', DB.donors.length, 'users', 'p'], ['Blood units available', A.length, 'box', 'b'], ['Total donations', DB.donations.length, 'heart', 'g'], ['Pending requests', DB.requests.filter(r => r.status == 'Pending').length, 'file', 'o'], ['Low stock types', low.length, 'down', 'r'], ['Expiring units', exp.length, 'warn', 'r']];
    return `<h2>Dashboard</h2><div class="cards">${c.map(x => stat(x[0], x[1], x[2], x[3])).join('')}</div><div class="grid2"><div class="card"><b>Inventory by blood type</b><canvas id="ch" height="180"></canvas></div><div class="card"><b>Open alerts</b>${al.slice(-6).reverse().map(a => `<p>${badge(a.type)} ${esc(a.msg)}</p>`).join('') || '<p class="muted">No open alerts.</p>'}</div></div>
 <div class="grid2"><div><b>Recent donations</b>${table('rd', [{ h: 'ID', v: d => d.id }, { h: 'Donor', v: d => esc(d.donor) }, { h: 'Date', v: d => d.date }, { h: 'Status', v: d => badge(d.status) }], DB.donations.slice(-5).reverse())}</div><div><b>Recent requests</b>${table('rr', [{ h: 'ID', v: r => r.id }, { h: 'Blood', v: r => r.bt + ' x' + r.qty }, { h: 'Priority', v: r => badge(r.priority) }, { h: 'Status', v: r => badge(r.status) }], DB.requests.slice(-5).reverse())}</div></div>`
};

/* ---------- Icons & stat cards ---------- */
const IC = { grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>', users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>', heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>', box: '<path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>', file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>', repeat: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>', bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>', sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>', eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', down: '<path d="M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6"/>', warn: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>' };
const ic = (n, z = 18) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const btp = t => `<span class="bt">${t}</span>`;
const stat = (l, n, i, c) => `<div class="card stat"><div><span>${l}</span><b>${n}</b></div>${i ? `<i class="ico ${c}">${ic(i, 22)}</i>` : ''}</div>`;
function invCards() { const A = DB.units.filter(u => u.status == 'Available'); return `<div class="cards">${stat('Total units', A.length, 'box', 'b')}${stat('Low stock types', TYPES.filter(t => A.filter(u => u.type == t).length < DB.min[t]).length, 'down', 'o')}${stat('Expiring soon', A.filter(u => u.expires <= day(DB.warn)).length, 'warn', 'r')}</div>` }
const reqCards = () => `<div class="cards">${['Pending', 'Approved', 'Partially Fulfilled', 'Fulfilled'].map(s => stat(s, DB.requests.filter(r => r.status == s).length)).join('')}</div>`;
/* ---------- Shell ---------- */
const NAV = [['dashboard', 'Dashboard', 'grid'], ['donors', 'Donor Management', 'users'], ['donations', 'Donation Management', 'heart'], ['inventory', 'Blood Inventory', 'box'], ['requests', 'Blood Requests', 'file'], ['compat', 'Compatibility Checker', 'repeat'], ['alerts', 'Alerts & Notifications', 'bell'], ['settings', 'Settings', 'sliders']];
function render() {
    route = pages[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
    $('#nav').innerHTML = NAV.map(n => `<a href="#${n[0]}" class="${n[0] == route ? 'on' : ''}">${ic(n[2])}${n[1]}</a>`).join('');
    $('#main').innerHTML = pages[route](); $('#side').classList.remove('open');
    $('#bc').textContent = DB.alerts.filter(a => a.status == 'Unread').length || ''; $('#bc').style.display = $('#bc').textContent ? '' : 'none';
    $('#adm').innerHTML = `<b>${esc(DB.admin.name)}</b><small>Active user</small>`; $('#date').textContent = new Date().toDateString();
    if (route == 'dashboard' && window.Chart) { chart?.destroy(); chart = new Chart($('#ch'), { type: 'bar', data: { labels: TYPES, datasets: [{ label: 'Available units', data: TYPES.map(t => DB.units.filter(u => u.type == t && u.status == 'Available').length), backgroundColor: '#8B1E35', borderRadius: 6 }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } } }) }
}
function logout() { sessionStorage.clear(); location = 'login.html' }
$('#gs').onkeydown = e => { if (e.key == 'Enter' && e.target.value.trim()) { S.gq = e.target.value.trim(); location.hash = '#search'; render() } };
addEventListener('hashchange', render); render();
