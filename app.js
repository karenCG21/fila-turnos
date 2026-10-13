const STORAGE_KEY = 'fila.turnos.v1';
const SERVICES = ['Consulta general', 'Pagos y facturación', 'Soporte técnico', 'Información'];
const state = loadState();
let toastTimeout;

function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function loadState() {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved?.day === todayKey() && Array.isArray(saved.turns)) return saved; } catch {}
  return { day: todayKey(), counter: 0, currentId: null, turns: [] };
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function timeLabel(date) { return new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit',hour12:true}).format(date); }
function escapeHTML(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function waiting() { return state.turns.filter(t=>t.status==='waiting'); }
function current() { return state.turns.find(t=>t.id===state.currentId && t.status==='serving') || null; }
function initials(name) { return name.trim().split(/\s+/).slice(0,2).map(v=>v[0]?.toUpperCase()||'').join(''); }
function createTurn(name, service, phone='') {
  state.counter += 1;
  const turn = { id: `${Date.now()}-${state.counter}`, number: state.counter, name: name.trim(), service, phone: phone.trim(), time: new Date().toISOString(), status: 'waiting' };
  state.turns.push(turn); save(); render(); return turn;
}
function setToday() { document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('es-MX',{weekday:'long',day:'numeric',month:'long'}).format(new Date()).toUpperCase(); }
function render() {
  const pending = waiting(), serving = current(), done = state.turns.filter(t=>t.status==='done');
  document.querySelector('#stat-total').textContent = String(state.turns.length).padStart(2,'0');
  document.querySelector('#stat-waiting').textContent = String(pending.length).padStart(2,'0');
  document.querySelector('#stat-done').textContent = String(done.length).padStart(2,'0');
  const minutes = done.map(t=>t.duration).filter(Number.isFinite);
  document.querySelector('#stat-time').textContent = minutes.length ? Math.round(minutes.reduce((a,b)=>a+b,0)/minutes.length) : '—';
  document.querySelector('#queue-caption').textContent = `${pending.length} ${pending.length===1?'turno pendiente':'turnos pendientes'} de atención`;
  document.querySelector('#display-current').textContent = serving ? ticket(serving.number) : '—';
  document.querySelector('#display-service').textContent = serving ? serving.service : 'Sin turno';
  document.querySelector('#display-waiting').textContent = pending.length;
  document.querySelector('#display-last').textContent = state.counter ? ticket(state.counter) : '—';
  document.querySelector('#display-next').textContent = pending[0] ? `${ticket(pending[0].number)} · ${pending[0].name}` : 'Sin personas esperando';
  document.querySelector('#call-next').disabled = !pending.length;
  document.querySelector('#call-next').classList.toggle('is-disabled',!pending.length);
  const currentCard = document.querySelector('#current-card');
  currentCard.innerHTML = serving ? `<div class="current-person"><div class="current-ticket">${ticket(serving.number)}</div><div class="current-details"><span class="current-name">${escapeHTML(serving.name)}</span><p>Está recibiendo atención en este momento</p><div class="current-meta"><span class="service-tag">${escapeHTML(serving.service)}</span><span class="current-clock">Llegó a las ${timeLabel(new Date(serving.time))}</span></div></div><button class="finish-button" data-finish="${serving.id}">✓ Finalizar atención</button></div>` : '<div class="current-empty"><div class="empty-orb">◷</div><b>Todo listo para empezar</b><p>Cuando llames al siguiente turno, aparecerá aquí.</p></div>';
  const body = document.querySelector('#queue-body');
  body.innerHTML = pending.length ? pending.map(rowHTML).join('') : '';
  document.querySelector('#table-empty').classList.toggle('hidden',pending.length>0);
  document.querySelector('#service-breakdown').innerHTML = SERVICES.map((service,i)=>{ const count=state.turns.filter(t=>t.service===service).length; const pct=state.turns.length?Math.round(count/state.turns.length*100):0; return `<div class="service-line"><span class="service-label">${escapeHTML(service)}</span><span class="service-count">${count}</span><div class="service-track"><i style="width:${pct}%;background:${['#76b58a','#82a9c7','#c3a6d9','#e0ae65'][i]}"></i></div></div>`; }).join('');
  renderCustomers(document.querySelector('#customer-search')?.value || '');
}
function ticket(n) { return `A${String(n).padStart(3,'0')}`; }
function rowHTML(t) { const tone=`color-${t.number%4}`; return `<tr><td><span class="ticket-number">${ticket(t.number)}</span></td><td class="customer-name"><span class="table-avatar ${tone}">${escapeHTML(initials(t.name))}</span>${escapeHTML(t.name)}</td><td class="service-cell">${escapeHTML(t.service)}</td><td class="time-cell">${timeLabel(new Date(t.time))}</td><td><span class="state-pill state-${t.status}">${statusLabel(t.status)}</span></td><td><button class="row-menu" data-cancel="${t.id}" aria-label="Cancelar turno">···</button></td></tr>`; }
function statusLabel(status) { return ({waiting:'En espera',serving:'En atención',done:'Atendido',cancelled:'Cancelado'})[status] || status; }
function renderCustomers(query='') { const rows=state.turns.filter(t=>`${t.name} ${t.service} ${ticket(t.number)}`.toLowerCase().includes(query.toLowerCase())); document.querySelector('#customers-body').innerHTML=rows.map(rowHTML).join(''); document.querySelector('#customers-empty').classList.toggle('hidden',rows.length>0); }
function notify(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove('show'),2500); }
function openModal() { document.querySelector('#turn-modal').classList.remove('hidden'); document.querySelector('#turn-form [name="name"]').focus(); }
function closeModal() { document.querySelector('#turn-modal').classList.add('hidden'); document.querySelector('#turn-form').reset(); }
function setView(view) { document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); document.querySelector('#queue-view').classList.toggle('hidden',view!=='queue'); document.querySelector('#customers-view').classList.toggle('hidden',view!=='customers'); document.querySelector('h1').textContent=view==='queue'?'Panel de turnos':'Clientes'; document.querySelector('.breadcrumbs b').textContent=view==='queue'?'Panel de turnos':'Clientes'; }

const serviceSelect=document.querySelector('#service-select');
serviceSelect.innerHTML=SERVICES.map(s=>`<option>${escapeHTML(s)}</option>`).join('');
document.querySelector('#turn-form').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const turn=createTurn(form.get('name'),form.get('service'),form.get('phone'));closeModal();notify(`Turno ${ticket(turn.number)} agregado a la fila`);});
document.querySelectorAll('#new-turn,#customers-new').forEach(b=>b.addEventListener('click',openModal));
document.querySelector('#cancel-modal').addEventListener('click',closeModal); document.querySelector('.modal-close').addEventListener('click',closeModal);
document.querySelector('#turn-modal').addEventListener('click',e=>{if(e.target.id==='turn-modal')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
document.querySelector('#call-next').addEventListener('click',()=>{if(current()){notify('Finaliza el turno actual antes de llamar al siguiente');return;}const next=waiting()[0];if(!next)return;next.status='serving';next.startedAt=new Date().toISOString();state.currentId=next.id;save();render();notify(`Turno ${ticket(next.number)} · ${next.name}`);});
document.querySelector('#current-card').addEventListener('click',e=>{const button=e.target.closest('[data-finish]');if(!button)return;const turn=state.turns.find(t=>t.id===button.dataset.finish);turn.status='done';turn.duration=Math.max(1,Math.round((Date.now()-new Date(turn.startedAt).getTime())/60000));turn.finishedAt=new Date().toISOString();state.currentId=null;save();render();notify(`Atención de ${turn.name} finalizada`);});
document.querySelector('#queue-body').addEventListener('click',e=>{const button=e.target.closest('[data-cancel]');if(!button)return;const turn=state.turns.find(t=>t.id===button.dataset.cancel);if(!turn)return;turn.status='cancelled';save();render();notify(`Turno ${ticket(turn.number)} cancelado`);});
document.querySelector('#customers-body').addEventListener('click',e=>{const button=e.target.closest('[data-cancel]');if(!button)return;const turn=state.turns.find(t=>t.id===button.dataset.cancel);if(!turn)return;turn.status='cancelled';save();render();notify(`Turno ${ticket(turn.number)} cancelado`);});
document.querySelector('#customer-search').addEventListener('input',e=>renderCustomers(e.target.value));
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelector('#close-day').addEventListener('click',()=>{if(!state.turns.length){notify('No hay turnos para cerrar');return;}if(!confirm('¿Cerrar la atención y limpiar los turnos de hoy?'))return;state.turns=[];state.counter=0;state.currentId=null;save();render();notify('La atención de hoy se cerró');});
document.querySelector('#manage-services').addEventListener('click',()=>notify('Los servicios disponibles se configuran en app.js'));
document.querySelector('.tip-card>button').addEventListener('click',e=>e.currentTarget.parentElement.remove());
setToday(); render();
