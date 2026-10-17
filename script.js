const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const KEY='rsvp99';
const S=Object.assign({events:[],theme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',tab:'home'},JSON.parse(localStorage.getItem(KEY)||'{}'));
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Storage is full. Try a smaller cover image.')}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const fmt=(d,t)=>new Date(d+'T'+(t||'00:00')).toLocaleString([],{weekday:'short',month:'short',day:'numeric',...(t?{hour:'numeric',minute:'2-digit'}:{})});
const cnt=e=>({go:e.guests.filter(g=>g.s==='going').length,no:e.guests.filter(g=>g.s==='declined').length,p:e.guests.filter(g=>g.s==='pending').length,n:e.guests.length});
const byDate=()=>[...S.events].sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
const find=id=>S.events.find(e=>e.id===id);
const coverCss=e=>e.cover?`style="background-image:url('${e.cover}')"`:'';
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}
const head=(h,p)=>`<div class="head"><div><h1>${h}</h1><p>${p}</p></div></div>`;
const stagger=v=>$$(':scope>*',v).forEach((el,i)=>el.style.setProperty('--i',i));
const meter=c=>`<div class="meter"><i style="width:${c.n?c.go/c.n*100:0}%"></i><i style="width:${c.n?c.no/c.n*100:0}%"></i></div>`;

/* ---------- views ---------- */
const R={
events(){
  const ev=byDate(),today=new Date().toISOString().slice(0,10);
  const up=ev.filter(e=>e.date>=today),past=ev.filter(e=>e.date<today).reverse();
  const card=e=>{const c=cnt(e);return `<button class="card glass" data-act="open" data-id="${e.id}"><div class="cover" ${coverCss(e)}><span>${fmt(e.date,e.time)}</span></div><div class="body"><h3>${esc(e.name)}</h3><small>${esc(e.loc||'Location to be announced')}</small>${meter(c)}<small>${c.go} going, ${c.p} waiting, ${c.no} declined</small></div></button>`};
  $('#v-events').innerHTML=head('Your events',up.length?`${up.length} coming up`:'Nothing planned yet')+
   `<div class="grid">${up.map(card).join('')||`<div class="empty glass"><h3>No events yet</h3><p>Create one, add your guests and share the link.</p><button class="cta" data-act="new">Create an event</button></div>`}</div>`+
   (past.length?`<div class="head"><div><h2>Past</h2></div></div><div class="grid">${past.map(card).join('')}</div>`:'');
},
calendar(){
  const m=S.cal?new Date(S.cal):new Date();m.setDate(1);S.cal=m.toISOString();
  const y=m.getFullYear(),mo=m.getMonth(),first=m.getDay(),days=new Date(y,mo+1,0).getDate(),now=new Date();
  let cells=['S','M','T','W','T','F','S'].map(d=>`<div class="dow">${d}</div>`).join('')+'<div class="day void"></div>'.repeat(first);
  for(let d=1;d<=days;d++){
    const k=`${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,es=S.events.filter(e=>e.date===k);
    const t=now.getFullYear()===y&&now.getMonth()===mo&&now.getDate()===d;
    cells+=`<button class="day ${es.length?'has':''} ${t?'today':''}" ${es.length?`data-act="open" data-id="${es[0].id}"`:`data-act="newOn" data-date="${k}"`}>${d}${es.length>1?`<em>${es.length} events</em>`:''}</button>`;
  }
  $('#v-calendar').innerHTML=head('Calendar','Tap a day to add an event, or a highlighted day to open one.')+
   `<div class="panel glass"><div class="cal-h"><button class="icon" data-act="cal" data-d="-1" aria-label="Previous month">‹</button><h2>${m.toLocaleString([],{month:'long',year:'numeric'})}</h2><button class="icon" data-act="cal" data-d="1" aria-label="Next month">›</button></div><div class="cal">${cells}</div></div>`;
},
guests(){
  const f=S.gf||'all',all=S.events.flatMap(e=>e.guests.map(g=>({...g,ev:e})).filter(()=>f==='all'||f===e.id));
  $('#v-guests').innerHTML=head('Guests','Everyone you have invited, across all events.')+
   `<div class="panel glass"><div class="row actions"><select id="gf" aria-label="Filter by event"><option value="all">All events</option>${S.events.map(e=>`<option value="${e.id}" ${f===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select><button class="ghost" data-act="csvAll">Export CSV</button></div>
   <div class="scroll"><table><tr><th>Name</th><th>Email</th><th>Event</th><th>Status</th></tr>${all.map(g=>`<tr><td>${esc(g.name)}</td><td>${esc(g.email)}</td><td>${esc(g.ev.name)}</td><td><button class="chip ${g.s}" data-act="cycle" data-id="${g.ev.id}" data-g="${g.id}">${g.s}</button></td></tr>`).join('')||'<tr><td colspan="4">No guests yet. Open an event to add some.</td></tr>'}</table></div></div>`;
  $('#gf').onchange=e=>{S.gf=e.target.value;save();render('guests')};
},
stats(){
  const t=S.events.reduce((a,e)=>{const c=cnt(e);a.n+=c.n;a.go+=c.go;a.no+=c.no;a.p+=c.p;return a},{n:0,go:0,no:0,p:0});
  const st=(b,l)=>`<div class="stat glass"><b>${b}</b><span>${l}</span></div>`;
  $('#v-stats').innerHTML=head('Insights','Who has replied, and who has not.')+
   `<div class="stats">${st(S.events.length,'Events')}${st(t.n,'Invited')}${st(t.go,'Going')}${st(t.no,'Declined')}${st(t.n?Math.round((t.go+t.no)/t.n*100)+'%':'0%','Replied')}</div>
   <div class="panel glass rows">${byDate().map(e=>{const c=cnt(e);return `<div class="r"><div><span>${esc(e.name)}</span><span>${c.go}/${c.n} going</span></div>${meter(c)}</div>`}).join('')||'<p>Stats appear once you create an event.</p>'}</div>`;
}};
function render(v=S.tab){R[v]();const el=$('#v-'+v);el.classList.remove('in');void el.offsetWidth;stagger(el);el.classList.add('in')}

/* ---------- navigation ---------- */
R.home=()=>{};
let pt={x:innerWidth/2,y:40};
addEventListener('pointerdown',e=>{pt={x:e.clientX,y:e.clientY}},true);
const menu=$('#menu');
function menuToggle(f){
  const o=f??!menu.classList.contains('open'),b=$('#menuBtn');
  menu.classList.toggle('open',o);b.classList.toggle('open',o);b.setAttribute('aria-expanded',o);
  $('#menuLbl').textContent=o?'Close':'Menu';document.body.classList.toggle('noscroll',o);
}
function tab(v,anim=true){
  const go=()=>{S.tab=v;save();$$('.view').forEach(s=>s.hidden=s.id!=='v-'+v);$$('.mi[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));render(v);scrollTo(0,0)};
  menuToggle(false);
  if(!anim){go();return}
  const i=$('#iris');i.style.setProperty('--x',pt.x+'px');i.style.setProperty('--y',pt.y+'px');
  i.classList.remove('go');void i.offsetWidth;i.classList.add('go');setTimeout(go,420);
}
/* lighting: a lamp that follows the pointer, a shine on glass, eyes that follow too */
addEventListener('pointermove',e=>{
  const st=document.documentElement.style;st.setProperty('--lx',e.clientX+'px');st.setProperty('--ly',e.clientY+'px');
  const g=e.target.closest?.('.glass');
  if(g){const r=g.getBoundingClientRect();g.style.setProperty('--mx',e.clientX-r.left+'px');g.style.setProperty('--my',e.clientY-r.top+'px')}
  $$('.pupil').forEach(p=>{const r=p.parentNode.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy)||1;p.style.transform=`translate(${dx/d*4}px,${dy/d*4}px)`})
});
addEventListener('keydown',e=>{if(e.key==='Escape')menuToggle(false)});
function boom(){
  const c=['#2f6b4a','#7ccf9f','#e8c76a','#f2a65a','#ffffff'];
  for(let i=0;i<28;i++){const p=document.createElement('i'),a=Math.random()*6.28,d=80+Math.random()*180;p.className='conf';
    p.style.cssText=`--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-90}px;--r:${Math.random()*720-360}deg;background:${c[i%5]};left:${pt.x}px;top:${pt.y}px`;
    document.body.appendChild(p);setTimeout(()=>p.remove(),1100)}
}

/* ---------- theme (circular reveal) ---------- */
function setTheme(t){document.documentElement.dataset.theme=t;document.querySelector('meta[name=theme-color]').content=t==='dark'?'#0e1612':'#f3eee0'}
function toggleTheme(){
  const next=S.theme==='dark'?'light':'dark',r=$('#themeBtn').getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
  S.theme=next;save();
  if(!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches){setTheme(next);return}
  const end=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  document.startViewTransition(()=>setTheme(next)).ready.then(()=>
    document.documentElement.animate({clipPath:[`circle(0 at ${x}px ${y}px)`,`circle(${end}px at ${x}px ${y}px)`]},{duration:800,easing:'cubic-bezier(.5,0,.2,1)',pseudoElement:'::view-transition-new(root)'}));
}

/* ---------- event form & detail ---------- */
const dlg=$('#formDlg'),form=$('#evForm');let editing=null;
function openForm(id,date){
  editing=id?find(id):null;form.reset();$('#formTitle').textContent=editing?'Edit event':'New event';
  if(editing)['name','date','time','loc','desc'].forEach(k=>form[k].value=editing[k]||'');else if(date)form.date.value=date;
  $('#detail').close();dlg.showModal();
}
function shrink(file){return new Promise(res=>{if(!file)return res(null);const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const s=Math.min(1,900/i.width),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.8))};i.src=r.result};r.readAsDataURL(file)})}
form.onsubmit=async ev=>{
  const f=new FormData(form),cover=await shrink(f.get('cover').size?f.get('cover'):null);
  const d={name:f.get('name').trim(),date:f.get('date'),time:f.get('time'),loc:f.get('loc').trim(),desc:f.get('desc').trim()};
  if(editing){Object.assign(editing,d);if(cover)editing.cover=cover}else S.events.push({id:uid(),...d,cover,guests:[]});
  save();toast(editing?'Event saved':'Event created');boom();render();
};
function link(e){const p=btoa(unescape(encodeURIComponent(JSON.stringify({id:e.id,name:e.name,date:e.date,time:e.time,loc:e.loc,desc:e.desc}))));return location.href.split('#')[0]+'#e='+p}
function openEvent(id){
  const e=find(id);if(!e)return;const c=cnt(e);
  $('#detail').innerHTML=`<div class="cover" ${coverCss(e)} style="border-radius:22px;margin-bottom:16px;${e.cover?`background-image:url('${e.cover}')`:''}"><span>${fmt(e.date,e.time)}</span></div>
  <h2>${esc(e.name)}</h2><p>${esc(e.loc||'Location to be announced')}</p>${e.desc?`<p class="link">${esc(e.desc)}</p>`:''}
  ${meter(c)}<small class="link">${c.go} going, ${c.p} waiting, ${c.no} declined</small>
  <div class="row actions"><button class="cta" data-act="share" data-id="${id}">Copy share link</button><button class="ghost" data-act="remind" data-id="${id}">Remind pending</button><button class="ghost" data-act="confirm" data-id="${id}">Send confirmations</button><button class="ghost" data-act="csv" data-id="${id}">Export CSV</button></div>
  <form class="add" data-id="${id}" id="gForm"><input name="n" placeholder="Guest name" required><input name="m" type="email" placeholder="Email"><button class="cta">Add guest</button></form>
  <div class="scroll"><table>${e.guests.map(g=>`<tr><td>${esc(g.name)}<br><small class="link">${esc(g.email)}</small></td><td><button class="chip ${g.s}" data-act="cycle" data-id="${id}" data-g="${g.id}">${g.s}</button></td><td><button class="x" data-act="rmg" data-id="${id}" data-g="${g.id}" aria-label="Remove guest">✕</button></td></tr>`).join('')||'<tr><td>No guests yet.</td></tr>'}</table></div>
  <div class="row end" style="margin-top:16px"><button class="ghost" data-act="edit" data-id="${id}">Edit</button><button class="ghost" data-act="del" data-id="${id}">Delete</button><button class="cta" data-act="closeDetail">Done</button></div>`;
  const d=$('#detail');if(!d.open)d.showModal();
  $('#gForm').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target);e.guests.push({id:uid(),name:f.get('n').trim(),email:f.get('m').trim(),s:'pending'});save();openEvent(id);render()};
}

/* ---------- csv & mail ---------- */
function csv(list,name){
  const q=v=>`"${String(v??'').replace(/"/g,'""')}"`,rows=[['Event','Name','Email','Status'],...list.flatMap(e=>e.guests.map(g=>[e.name,g.name,g.email,g.s]))];
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download=name+'.csv';a.click();toast('Guest list exported');
}
function mail(e,status,subject,body){
  const to=e.guests.filter(g=>g.s===status&&g.email).map(g=>g.email);
  if(!to.length)return toast('No guests with an email in this group');
  location.href=`mailto:?bcc=${encodeURIComponent(to.join(','))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  toast(`Opening email for ${to.length} guest${to.length>1?'s':''}`);
}

/* ---------- actions ---------- */
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]');if(!b)return;const {act,id,g,v,d,date}=b.dataset,e=id&&find(id);
  if(act==='tab'){ev.preventDefault();if(location.hash)location.hash='';tab(v)}
  else if(act==='theme')toggleTheme();
  else if(act==='menu')menuToggle();
  else if(act==='new'){menuToggle(false);openForm()}
  else if(act==='newOn')openForm(null,date);
  else if(act==='closeForm')dlg.close();
  else if(act==='closeDetail')$('#detail').close();
  else if(act==='open')openEvent(id);
  else if(act==='edit')openForm(id);
  else if(act==='del'){if(confirm('Delete this event and its guest list?')){S.events=S.events.filter(x=>x.id!==id);save();$('#detail').close();render();toast('Event deleted')}}
  else if(act==='share'){navigator.clipboard.writeText(link(e)).then(()=>toast('Share link copied'),()=>prompt('Copy this link',link(e)))}
  else if(act==='cycle'){const x=e.guests.find(k=>k.id===g);x.s={pending:'going',going:'declined',declined:'pending'}[x.s];save();$('#detail').open?openEvent(id):render();render()}
  else if(act==='rmg'){e.guests=e.guests.filter(k=>k.id!==g);save();openEvent(id);render()}
  else if(act==='csv')csv([e],e.name.replace(/\W+/g,'-').toLowerCase()+'-guests');
  else if(act==='csvAll')csv(S.events,'rsvp99-guests');
  else if(act==='remind')mail(e,'pending',`Reminder: ${e.name}`,`Hi, a quick reminder about ${e.name} on ${fmt(e.date,e.time)}${e.loc?' at '+e.loc:''}. Please RSVP here: ${link(e)}`);
  else if(act==='confirm')mail(e,'going',`You're confirmed: ${e.name}`,`You're confirmed for ${e.name} on ${fmt(e.date,e.time)}${e.loc?' at '+e.loc:''}. See you there.`);
  else if(act==='cal'){const m=new Date(S.cal);m.setMonth(m.getMonth()+ +d);S.cal=m.toISOString();render('calendar')}
});
$$('dialog').forEach(x=>x.addEventListener('click',ev=>{if(ev.target===x)x.close()}));

/* ---------- shared RSVP page ---------- */
function route(){
  const h=location.hash,shared=h.startsWith('#e=');
  $('#bar').hidden=shared;
  $$('.view').forEach(s=>s.hidden=shared?s.id!=='v-share':s.id!=='v-'+S.tab);
  if(!shared){tab(S.tab,false);return}
  let p;try{p=JSON.parse(decodeURIComponent(escape(atob(h.slice(3)))))}catch{p=null}
  const el=$('#v-share');
  if(!p){el.innerHTML=head('Link not valid','Ask the host to send the invitation link again.');return}
  let e=find(p.id);if(!e){e={...p,cover:null,guests:[]};S.events.push(e);save()}
  el.innerHTML=head(esc(e.name),`${fmt(e.date,e.time)}${e.loc?' at '+esc(e.loc):''}`)+
   `<div class="panel glass"><div class="cover" ${coverCss(e)} style="border-radius:20px;margin-bottom:16px"></div>${e.desc?`<p style="margin-bottom:14px">${esc(e.desc)}</p>`:''}
   <form id="rForm"><label>Your name<input name="n" required></label><label>Email<input name="m" type="email"></label>
   <div class="row end"><button type="button" class="ghost" data-r="declined">Can't make it</button><button type="button" class="cta" data-r="going">I'm going</button></div></form></div>`;
  el.classList.remove('in');void el.offsetWidth;stagger(el);el.classList.add('in');
  $$('[data-r]',el).forEach(btn=>btn.onclick=()=>{
    const f=new FormData($('#rForm'));if(!f.get('n').trim())return $('#rForm').reportValidity();
    e.guests.push({id:uid(),name:f.get('n').trim(),email:f.get('m').trim(),s:btn.dataset.r});save();if(btn.dataset.r==='going')boom();
    el.innerHTML=head(btn.dataset.r==='going'?'See you there':'Thanks for letting us know',btn.dataset.r==='going'?`You're on the list for ${esc(e.name)}.`:'Your reply has been recorded.')+`<div class="panel glass"><a class="cta" style="display:inline-block;text-decoration:none" href="#" data-act="tab" data-v="events">Open dashboard</a></div>`;
    el.classList.remove('in');void el.offsetWidth;stagger(el);el.classList.add('in');
  });
}
setTheme(S.theme);
addEventListener('hashchange',route);
route();
