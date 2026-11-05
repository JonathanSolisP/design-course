const $ = (selector) => document.querySelector(selector);
let currentLabId = null;

async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: 'Bearer ' + token }),
    },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

function renderSession() {
  const user = JSON.parse(localStorage.getItem('user') ?? 'null');
  $('#login-section').hidden = Boolean(user);
  $('#reservations-section').hidden = !user;
  $('#session').innerHTML = user ? `${user.name} (${user.role}) · <a id="logout">Salir</a>` : '';
  if (user) {
    $('#logout').onclick = () => {
      localStorage.clear();
      renderSession();
    };
    loadReservations();
  }
}

async function loadLabs(search = '') {
  const labs = await api('/labs?search=' + encodeURIComponent(search));
  $('#labs').innerHTML = labs
    .map((lab) => `<li><a data-id="${lab.id}">${lab.name}</a> <span class="muted">${lab.building} · ${lab.capacity} personas</span></li>`)
    .join('');
  document.querySelectorAll('#labs a').forEach((a) => (a.onclick = () => openLab(a.dataset.id)));
}

async function openLab(id) {
  const lab = await api('/labs/' + id);
  currentLabId = lab.id;
  $('#lab-section').hidden = false;
  $('#lab-name').textContent = lab.name;
  $('#lab-description').textContent = lab.description ?? '';
  $('#comments').innerHTML =
    lab.comments.map((c) => `<li><strong>${c.author}:</strong> ${c.body}</li>`).join('') ||
    '<li class="muted">Sin comentarios</li>';
}

async function loadReservations() {
  const reservations = await api('/reservations');
  $('#reservations').innerHTML =
    reservations
      .map((r) => `<li>${r.lab} · ${r.date} de ${r.start_hour}:00 a ${r.end_hour}:00 <span class="muted">${r.purpose}</span></li>`)
      .join('') || '<li class="muted">No tiene reservas</li>';
}

$('#login-form').onsubmit = async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    const { token, user } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form)),
    });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    $('#login-error').textContent = '';
    renderSession();
  } catch (error) {
    $('#login-error').textContent = error.message;
  }
};

$('#search-form').onsubmit = (event) => {
  event.preventDefault();
  loadLabs(new FormData(event.target).get('search'));
};

$('#comment-form').onsubmit = async (event) => {
  event.preventDefault();
  const body = new FormData(event.target).get('body');
  await api(`/labs/${currentLabId}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
  event.target.reset();
  openLab(currentLabId);
};

renderSession();
loadLabs();
