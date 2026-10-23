 let activos = [];
let bienesControlados = [];
let solicitudes = [];
let mantenimientos = [];
let historial = [];
let currentAula47 = '1';
let currentAula26 = '1';
let currentUserRole = 'admin';
let pendingRoleTarget = null;
let catChartInstance = null;
let estadoChartInstance = null;

const ROLE_PASSWORDS = { admin: 'admin123', docente: 'docente123' };

// Lista de espacios especiales agregados al Pabellón Sur
const ESPACIOS_SUR_ESPECIALES = [
  'Sub direccion',
  'Industriales 1',
  'Industriales 2',
  'Industriales 3',
  'Aula Educ Fisica',
  'Orientacion Debora',
  'Orientacion Jimena',
  'Orientacion Jorge',
  'Orientacion Fanny',
  'Orientacion Natalia',
  'comedor'
];

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initSelectors();
  setupEventListeners();
  applyRolePermissions();
  renderViews();
  updateStats();
  checkNotifications();
});

function loadData() {
  const sa = localStorage.getItem('colegio_activos_multi');
  const sb = localStorage.getItem('colegio_bienes_controlados');
  const ss = localStorage.getItem('colegio_solicitudes_multi');
  const sm = localStorage.getItem('colegio_mantenimientos_multi');
  const sh = localStorage.getItem('colegio_historial_multi');
  const sr = localStorage.getItem('colegio_user_role');

  if (sa) {
    activos = JSON.parse(sa);
  } else {
    seedSampleData();
  }
  if (sb) bienesControlados = JSON.parse(sb);
  if (ss) solicitudes = JSON.parse(ss);
  if (sm) mantenimientos = JSON.parse(sm);
  if (sh) historial = JSON.parse(sh);
  if (sr) {
    currentUserRole = sr;
    document.getElementById('user-role-select').value = sr;
  }
}

function saveData() {
  localStorage.setItem('colegio_activos_multi', JSON.stringify(activos));
  localStorage.setItem('colegio_bienes_controlados', JSON.stringify(bienesControlados));
  localStorage.setItem('colegio_solicitudes_multi', JSON.stringify(solicitudes));
  localStorage.setItem('colegio_mantenimientos_multi', JSON.stringify(mantenimientos));
  localStorage.setItem('colegio_historial_multi', JSON.stringify(historial));
  localStorage.setItem('colegio_user_role', currentUserRole);
  updateStats();
  checkNotifications();
}

function seedSampleData() {
  activos = [
    { id: '1', codigo: 'ACT-SUR01', nombre: 'Proyector Subdirección', categoria: 'Tecnología', aulaId: 'Sub direccion', modulo: 47, estado: 'Excelente', notas: 'Oficina' },
    { id: '2', codigo: 'ACT-SUR02', nombre: 'Herramientas Industriales Taller', categoria: 'Equipo Didáctico', aulaId: 'Industriales 1', modulo: 47, estado: 'Bueno', notas: 'Taller industrial' },
    { id: '3', codigo: 'ACT-COM01', nombre: 'Mesa de Comedor Grande', categoria: 'Mobiliario', aulaId: 'comedor', modulo: 47, estado: 'Excelente', notas: 'Área Comedor' }
  ];
  bienesControlados = [
    { id: 'bc-1', codigo: 'BC-00008', nombre: 'Olla arrocera a gas para 50 tzs RWA', custodio: 'Cocina / Comedor' }
  ];
  solicitudes = [];
  mantenimientos = [];
  historial = [
    { id: 'h-1', fecha: '2026-10-22', tipo: 'Registro Nuevo', codigo: 'ACT-SUR01', nombre: 'Proyector Subdirección', detalle: 'Asignado a Sub direccion', responsable: 'Administración' }
  ];
  saveData();
}

function initSelectors() {
  const sel47 = document.getElementById('aula-select-47');
  const sel26 = document.getElementById('aula-select-26');

  sel47.innerHTML = '';
  sel26.innerHTML = '';

  // Poblar aulas numeradas del Pabellón Sur
  for (let i = 1; i <= 47; i++) {
    const opt = document.createElement('option');
    opt.value = i.toString();
    opt.textContent = `Aula ${i < 10 ? '0' + i : i} (Pabellón Sur)`;
    sel47.appendChild(opt);
  }

  // Poblar espacios especiales y Comedor en Pabellón Sur
  const nombresAmigables = {
    'Sub direccion': 'Subdirección',
    'Industriales 1': 'Industriales 1',
    'Industriales 2': 'Industriales 2',
    'Industriales 3': 'Industriales 3',
    'Aula Educ Fisica': 'Aula Educación Física',
    'Orientacion Debora': 'Orientación - Débora',
    'Orientacion Jimena': 'Orientación - Jimena',
    'Orientacion Jorge': 'Orientación - Jorge',
    'Orientacion Fanny': 'Orientación - Fanny',
    'Orientacion Natalia': 'Orientación - Natalia',
    'comedor': 'Comedor'
  };

  ESPACIOS_SUR_ESPECIALES.forEach(esp => {
    const opt = document.createElement('option');
    opt.value = esp;
    opt.textContent = `${nombresAmigables[esp] || esp} (Pabellón Sur)`;
    sel47.appendChild(opt);
  });

  // Poblar Pabellón Central (26 Aulas Taller)
  for (let i = 1; i <= 26; i++) {
    const opt = document.createElement('option');
    opt.value = i.toString();
    opt.textContent = `Aula Taller ${i < 10 ? '0' + i : i} (Pabellón Central)`;
    sel26.appendChild(opt);
  }

  refreshDynamicDropdowns();
}

function refreshDynamicDropdowns() {
  const actAula = document.getElementById('activo-aula');
  if (!actAula) return;
  actAula.innerHTML = '';

  const optGroupSur = document.createElement('optgroup');
  optGroupSur.label = 'Pabellón Sur (Aulas, Oficinas y Talleres)';

  for (let i = 1; i <= 47; i++) {
    const opt = document.createElement('option');
    opt.value = `47-${i}`;
    opt.textContent = `Pabellón Sur - Aula ${i < 10 ? '0' + i : i}`;
    optGroupSur.appendChild(opt);
  }

  const nombresAmigables = {
    'Sub direccion': 'Subdirección',
    'Industriales 1': 'Industriales 1',
    'Industriales 2': 'Industriales 2',
    'Industriales 3': 'Industriales 3',
    'Aula Educ Fisica': 'Aula Educación Física',
    'Orientacion Debora': 'Orientación - Débora',
    'Orientacion Jimena': 'Orientación - Jimena',
    'Orientacion Jorge': 'Orientación - Jorge',
    'Orientacion Fanny': 'Orientación - Fanny',
    'Orientacion Natalia': 'Orientación - Natalia',
    'comedor': 'Comedor'
  };

  ESPACIOS_SUR_ESPECIALES.forEach(esp => {
    const opt = document.createElement('option');
    opt.value = `47-${esp}`;
    opt.textContent = `Pabellón Sur - ${nombresAmigables[esp] || esp}`;
    optGroupSur.appendChild(opt);
  });
  actAula.appendChild(optGroupSur);

  const optGroupCentral = document.createElement('optgroup');
  optGroupCentral.label = 'Pabellón Central (Aulas Taller)';
  for (let i = 1; i <= 26; i++) {
    const opt = document.createElement('option');
    opt.value = `26-${i}`;
    opt.textContent = `Pabellón Central - Aula Taller ${i < 10 ? '0' + i : i}`;
    optGroupCentral.appendChild(opt);
  }
  actAula.appendChild(optGroupCentral);
}

function setupEventListeners() {
  const roleSelect = document.getElementById('user-role-select');
  roleSelect.addEventListener('change', (e) => {
    const target = e.target.value;
    e.target.value = currentUserRole;
    pendingRoleTarget = target;
    document.getElementById('auth-role-name').textContent = target === 'admin' ? 'Administrador' : 'Docente';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-error').classList.add('hidden');
    document.getElementById('modal-auth').classList.remove('hidden');
  });

  document.getElementById('form-auth').addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('auth-password').value;
    if (pwd === ROLE_PASSWORDS[pendingRoleTarget]) {
      currentUserRole = pendingRoleTarget;
      document.getElementById('user-role-select').value = currentUserRole;
      saveData();
      applyRolePermissions();
      document.getElementById('modal-auth').classList.add('hidden');
      showToast(`Cambiado a perfil ${currentUserRole}`);
      renderSolicitudes();
      renderViews();
    } else {
      document.getElementById('auth-error').classList.remove('hidden');
    }
  });

  document.getElementById('btn-notifications').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('btn-notifications');
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active', 'border-brand-500', 'text-brand-500');
        t.classList.add('border-transparent', 'text-slate-400');
      });
      tab.classList.add('active', 'border-brand-500', 'text-brand-500');
      tab.classList.remove('border-transparent', 'text-slate-400');

      const target = tab.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(target).classList.remove('hidden');

      if (target === 'tab-stats') renderCharts();
      if (target === 'tab-historial') renderHistorialTab();
      if (target === 'tab-bienes-controlados') renderBienesControlados();
    });
  });

  document.getElementById('aula-select-47').addEventListener('change', (e) => {
    currentAula47 = e.target.value;
    renderView47();
  });

  document.getElementById('aula-select-26').addEventListener('change', (e) => {
    currentAula26 = e.target.value;
    renderView26();
  });

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fixed').forEach(m => m.classList.add('hidden'));
    });
  });

  document.getElementById('btn-nueva-solicitud').addEventListener('click', openModalSolicitud);
  document.getElementById('btn-nuevo-mantenimiento').addEventListener('click', openModalMantenimiento);
  document.getElementById('form-activo').addEventListener('submit', handleActivoSubmit);
  document.getElementById('form-bien').addEventListener('submit', handleBienSubmit);
  document.getElementById('form-solicitud').addEventListener('submit', handleSolicitudSubmit);
  document.getElementById('form-mantenimiento').addEventListener('submit', handleMantenimientoSubmit);
  document.getElementById('form-baja').addEventListener('submit', handleBajaSubmit);
  document.getElementById('global-search').addEventListener('input', handleGlobalSearch);

  document.getElementById('btn-seed').addEventListener('click', () => {
    if (confirm('¿Cargar datos de prueba?')) {
      seedSampleData();
      renderViews();
      showToast('Datos demo cargados.');
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({activos, bienesControlados, solicitudes, mantenimientos, historial}, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'respaldo_general.json';
    a.click();
  });

  document.getElementById('btn-export-excel').addEventListener('click', () => {
    let csv = 'Tipo,Control_o_Codigo,Descripcion,Ubicacion_o_Custodio\n';
    activos.forEach(a => csv += `"Activo","${a.codigo}","${a.nombre}","${a.modulo === 47 ? 'Pabellón Sur' : 'Pabellón Central'} ${a.aulaId}"\n`);
    bienesControlados.forEach(b => csv += `"Bien Controlado","${b.codigo}","${b.nombre}","${b.custodio}"\n`);
    const blob = new Blob([csv], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventario_san_luis_gonzaga.csv';
    a.click();
  });
}

function checkNotifications() {
  const notifList = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');
  const countEl = document.getElementById('notif-count');

  let notifs = [];

  const pendingSol = solicitudes.filter(s => s.estado === 'Pendiente');
  if (pendingSol.length > 0) {
    notifs.push({
      type: 'amber',
      icon: 'ph-arrows-left-right',
      title: 'Solicitudes pendientes',
      desc: `Hay ${pendingSol.length} traslado(s) esperando aprobación.`,
      tab: 'tab-solicitudes'
    });
  }

  const pendingMaint = mantenimientos.filter(m => m.estado === 'Pendiente');
  if (pendingMaint.length > 0) {
    notifs.push({
      type: 'rose',
      icon: 'ph-warning',
      title: 'Mantenimientos activos',
      desc: `Hay ${pendingMaint.length} equipo(s) con fallas reportadas.`,
      tab: 'tab-mantenimiento'
    });
  }

  notifList.innerHTML = '';
  countEl.textContent = notifs.length;

  if (notifs.length === 0) {
    badge.classList.add('hidden');
    notifList.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">Sin alertas o notificaciones pendientes.</div>`;
    return;
  }

  badge.classList.remove('hidden');

  notifs.forEach(n => {
    const item = document.createElement('div');
    item.className = 'p-3 hover:bg-slate-700/40 cursor-pointer transition flex items-start gap-2.5';
    item.onclick = () => {
      document.querySelector(`[data-tab="${n.tab}"]`).click();
      document.getElementById('notif-dropdown').classList.add('hidden');
    };

    const colorClasses = {
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    };

    item.innerHTML = `
      <div class="p-2 rounded-lg ${colorClasses[n.type]} border shrink-0">
        <i class="ph ${n.icon} text-base"></i>
      </div>
      <div>
        <p class="font-bold text-slate-200 text-xs">${n.title}</p>
        <p class="text-[11px] text-slate-400 leading-tight mt-0.5">${n.desc}</p>
      </div>
    `;
    notifList.appendChild(item);
  });
}

function imprimirActaSeccion(tipoSeccion) {
  let lastSeq = parseInt(localStorage.getItem('colegio_acta_seq') || '0');
  lastSeq++;
  localStorage.setItem('colegio_acta_seq', lastSeq);
  
  const year = new Date().getFullYear();
  const consecutivoStr = `ACTA-${year}-${String(lastSeq).padStart(4, '0')}`;
  document.getElementById('print-consecutivo').textContent = consecutivoStr;

  const subTitleEl = document.getElementById('print-subtitle-seccion');
  const tituloActaEl = document.getElementById('print-titulo-acta');

  const tabs = ['tab-aulas-47', 'tab-aulas-26', 'tab-bienes-controlados', 'tab-solicitudes', 'tab-historial', 'tab-mantenimiento'];
  tabs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('print-seccion-oculta');
      el.classList.remove('print-seccion-activa');
    }
  });

  let seccionTargetId = '';
  if (tipoSeccion === 'aula-47') {
    seccionTargetId = 'tab-aulas-47';
    let nombreEspacio = currentAula47;
    if (!isNaN(currentAula47)) nombreEspacio = `Aula ${currentAula47}`;
    subTitleEl.textContent = `Pabellón Sur - Asignación de Activos`;
    tituloActaEl.textContent = `ACTA DE INVENTARIO Y ASIGNACIÓN - PABELLÓN SUR (${nombreEspacio.toUpperCase()})`;
  } else if (tipoSeccion === 'aula-26') {
    seccionTargetId = 'tab-aulas-26';
    subTitleEl.textContent = `Pabellón Central - Aulas Taller`;
    tituloActaEl.textContent = `ACTA DE INVENTARIO Y ASIGNACIÓN - PABELLÓN CENTRAL (AULA TALLER ${currentAula26})`;
  } else if (tipoSeccion === 'bienes') {
    seccionTargetId = 'tab-bienes-controlados';
    subTitleEl.textContent = `Área de Contabilidad`;
    tituloActaEl.textContent = `ACTA OFICIAL DE BIENES SUJETOS A CONTROL`;
  } else if (tipoSeccion === 'traslados') {
    seccionTargetId = 'tab-solicitudes';
    subTitleEl.textContent = `Registro de Movimientos`;
    tituloActaEl.textContent = `ACTA DE SOLICITUDES Y TRASLADOS DE EQUIPOS`;
  } else if (tipoSeccion === 'historial') {
    seccionTargetId = 'tab-historial';
    subTitleEl.textContent = `Auditoría Institucional`;
    tituloActaEl.textContent = `ACTA DE HISTORIAL Y BAJAS OFICIALES`;
  } else if (tipoSeccion === 'mantenimiento') {
    seccionTargetId = 'tab-mantenimiento';
    subTitleEl.textContent = `Soporte Técnico`;
    tituloActaEl.textContent = `ACTA DE INCIDENCIAS Y MANTENIMIENTO`;
  }

  if (seccionTargetId) {
    const targetEl = document.getElementById(seccionTargetId);
    targetEl.classList.remove('print-seccion-oculta');
    targetEl.classList.add('print-seccion-activa');
  }

  window.print();

  setTimeout(() => {
    tabs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('print-seccion-oculta', 'print-seccion-activa');
    });
    renderViews();
  }, 500);
}

function importarCSV(event) {
  if (currentUserRole !== 'admin') {
    alert('Acceso restringido: Solo los administradores pueden importar archivos.');
    event.target.value = '';
    return;
  }
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/);
    let importedActivos = 0;
    let importedBienes = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const delimiter = line.includes(';') ? ';' : ',';
      const cols = line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());

      if (i === 0 && (cols[0].toLowerCase().includes('cód') || cols[0].toLowerCase().includes('cod') || cols[1].toLowerCase().includes('nom') || cols[1].toLowerCase().includes('desc'))) {
        continue;
      }

      if (cols.length >= 2) {
        const codigo = cols[0] ? cols[0].toUpperCase() : `ACT-${Date.now()}-${i}`;
        const nombre = cols[1] || 'Elemento Importado';
        const ubicacionTexto = cols[2] ? cols[2] : 'Sub direccion';

        if (!activos.some(a => a.codigo === codigo)) {
          activos.push({
            id: 'imp-' + Date.now() + '-' + i,
            codigo,
            nombre,
            categoria: 'Tecnología',
            aulaId: ubicacionTexto,
            modulo: 47,
            estado: 'Bueno',
            notas: 'Importado desde Excel'
          });
          importedActivos++;
        }
      }
    }

    saveData();
    renderViews();
    showToast(`Importación exitosa: ${importedActivos} activos añadidos.`);
    event.target.value = '';
  };

  reader.readAsText(file, 'UTF-8');
}

function applyRolePermissions() {
  const adminEls = document.querySelectorAll('.admin-only');
  if (currentUserRole === 'admin') {
    adminEls.forEach(el => el.classList.remove('hidden'));
    document.getElementById('role-icon').className = 'ph ph-shield-check text-brand-500 text-lg shrink-0';
  } else {
    adminEls.forEach(el => el.classList.add('hidden'));
    document.getElementById('role-icon').className = 'ph ph-user text-blue-400 text-lg shrink-0';
  }
}

function renderViews() {
  renderView47();
  renderView26();
  renderBienesControlados();
  renderSolicitudes();
  renderHistorialTab();
  renderMantenimientos();
}

function renderView47() {
  const tbody = document.getElementById('activos-table-body-47');
  const empty = document.getElementById('activos-empty-47');
  const title = document.getElementById('aula-title-47');
  const badge = document.getElementById('aula-badge-count-47');

  if (!isNaN(currentAula47)) {
    title.textContent = `Aula ${parseInt(currentAula47) < 10 ? '0' + currentAula47 : currentAula47}`;
  } else {
    title.textContent = currentAula47;
  }

  const filtered = activos.filter(a => a.modulo === 47 && String(a.aulaId) === String(currentAula47));
  badge.textContent = `${filtered.length} activos`;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition border-b border-slate-700/40';
    tr.innerHTML = `
      <td class="px-5 py-3.5 font-mono font-bold text-brand-500 cursor-pointer hover:underline" onclick="openHistorial('${item.id}', 'activo')">${item.codigo}</td>
      <td class="px-5 py-3.5 text-slate-100 font-medium">${item.nombre}</td>
      <td class="px-5 py-3.5 text-slate-300">${item.categoria}</td>
      <td class="px-5 py-3.5"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400">${item.estado}</span></td>
      <td class="px-5 py-3.5 text-right print:hidden space-x-1">
        <button onclick="openModalBaja('${item.id}', 'activo')" title="Dar de baja" class="admin-only text-slate-400 hover:text-rose-400 p-1"><i class="ph ph-trash text-base"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  applyRolePermissions();
}

function renderView26() {
  const tbody = document.getElementById('activos-table-body-26');
  const empty = document.getElementById('activos-empty-26');
  const title = document.getElementById('aula-title-26');
  const badge = document.getElementById('aula-badge-count-26');

  const num = parseInt(currentAula26);
  title.textContent = `Aula Taller ${num < 10 ? '0' + num : num}`;
  const filtered = activos.filter(a => a.modulo === 26 && String(a.aulaId) === String(currentAula26));
  badge.textContent = `${filtered.length} activos`;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition border-b border-slate-700/40';
    tr.innerHTML = `
      <td class="px-5 py-3.5 font-mono font-bold text-sky-400 cursor-pointer hover:underline" onclick="openHistorial('${item.id}', 'activo')">${item.codigo}</td>
      <td class="px-5 py-3.5 text-slate-100 font-medium">${item.nombre}</td>
      <td class="px-5 py-3.5 text-slate-300">${item.categoria}</td>
      <td class="px-5 py-3.5"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400">${item.estado}</span></td>
      <td class="px-5 py-3.5 text-right print:hidden space-x-1">
        <button onclick="openModalBaja('${item.id}', 'activo')" title="Dar de baja" class="admin-only text-slate-400 hover:text-rose-400 p-1"><i class="ph ph-trash text-base"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  applyRolePermissions();
}

function renderBienesControlados() {
  const tbody = document.getElementById('bienes-table-body');
  const empty = document.getElementById('bienes-empty');
  const badge = document.getElementById('bienes-badge-count');

  badge.textContent = `${bienesControlados.length} bienes`;
  tbody.innerHTML = '';

  if (bienesControlados.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  bienesControlados.forEach(bien => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition border-b border-slate-700/40';
    tr.innerHTML = `
      <td class="px-5 py-3.5 font-mono font-bold text-rose-400 cursor-pointer hover:underline" onclick="openHistorial('${bien.id}', 'bien')">${bien.codigo}</td>
      <td class="px-5 py-3.5 text-slate-100 font-medium">${bien.nombre}</td>
      <td class="px-5 py-3.5 text-slate-300">${bien.custodio}</td>
      <td class="px-5 py-3.5 text-right print:hidden space-x-1">
        <button onclick="openModalBaja('${bien.id}', 'bien')" title="Dar de baja" class="admin-only text-slate-400 hover:text-rose-400 p-1"><i class="ph ph-trash text-base"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  applyRolePermissions();
}

function openModalBienControlado() {
  if (currentUserRole !== 'admin') {
    alert('Acceso restringido a Administradores.');
    return;
  }
  document.getElementById('form-bien').reset();
  document.getElementById('modal-bien').classList.remove('hidden');
}

function handleBienSubmit(e) {
  e.preventDefault();
  const codigo = document.getElementById('bien-codigo').value.trim().toUpperCase();
  const nombre = document.getElementById('bien-nombre').value.trim();
  const custodio = document.getElementById('bien-custodio').value.trim();

  bienesControlados.push({ id: 'bc-' + Date.now(), codigo, nombre, custodio });
  
  historial.unshift({
    id: 'h-' + Date.now(),
    fecha: new Date().toLocaleDateString(),
    tipo: 'Bien Controlado',
    codigo,
    nombre,
    detalle: `Asignado a: ${custodio}`,
    responsable: 'Contabilidad'
  });

  saveData();
  renderBienesControlados();
  document.getElementById('modal-bien').classList.add('hidden');
  showToast('Bien controlado registrado con éxito.');
}

function openModalActivo(item = null, moduloHint = 47) {
  if (currentUserRole !== 'admin') {
    alert('Acceso restringido a Administradores.');
    return;
  }
  document.getElementById('form-activo').reset();
  if (moduloHint === 47) {
    document.getElementById('activo-aula').value = `47-${currentAula47}`;
  } else {
    document.getElementById('activo-aula').value = `26-${currentAula26}`;
  }
  document.getElementById('modal-activo').classList.remove('hidden');
}

function handleActivoSubmit(e) {
  e.preventDefault();
  const val = document.getElementById('activo-aula').value.split('-');
  const modulo = parseInt(val[0]);
  const aulaId = val.slice(1).join('-');
  const codigo = document.getElementById('activo-codigo').value.trim().toUpperCase();
  const nombre = document.getElementById('activo-nombre').value.trim();
  const categoria = document.getElementById('activo-categoria').value;
  const estado = document.getElementById('activo-estado').value;

  activos.push({ id: Date.now().toString(), codigo, nombre, categoria, aulaId, modulo, estado });
  
  historial.unshift({
    id: 'h-' + Date.now(),
    fecha: new Date().toLocaleDateString(),
    tipo: 'Registro Nuevo',
    codigo,
    nombre,
    detalle: `Asignado a Pabellón ${modulo === 47 ? 'Sur' : 'Central'} - ${aulaId}`,
    responsable: 'Administración'
  });

  saveData();
  renderViews();
  document.getElementById('modal-activo').classList.add('hidden');
  showToast('Activo registrado exitosamente.');
}

function openModalBaja(id, tipo) {
  if (currentUserRole !== 'admin') {
    alert('Solo el Administrador puede dar de baja elementos.');
    return;
  }
  let elem = tipo === 'activo' ? activos.find(a => a.id === id) : bienesControlados.find(b => b.id === id);
  if (!elem) return;
  document.getElementById('baja-activo-id').value = `${tipo}:${elem.id}`;
  document.getElementById('baja-activo-info').value = `[${elem.codigo}] ${elem.nombre}`;
  document.getElementById('baja-motivo').value = '';
  document.getElementById('modal-baja').classList.remove('hidden');
}

function handleBajaSubmit(e) {
  e.preventDefault();
  const parts = document.getElementById('baja-activo-id').value.split(':');
  const tipo = parts[0];
  const id = parts[1];
  const motivo = document.getElementById('baja-motivo').value.trim();

  let actaNum = parseInt(localStorage.getItem('colegio_acta_seq') || '0') + 1;
  localStorage.setItem('colegio_acta_seq', actaNum);
  const year = new Date().getFullYear();
  const actaStr = `ACTA-${year}-${String(actaNum).padStart(4, '0')}`;

  if (tipo === 'activo') {
    const act = activos.find(a => a.id === id);
    if (act) {
      historial.unshift({
        id: 'h-' + Date.now(),
        fecha: new Date().toLocaleDateString(),
        tipo: `Baja Oficial (${actaStr})`,
        codigo: act.codigo,
        nombre: act.nombre,
        detalle: `Motivo de baja: ${motivo}`,
        responsable: 'Administración y Junta'
      });
      activos = activos.filter(a => a.id !== id);
    }
  } else {
    const bien = bienesControlados.find(b => b.id === id);
    if (bien) {
      historial.unshift({
        id: 'h-' + Date.now(),
        fecha: new Date().toLocaleDateString(),
        tipo: `Baja Bien Controlado (${actaStr})`,
        codigo: bien.codigo,
        nombre: bien.nombre,
        detalle: `Motivo de baja: ${motivo}`,
        responsable: 'Contabilidad'
      });
      bienesControlados = bienesControlados.filter(b => b.id !== id);
    }
  }

  saveData();
  renderViews();
  document.getElementById('modal-baja').classList.add('hidden');
  showToast(`Elemento dado de baja. Acta generada: ${actaStr}`);
}

function openModalSolicitud() {
  const sel = document.getElementById('solicitud-activo');
  sel.innerHTML = '';
  
  bienesControlados.forEach(b => {
    const opt = document.createElement('option');
    opt.value = `bien:${b.id}`;
    opt.textContent = `[Bien Controlado] ${b.codigo} - ${b.nombre} (Custodio: ${b.custodio})`;
    sel.appendChild(opt);
  });

  activos.forEach(a => {
    const opt = document.createElement('option');
    opt.value = `activo:${a.id}`;
    opt.textContent = `[Activo] ${a.codigo} - ${a.nombre} (Pabellón ${a.modulo === 47 ? 'Sur' : 'Central'} - ${a.aulaId})`;
    sel.appendChild(opt);
  });

  if (sel.options.length === 0) {
    alert('No hay elementos registrados para trasladar.');
    return;
  }

  const destSel = document.getElementById('solicitud-destino');
  destSel.innerHTML = '';

  const optGroupSur = document.createElement('optgroup');
  optGroupSur.label = 'Pabellón Sur (Aulas, Oficinas y Talleres)';
  for (let i = 1; i <= 47; i++) {
    const opt = document.createElement('option');
    opt.value = `Pabellón Sur - Aula ${i < 10 ? '0' + i : i}`;
    opt.textContent = `Pabellón Sur - Aula ${i < 10 ? '0' + i : i}`;
    optGroupSur.appendChild(opt);
  }
  ESPACIOS_SUR_ESPECIALES.forEach(esp => {
    const opt = document.createElement('option');
    opt.value = `Pabellón Sur - ${esp}`;
    opt.textContent = `Pabellón Sur - ${esp}`;
    optGroupSur.appendChild(opt);
  });
  destSel.appendChild(optGroupSur);

  const optGroupCentral = document.createElement('optgroup');
  optGroupCentral.label = 'Pabellón Central (Aulas Taller)';
  for (let i = 1; i <= 26; i++) {
    const opt = document.createElement('option');
    opt.value = `Pabellón Central - Aula Taller ${i < 10 ? '0' + i : i}`;
    opt.textContent = `Pabellón Central - Aula Taller ${i < 10 ? '0' + i : i}`;
    optGroupCentral.appendChild(opt);
  }
  destSel.appendChild(optGroupCentral);
  
  updateSolicitudOrigenDisplay();
  sel.onchange = updateSolicitudOrigenDisplay;
  document.getElementById('modal-solicitud').classList.remove('hidden');
}

function updateSolicitudOrigenDisplay() {
  const val = document.getElementById('solicitud-activo').value.split(':');
  const tipo = val[0];
  const id = val[1];
  if (tipo === 'activo') {
    const act = activos.find(a => a.id === id);
    document.getElementById('solicitud-origen-display').value = `Pabellón ${act.modulo === 47 ? 'Sur' : 'Central'} - ${act.aulaId}`;
  } else {
    const bien = bienesControlados.find(b => b.id === id);
    document.getElementById('solicitud-origen-display').value = `Custodio: ${bien.custodio}`;
  }
}

function handleSolicitudSubmit(e) {
  e.preventDefault();
  const val = document.getElementById('solicitud-activo').value.split(':');
  const tipo = val[0];
  const id = val[1];
  const destino = document.getElementById('solicitud-destino').value;
  const solicitante = document.getElementById('solicitud-solicitante').value.trim();
  const motivo = document.getElementById('solicitud-motivo').value.trim();

  let elemName = '', elemCode = '', origText = '';
  if (tipo === 'activo') {
    const act = activos.find(a => a.id === id);
    elemName = act.nombre;
    elemCode = act.codigo;
    origText = `Pabellón ${act.modulo === 47 ? 'Sur' : 'Central'} - ${act.aulaId}`;
  } else {
    const bien = bienesControlados.find(b => b.id === id);
    elemName = bien.nombre;
    elemCode = bien.codigo;
    origText = `Custodio: ${bien.custodio}`;
  }

  solicitudes.unshift({
    id: 'sol-' + Date.now(),
    tipoElem: tipo,
    elemId: id,
    codigoActivo: elemCode,
    nombreActivo: elemName,
    origen: origText,
    destino: destino,
    solicitante,
    motivo,
    fecha: new Date().toLocaleDateString(),
    estado: 'Pendiente'
  });

  saveData();
  renderSolicitudes();
  document.getElementById('modal-solicitud').classList.add('hidden');
  showToast('Solicitud de traslado enviada.');
}

function renderSolicitudes() {
  const tbody = document.getElementById('solicitudes-table-body');
  const empty = document.getElementById('solicitudes-empty');
  tbody.innerHTML = '';

  if (solicitudes.length === 0) {
    empty.classList.add('hidden'); // En blanco si no hay
    return;
  }
  empty.classList.add('hidden');

  solicitudes.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition border-b border-slate-700/40';
    
    let botonAccion = '';
    if (s.estado === 'Pendiente') {
      if (currentUserRole === 'admin') {
        botonAccion = `<button onclick="aprobarSolicitud('${s.id}')" class="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[11px] font-medium shadow">Aprobar</button>`;
      } else {
        botonAccion = `<span class="text-[11px] text-amber-400 italic">Esperando Admin</span>`;
      }
    } else {
      botonAccion = `<span class="text-[11px] text-emerald-400 font-medium">Completado</span>`;
    }

    tr.innerHTML = `
      <td class="px-5 py-3.5 text-slate-400">${s.fecha}</td>
      <td class="px-5 py-3.5 font-medium text-white">${s.nombreActivo} <span class="font-mono text-brand-500 text-xs">(${s.codigoActivo})</span></td>
      <td class="px-5 py-3.5 text-slate-300">${s.origen} &rarr; ${s.destino}</td>
      <td class="px-5 py-3.5 text-slate-300">${s.solicitante} (${s.motivo || 'Traslado'})</td>
      <td class="px-5 py-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400">${s.estado}</span></td>
      <td class="px-5 py-3.5 text-right">${botonAccion}</td>
    `;
    tbody.appendChild(tr);
  });
}

function aprobarSolicitud(id) {
  if (currentUserRole !== 'admin') {
    alert('Acceso denegado: Solo el Administrador puede aprobar.');
    return;
  }
  const s = solicitudes.find(x => x.id === id);
  if (!s) return;

  if (s.tipoElem === 'activo') {
    const act = activos.find(a => a.id === s.elemId);
    if (act) {
      if (s.destino.toLowerCase().includes('central') || s.destino.toLowerCase().includes('taller')) {
        const matchNum = s.destino.match(/\d+/);
        act.modulo = 26;
        act.aulaId = matchNum ? matchNum[0] : '1';
      } else {
        act.modulo = 47;
        const sub = s.destino.replace('Pabellón Sur - ', '').trim();
        act.aulaId = sub;
      }
    }
  } else {
    const bien = bienesControlados.find(b => b.id === s.elemId);
    if (bien) {
      bien.custodio = s.destino;
    }
  }

  s.estado = 'Completado';

  let actaNum = parseInt(localStorage.getItem('colegio_acta_seq') || '0') + 1;
  localStorage.setItem('colegio_acta_seq', actaNum);
  const year = new Date().getFullYear();
  const actaStr = `ACTA-${year}-${String(actaNum).padStart(4, '0')}`;

  historial.unshift({
    id: 'h-' + Date.now(),
    fecha: new Date().toLocaleDateString(),
    tipo: `Traslado Aprobado (${actaStr})`,
    codigo: s.codigoActivo,
    nombre: s.nombreActivo,
    detalle: `Trasladado de [${s.origen}] a [${s.destino}]`,
    responsable: s.solicitante
  });

  saveData();
  renderViews();
  showToast(`Traslado aprobado. Acta generada: ${actaStr}`);
}

function renderHistorialTab() {
  const tbody = document.getElementById('historial-table-body');
  const empty = document.getElementById('historial-empty');
  tbody.innerHTML = '';

  if (historial.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  historial.forEach(h => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition border-b border-slate-700/40';
    tr.innerHTML = `
      <td class="px-5 py-3.5 text-slate-400">${h.fecha}</td>
      <td class="px-5 py-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400">${h.tipo}</span></td>
      <td class="px-5 py-3.5 text-white font-medium">${h.nombre} <span class="font-mono text-brand-500 text-xs">(${h.codigo})</span></td>
      <td class="px-5 py-3.5 text-slate-300">${h.detalle}</td>
      <td class="px-5 py-3.5 text-slate-300">${h.responsable}</td>
    `;
    tbody.appendChild(tr);
  });
}

function openModalMantenimiento() {
  const sel = document.getElementById('maint-activo');
  sel.innerHTML = '';
  activos.forEach(a => {
    const opt = document.createElement('option');
    opt.value = `activo:${a.id}`;
    opt.textContent = `[Activo] ${a.codigo} - ${a.nombre}`;
    sel.appendChild(opt);
  });
  bienesControlados.forEach(b => {
    const opt = document.createElement('option');
    opt.value = `bien:${b.id}`;
    opt.textContent = `[Bien Controlado] ${b.codigo} - ${b.nombre}`;
    sel.appendChild(opt);
  });
  document.getElementById('modal-mantenimiento').classList.remove('hidden');
}

function handleMantenimientoSubmit(e) {
  e.preventDefault();
  const val = document.getElementById('maint-activo').value;
  const descripcion = document.getElementById('maint-descripcion').value;
  const reportadoPor = document.getElementById('maint-reportado').value;
  const costo = parseFloat(document.getElementById('maint-costo').value) || 0;

  mantenimientos.unshift({ id: 'm-' + Date.now(), val, descripcion, reportadoPor, costo, fecha: new Date().toLocaleDateString(), estado: 'Pendiente' });
  saveData();
  renderMantenimientos();
  document.getElementById('modal-mantenimiento').classList.add('hidden');
  showToast('Incidencia registrada.');
}

function renderMantenimientos() {
  const tbody = document.getElementById('mantenimiento-table-body');
  const empty = document.getElementById('mantenimiento-empty');
  tbody.innerHTML = '';

  if (mantenimientos.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  mantenimientos.forEach(m => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-700/30 transition border-b border-slate-700/40';
    tr.innerHTML = `
      <td class="px-5 py-3.5 text-slate-400">${m.fecha}</td>
      <td class="px-5 py-3.5 text-white font-medium">Elemento registrado</td>
      <td class="px-5 py-3.5 text-slate-300">${m.descripcion}</td>
      <td class="px-5 py-3.5 text-slate-300">${m.reportadoPor}</td>
      <td class="px-5 py-3.5 font-mono text-slate-200">₡${m.costo.toLocaleString()}</td>
      <td class="px-5 py-3.5"><span class="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400">${m.estado}</span></td>
      <td class="px-5 py-3.5 text-right">
        <button onclick="resolverMantenimiento('${m.id}')" class="px-2 py-1 bg-emerald-600 text-white rounded text-[11px]">Resolver</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function resolverMantenimiento(id) {
  mantenimientos = mantenimientos.filter(m => m.id !== id);
  saveData();
  renderMantenimientos();
  showToast('Incidencia resuelta.');
}

function openHistorial(id, tipo) {
  let elem = tipo === 'activo' ? activos.find(a => a.id === id) : bienesControlados.find(b => b.id === id);
  if (!elem) return;
  document.getElementById('h-codigo').textContent = elem.codigo;
  document.getElementById('h-nombre').textContent = elem.nombre;
  document.getElementById('h-aula').textContent = tipo === 'activo' ? `Pabellón ${elem.modulo === 47 ? 'Sur' : 'Central'} - ${elem.aulaId}` : `Custodio: ${elem.custodio}`;
  document.getElementById('modal-historial').classList.remove('hidden');
}

function handleGlobalSearch(e) {
  const q = e.target.value.toLowerCase();
  const res = document.getElementById('search-results');
  res.innerHTML = '';
  if (q.length < 2) {
    res.classList.add('hidden');
    return;
  }
  const matchBienes = bienesControlados.filter(b => b.codigo.toLowerCase().includes(q) || b.nombre.toLowerCase().includes(q));
  
  if (matchBienes.length === 0) {
    res.innerHTML = '<div class="p-3 text-xs text-slate-400 text-center">Sin resultados.</div>';
  } else {
    matchBienes.slice(0, 3).forEach(b => {
      const div = document.createElement('div');
      div.className = 'p-2.5 hover:bg-slate-700/50 cursor-pointer text-xs flex justify-between text-slate-200';
      div.innerHTML = `<span><b>${b.codigo}</b> - ${b.nombre} <span class="text-rose-400">(Control de Bienes)</span></span><span class="text-slate-400">${b.custodio}</span>`;
      div.onclick = () => {
        document.querySelector('[data-tab="tab-bienes-controlados"]').click();
        renderBienesControlados();
        res.classList.add('hidden');
      };
      res.appendChild(div);
    });
  }
  res.classList.remove('hidden');
}

function updateStats() {
  document.getElementById('stat-total-activos').textContent = activos.length;
  document.getElementById('stat-total-bienes').textContent = bienesControlados.length;
  document.getElementById('stat-pending-requests').textContent = solicitudes.filter(s => s.estado === 'Pendiente').length;
}

function renderCharts() {
  const catCtx = document.getElementById('chart-categorias').getContext('2d');
  const estCtx = document.getElementById('chart-estados').getContext('2d');
  const cats = { 'Tecnología': 5, 'Mobiliario': 3 };
  const ests = { Excelente: 6, Bueno: 2 };

  if (catChartInstance) catChartInstance.destroy();
  if (estadoChartInstance) estadoChartInstance.destroy();

  catChartInstance = new Chart(catCtx, {
    type: 'doughnut',
    data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } } }
  });

  estadoChartInstance = new Chart(estCtx, {
    type: 'bar',
    data: { labels: Object.keys(ests), datasets: [{ data: Object.values(ests), backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#f43f5e'], borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8', precision: 0 } } } }
  });
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 border border-brand-500/40 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-medium animate-fade-in flex items-center gap-2';
  t.innerHTML = `<i class="ph ph-check-circle text-brand-500 text-lg"></i><span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}