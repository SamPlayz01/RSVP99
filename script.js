/* RSVP99 — vanilla JS. Sections: 1 data, 2 helpers, 3 views, 4 forms, 5 actions, 6 router. */
(() => {
/* ---------- 1. DATA (saved in localStorage) ---------- */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const plus = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
let events = load('rsvp99.events', null), guests = load('rsvp99.guests', []);
let theme = load('rsvp99.theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
if (!events) { // demo data on first visit
  events = [
    { id: 'e1', name: 'Fern & Co. Launch Party', desc: 'An evening of small plates, good music and first looks at the spring collection.', date: plus(6), time: '19:00', location: 'The Glasshouse, Dubai' },
    { id: 'e2', name: 'Team Offsite Breakfast', desc: 'Casual breakfast before the quarterly planning day.', date: plus(14), time: '09:00', location: 'Sharjah Art Cafe' },
    { id: 'e3', name: 'Garden Birthday Brunch', desc: 'Bring a friend, bring an appetite.', date: plus(25), time: '11:30', location: 'Al Noor Island' }];
  const n = [['Maya Haddad', 'yes'], ['Omar Saleh', 'yes'], ['Lina Farouk', 'no'], ['Zain Ali', 'pending'], ['Sara Khan', 'yes'], ['Yusuf Amin', 'pending']];
  guests = n.map((g, i) => ({ id: 'g' + i, eventId: i < 4 ? 'e1' : 'e2', name: g[0], email: g[0].split(' ')[0].toLowerCase() + '@example.com', status: g[1], checkedIn: false, code: 'DEMO' + (10 + i), at: Date.now() - i * 3600e3 }));
}
const save = () => { try { localStorage.setItem('rsvp99.events', JSON.stringify(events)); localStorage.setItem('rsvp99.guests', JSON.stringify(guests)); localStorage.setItem('rsvp99.theme', JSON.stringify(theme)); } catch { toast('Storage is full. Try a smaller cover image.'); } };

/* ---------- 2. HELPERS ---------- */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const fmt = (d, t) => new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + (t ? ' at ' + t : '');
const evOf = id => events.find(e => e.id === id);
const gOf = id => guests.filter(g => g.eventId === id);
const upcoming = () => events.filter(e => e.date >= iso(new Date())).sort((a, b) => a.date.localeCompare(b.date));
const cover = e => `<div class="cover" ${e.image ? `style="background-image:url('${e.image}')"` : ''}></div>`;
const count = list => ({ yes: list.filter(g => g.status === 'yes').length, no: list.filter(g => g.status === 'no').length, pending: list.filter(g => g.status === 'pending').length, in: list.filter(g => g.checkedIn).length, all: list.length });
const badge = s => `<span class="pill ${s}">${{ yes: 'Going', no: 'Declined', pending: 'Pending' }[s]}</span>`;
let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };
const shareUrl = id => location.href.split('#')[0] + '#event/' + id;
const empty = m => `<div class="empty">${m}</div>`;
function fillSelects() { // fills every event dropdown, keeping the current choice
  $$('.evsel').forEach(s => {
    const cur = s.value, all = s.classList.contains('all');
    s.innerHTML = (all ? '<option value="">All events</option>' : '') + events.map(e => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
    if ([...s.options].some(o => o.value === cur)) s.value = cur;
  });
}

/* ---------- 3. VIEWS ---------- */
const views = {
  dashboard() {
    const c = count(guests), up = upcoming();
    $('#stats').innerHTML = [[up.length, 'Upcoming events'], [c.all, 'Total guests'], [c.yes, 'Going'], [c.no, 'Declined'], [c.pending, 'Awaiting reply']]
      .map(s => `<div class="stat"><div class="num">${s[0]}</div><small>${s[1]}</small></div>`).join('');
    const R = 56, L = 2 * Math.PI * R; let off = 0;
    const seg = (n, col) => { const len = c.all ? n / c.all * L : 0, s = `<circle r="${R}" cx="75" cy="75" fill="none" stroke="${col}" stroke-width="16" stroke-dasharray="${len} ${L}" stroke-dashoffset="${-off}"/>`; off += len; return s; };
    $('#ring').innerHTML = `<div class="ring"><svg viewBox="0 0 150 150"><circle r="${R}" cx="75" cy="75" fill="none" stroke="var(--line)" stroke-width="16"/>${seg(c.yes, 'var(--green)')}${seg(c.pending, 'var(--lime)')}${seg(c.no, 'var(--bad)')}</svg>
      <div class="legend"><div><span class="dot" style="background:var(--green)"></span>Going ${c.yes}</div><div><span class="dot" style="background:var(--lime)"></span>Pending ${c.pending}</div><div><span class="dot" style="background:var(--bad)"></span>Declined ${c.no}</div><div class="muted">${c.all ? Math.round(c.yes / c.all * 100) : 0}% response rate to yes</div></div></div>`;
    $('#upcoming').innerHTML = up.length ? up.slice(0, 4).map(e => `<div class="item"><div><b>${esc(e.name)}</b><div class="muted">${fmt(e.date, e.time)}</div></div><a class="btn ghost sm" href="#event/${e.id}">Open</a></div>`).join('') : empty('No upcoming events. Create one to get started.');
    const rec = [...guests].filter(g => g.status !== 'pending').sort((a, b) => b.at - a.at).slice(0, 5);
    $('#recent').innerHTML = rec.length ? rec.map(g => `<div class="item"><span>${esc(g.name)} <span class="muted">for ${esc(evOf(g.eventId)?.name || 'deleted event')}</span></span>${badge(g.status)}</div>`).join('') : empty('No responses yet.');
  },
  events() {
    const q = $('#evSearch').value.toLowerCase(), s = $('#evSort').value;
    const list = events.filter(e => (e.name + e.location).toLowerCase().includes(q)).sort((a, b) => s === 'name' ? a.name.localeCompare(b.name) : s === 'guests' ? gOf(b.id).length - gOf(a.id).length : a.date.localeCompare(b.date));
    $('#evGrid').innerHTML = list.length ? list.map(e => `<article class="card">${cover(e)}<div class="body"><h3>${esc(e.name)}</h3><div class="muted">${fmt(e.date, e.time)}</div><div class="muted">${esc(e.location)}</div><div><span class="pill">${gOf(e.id).length} guests</span></div></div>
      <div class="acts"><a class="btn sm" href="#event/${e.id}">View page</a><button class="btn ghost sm" data-act="edit" data-id="${e.id}">Edit</button><button class="btn ghost sm" data-act="dup" data-id="${e.id}">Duplicate</button><button class="btn bad sm" data-act="del" data-id="${e.id}">Delete</button></div></article>`).join('') : empty('No events found.');
  },
  page() {
    const e = evOf(pageId), box = $('#v-page');
    if (!e) { box.innerHTML = `<div class="panel">${empty('This event does not exist in this browser.')}</div>`; return; }
    const c = count(gOf(e.id));
    box.innerHTML = `<div class="cover hero" ${e.image ? `style="background-image:url('${e.image}')"` : ''}></div><h1>${esc(e.name)}</h1>
      <div class="meta"><span>${fmt(e.date, e.time)}</span><span>${esc(e.location)}</span><span>${c.yes} going</span></div>
      <div class="two"><div class="panel"><h2>About this event</h2><p>${esc(e.desc || 'No description yet.').replace(/\n/g, '<br>')}</p>
      <div class="row"><input readonly value="${esc(shareUrl(e.id))}" id="shareIn"><button class="btn ghost" data-act="copy">Copy link</button></div>
      <p class="muted">Demo note: this link only works in this browser until a backend stores events online.</p></div>
      <form class="panel form" id="rsvpForm" data-id="${e.id}" novalidate><h2>Will you come?</h2>
        <label>Your name<input name="name"></label><label>Email<input name="email" type="email"></label><span class="err"></span>
        <div class="row"><button class="btn" data-s="yes">Yes, I'll be there</button><button class="btn ghost" data-s="no">Can't make it</button></div></form></div>`;
  },
  guests() {
    const f = $('#gFilter').value, q = $('#gSearch').value.toLowerCase();
    const list = guests.filter(g => (!f || g.eventId === f) && (g.name + g.email).toLowerCase().includes(q));
    $('#gTable').innerHTML = list.length ? `<table><tr><th>Name</th><th>Email</th><th>Event</th><th>RSVP</th><th></th></tr>${list.map(g => `<tr><td>${esc(g.name)}</td><td>${esc(g.email)}</td><td>${esc(evOf(g.eventId)?.name || '—')}</td>
      <td><select data-chg="${g.id}">${['pending', 'yes', 'no'].map(s => `<option value="${s}" ${g.status === s ? 'selected' : ''}>${{ yes: 'Going', no: 'Declined', pending: 'Pending' }[s]}</option>`).join('')}</select></td>
      <td><button class="btn bad sm" data-act="rmg" data-id="${g.id}">Remove</button></td></tr>`).join('')}</table>` : empty('No guests match. Add one above.');
  },
  calendar() {
    const y = cal.y, m = cal.m, first = new Date(y, m, 1), start = new Date(y, m, 1 - first.getDay());
    $('#calTitle').textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    let h = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<b>${d}</b>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i); const k = iso(d), ev = events.filter(e => e.date === k);
      h += `<button class="day ${d.getMonth() !== m ? 'out' : ''} ${k === iso(new Date()) ? 'today' : ''} ${k === cal.sel ? 'sel' : ''} ${ev.length ? 'has' : ''}" data-act="day" data-d="${k}">${d.getDate()}${ev.map(e => `<i>${esc(e.name)}</i>`).join('')}</button>`;
    }
    $('#cal').innerHTML = h;
    const day = events.filter(e => e.date === cal.sel);
    $('#dayTitle').textContent = cal.sel ? fmt(cal.sel) : 'Pick a day';
    $('#dayList').innerHTML = day.length ? day.map(e => `<div class="item"><div><b>${esc(e.name)}</b><div class="muted">${e.time} · ${esc(e.location)}</div></div><a class="btn ghost sm" href="#event/${e.id}">Open</a></div>`).join('') : empty(cal.sel ? 'Nothing planned on this day.' : 'Select a date to see its events.');
  },
  checkin() {
    const id = $('#cEvent').value, list = gOf(id), c = count(list);
    $('#cTable').innerHTML = list.length ? `<p><b>${c.in}</b> of ${c.all} checked in</p><table><tr><th>Guest</th><th>Code</th><th>RSVP</th><th></th></tr>${list.map(g => `<tr><td>${esc(g.name)}</td><td>${g.code}</td><td>${badge(g.status)}</td>
      <td><button class="btn ghost sm" data-act="qr" data-id="${g.id}">QR code</button> <button class="btn ${g.checkedIn ? 'ghost' : ''} sm" data-act="ci" data-id="${g.id}">${g.checkedIn ? 'Undo check-in' : 'Check in'}</button></td></tr>`).join('')}</table>` : empty('No guests for this event yet.');
  },
  reminders() {
    const e = evOf($('#rEvent').value), list = e ? gOf(e.id) : [];
    const mail = (g, kind) => {
      const sub = kind === 'c' ? `You're on the list: ${e.name}` : `Reminder: ${e.name} is coming up`;
      const body = `Hi ${g.name},\n\n${kind === 'c' ? 'Thanks for your RSVP!' : 'Just a reminder about our event.'}\n\n${e.name}\n${fmt(e.date, e.time)}\n${e.location}\n\nEvent page: ${shareUrl(e.id)}\nYour check-in code: ${g.code}\n`;
      return `mailto:${encodeURIComponent(g.email)}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
    };
    $('#rTable').innerHTML = list.length ? `<table><tr><th>Guest</th><th>RSVP</th><th>Prepare message</th></tr>${list.map(g => `<tr><td>${esc(g.name)}</td><td>${badge(g.status)}</td><td><a class="btn ghost sm" href="${mail(g, 'c')}">RSVP confirmation</a> <a class="btn ghost sm" href="${mail(g, 'r')}">Event reminder</a></td></tr>`).join('')}</table><p class="muted">These open your own email app with the message filled in. Real bulk sending needs an email service and a backend.</p>` : empty('No guests for this event yet.');
  },
  reports() {
    const f = $('#repEvent').value, list = events.filter(e => !f || e.id === f);
    $('#repTable').innerHTML = list.length ? `<table><tr><th>Event</th><th>Invited</th><th>Going</th><th>Declined</th><th>Pending</th><th>Checked in</th><th>Attendance</th></tr>${list.map(e => { const c = count(gOf(e.id)); return `<tr><td>${esc(e.name)}</td><td>${c.all}</td><td>${c.yes}</td><td>${c.no}</td><td>${c.pending}</td><td>${c.in}</td><td>${c.yes ? Math.round(c.in / c.yes * 100) : 0}%</td></tr>`; }).join('')}</table>` : empty('No events yet.');
  }
};

/* ---------- 4. FORMS ---------- */
let editId = null, img = '';
const form = $('#evForm');
const setErr = (name, msg) => { const el = form.elements[name].parentElement.querySelector('.err'); el.textContent = msg || ''; return !!msg; };
form.addEventListener('submit', ev => {
  ev.preventDefault(); const f = form.elements; let bad = false;
  bad |= setErr('name', f.name.value.trim().length < 3 ? 'Enter an event name (at least 3 characters).' : '');
  bad |= setErr('date', !f.date.value ? 'Choose a date.' : '');
  bad |= setErr('time', !f.time.value ? 'Choose a start time.' : '');
  bad |= setErr('location', !f.location.value.trim() ? 'Enter where it takes place.' : '');
  if (bad) return;
  const data = { name: f.name.value.trim(), desc: f.desc.value.trim(), date: f.date.value, time: f.time.value, location: f.location.value.trim(), image: img };
  if (editId) Object.assign(evOf(editId), data); else events.push({ id: 'e' + code(), ...data });
  const id = editId || events[events.length - 1].id;
  save(); toast(editId ? 'Event updated' : 'Event created'); resetForm(); location.hash = '#event/' + id;
});
form.elements.image.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  if (!file.type.startsWith('image/')) return setErr('image', 'Please choose an image file.');
  setErr('image', ''); const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { // shrink so localStorage doesn't fill up
    const k = Math.min(1, 900 / im.width), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k;
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); img = c.toDataURL('image/jpeg', .75); $('#preview').src = img; $('#preview').hidden = false; }; im.src = r.result; };
  r.readAsDataURL(file);
});
function resetForm() { form.reset(); editId = null; img = ''; $('#preview').hidden = true; $('#formTitle').textContent = 'Create event'; $$('.err', form).forEach(x => x.textContent = ''); }
$('#cancelEdit').onclick = resetForm;

$('#guestForm').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target.elements, err = $('#gErr');
  if (!events.length) return err.textContent = 'Create an event first.';
  if (f.name.value.trim().length < 2) return err.textContent = 'Enter the guest\'s name.';
  if (!/^\S+@\S+\.\S+$/.test(f.email.value)) return err.textContent = 'Enter a valid email address.';
  if (guests.some(g => g.eventId === f.event.value && g.email.toLowerCase() === f.email.value.toLowerCase())) return err.textContent = 'This guest is already on that event.';
  err.textContent = ''; guests.push({ id: 'g' + code(), eventId: f.event.value, name: f.name.value.trim(), email: f.email.value.trim(), status: 'pending', checkedIn: false, code: code(), at: Date.now() });
  save(); e.target.reset(); toast('Guest added'); render();
});

$('#codeForm').addEventListener('submit', e => {
  e.preventDefault(); const v = $('#codeIn').value.trim().toUpperCase(), g = guests.find(x => x.code === v && x.eventId === $('#cEvent').value);
  if (!g) return toast('No guest with that code for this event.');
  g.checkedIn = true; save(); $('#codeIn').value = ''; toast(g.name + ' checked in'); render();
});

document.addEventListener('submit', e => { // public RSVP form
  if (e.target.id !== 'rsvpForm') return; e.preventDefault();
  const f = e.target, st = e.submitter?.dataset.s, name = f.name.value.trim(), email = f.email.value.trim(), err = $('.err', f);
  if (name.length < 2) return err.textContent = 'Please enter your name.';
  if (!/^\S+@\S+\.\S+$/.test(email)) return err.textContent = 'Please enter a valid email.';
  let g = guests.find(x => x.eventId === f.dataset.id && x.email.toLowerCase() === email.toLowerCase());
  if (g) Object.assign(g, { name, status: st, at: Date.now() }); else guests.push({ id: 'g' + code(), eventId: f.dataset.id, name, email, status: st, checkedIn: false, code: code(), at: Date.now() });
  save(); f.innerHTML = `<h2>${st === 'yes' ? 'See you there, ' + esc(name) + '!' : 'Thanks for letting us know.'}</h2><p class="muted">Your response is saved. ${st === 'yes' ? 'The host can now prepare a confirmation for ' + esc(email) + '.' : ''}</p>`;
});

/* ---------- 5. ACTIONS ---------- */
const csv = rows => rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, id = b.dataset.id;
  if (a === 'del' && confirm('Delete this event and its guests?')) { events = events.filter(x => x.id !== id); guests = guests.filter(g => g.eventId !== id); save(); toast('Event deleted'); render(); }
  if (a === 'dup') { const o = evOf(id); events.push({ ...o, id: 'e' + code(), name: o.name + ' (copy)' }); save(); toast('Event duplicated'); render(); }
  if (a === 'edit') { const o = evOf(id), f = form.elements; editId = id; img = o.image || ''; f.name.value = o.name; f.desc.value = o.desc; f.date.value = o.date; f.time.value = o.time; f.location.value = o.location;
    $('#preview').src = img; $('#preview').hidden = !img; $('#formTitle').textContent = 'Edit event'; location.hash = '#create'; }
  if (a === 'rmg' && confirm('Remove this guest?')) { guests = guests.filter(g => g.id !== id); save(); toast('Guest removed'); render(); }
  if (a === 'ci') { const g = guests.find(x => x.id === id); g.checkedIn = !g.checkedIn; save(); render(); }
  if (a === 'qr') { const g = guests.find(x => x.id === id); $('#qrName').textContent = g.name; $('#qrCode').textContent = 'Code: ' + g.code; const box = $('#qrBox'); box.innerHTML = '';
    if (window.QRCode) new QRCode(box, { text: g.code, width: 200, height: 200 }); else box.textContent = 'QR library could not load (offline?). Use the code below.'; $('#qrd').showModal(); }
  if (a === 'copy') { const t = $('#shareIn'); t.select(); (navigator.clipboard?.writeText(t.value) || Promise.reject()).then(() => toast('Link copied'), () => { document.execCommand('copy'); toast('Link copied'); }); }
  if (a === 'prevM') { cal.m--; if (cal.m < 0) { cal.m = 11; cal.y--; } render(); }
  if (a === 'nextM') { cal.m++; if (cal.m > 11) { cal.m = 0; cal.y++; } render(); }
  if (a === 'today') { const d = new Date(); cal = { y: d.getFullYear(), m: d.getMonth(), sel: iso(d) }; render(); }
  if (a === 'day') { cal.sel = b.dataset.d; render(); }
  if (a === 'csv') { const f = $('#repEvent').value, rows = [['Event', 'Name', 'Email', 'RSVP', 'Checked in', 'Code']];
    guests.filter(g => !f || g.eventId === f).forEach(g => rows.push([evOf(g.eventId)?.name || '', g.name, g.email, g.status, g.checkedIn ? 'Yes' : 'No', g.code]));
    const url = URL.createObjectURL(new Blob([csv(rows)], { type: 'text/csv' })), l = document.createElement('a'); l.href = url; l.download = 'rsvp99-guests.csv'; l.click(); URL.revokeObjectURL(url); toast('CSV downloaded'); }
});
document.addEventListener('change', e => { const id = e.target.dataset.chg; if (id) { const g = guests.find(x => x.id === id); g.status = e.target.value; g.at = Date.now(); save(); toast('RSVP updated'); } });
['evSearch', 'evSort', 'gFilter', 'gSearch', 'cEvent', 'rEvent', 'repEvent'].forEach(i => $('#' + i).addEventListener('input', render));

/* ---------- 6. ROUTER & THEME ---------- */
let cal = (() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth(), sel: iso(d) }; })(), view = 'dashboard', pageId = '';
function render() { fillSelects(); views[view](); }
function route() {
  const [v, id] = (location.hash.slice(1) || 'dashboard').split('/');
  view = v === 'event' ? 'page' : (views[v] || v === 'create') ? v : 'dashboard'; pageId = id;
  $$('.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + view));
  $$('#nav a').forEach(a => a.classList.toggle('on', a.hash === '#' + view || (view === 'page' && a.hash === '#events')));
  $('#sidebar').classList.remove('open'); scrollTo(0, 0);
  if (view === 'create') { if (!editId) resetForm(); } else { editId = null; }
  if (view !== 'create') render(); else fillSelects();
}
const applyTheme = () => { document.documentElement.dataset.theme = theme; $('#theme').textContent = theme === 'dark' ? 'Switch to light' : 'Switch to dark'; };
$('#theme').onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(); save(); };
$('#menu').onclick = () => $('#sidebar').classList.toggle('open');
addEventListener('hashchange', route);
applyTheme(); route();
})();
