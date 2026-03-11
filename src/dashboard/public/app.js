(function () {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const rewardsTableBody = document.getElementById('rewardsTableBody');
  const statTotal = document.getElementById('statTotal');
  const statClaimed = document.getElementById('statClaimed');
  const statUnclaimed = document.getElementById('statUnclaimed');
  const btnReload = document.getElementById('btnReload');
  const formAdd = document.getElementById('formAddReward');

  function switchPage(pageId) {
    pages.forEach((p) => p.classList.remove('active'));
    navItems.forEach((n) => n.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    const nav = document.querySelector('.nav-item[data-page="' + pageId + '"]');
    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');
    if (pageId === 'edit') {
      const rewardsNav = document.querySelector('.nav-item[data-page="rewards"]');
      if (rewardsNav) rewardsNav.classList.add('active');
    }
    if (pageId === 'logs') loadLogs();
  }

  navItems.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage(el.getAttribute('data-page'));
    });
  });

  function fetchRewards() {
    return fetch('/api/rewards').then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    });
  }

  function renderStats(data) {
    const total = data.rewards.length;
    const claimed = data.rewards.filter((r) => r.claimed).length;
    const unclaimed = total - claimed;
    statTotal.textContent = total;
    statClaimed.textContent = claimed;
    statUnclaimed.textContent = unclaimed;
  }

  function openEditForm(reward) {
    document.getElementById('editId').value = reward.id;
    document.getElementById('editIdDisplay').textContent = reward.id;
    document.getElementById('editLabel').value = reward.label;
    document.getElementById('editType').value = reward.type;
    document.getElementById('editPayload').value = reward.payload;
    document.getElementById('editUserId').value = reward.assignedUserId;
    switchPage('edit');
  }

  function renderTable(data) {
    if (!rewardsTableBody) return;
    rewardsTableBody.innerHTML = data.rewards
      .map(
        (r) => `
      <tr>
        <td><code>${escapeHtml(r.id)}</code></td>
        <td>${escapeHtml(r.label)}</td>
        <td>${escapeHtml(r.type)}</td>
        <td><code>${escapeHtml(r.assignedUserId)}</code></td>
        <td><span class="badge ${r.claimed ? 'badge-claimed' : 'badge-unclaimed'}">${r.claimed ? 'Claimed' : 'Unclaimed'}</span></td>
        <td>
          <button type="button" class="btn btn-edit btn-edit-row" data-id="${escapeHtml(r.id)}">Edit</button>
          <button type="button" class="btn btn-danger btn-delete" data-id="${escapeHtml(r.id)}">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');

    rewardsTableBody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => deleteReward(btn.getAttribute('data-id')));
    });
    rewardsTableBody.querySelectorAll('.btn-edit-row').forEach((btn) => {
      const id = btn.getAttribute('data-id');
      const reward = data.rewards.find((r) => r.id === id);
      if (reward) btn.addEventListener('click', () => openEditForm(reward));
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  function actionLabel(action) {
    const labels = {
      reward_created: 'Created',
      reward_updated: 'Updated',
      reward_deleted: 'Deleted',
      reward_claimed: 'Claimed',
      config_reloaded: 'Config reloaded',
    };
    return labels[action] || action;
  }

  function formatLogDetails(entry) {
    const parts = [];
    if (entry.label) parts.push('Label: ' + entry.label);
    if (entry.userId) parts.push('User ID: ' + entry.userId);
    if (entry.username) parts.push('@' + entry.username);
    if (entry.details) parts.push(entry.details);
    return parts.join(' · ') || '—';
  }

  function loadLogs() {
    fetch('/api/logs?limit=200')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data) => {
        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;
        if (!data.logs || !data.logs.length) {
          tbody.innerHTML = '<tr><td colspan="4">No logs yet.</td></tr>';
          return;
        }
        tbody.innerHTML = data.logs
          .map(
            (e) => `
          <tr>
            <td>${escapeHtml(new Date(e.time).toLocaleString())}</td>
            <td>${escapeHtml(actionLabel(e.action))}</td>
            <td><code>${escapeHtml(e.rewardId || '—')}</code></td>
            <td class="log-details">${escapeHtml(formatLogDetails(e))}</td>
          </tr>
        `
          )
          .join('');
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load logs: ' + err.message);
      });
  }

  function load() {
    fetchRewards()
      .then((data) => {
        renderStats(data);
        renderTable(data);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load data: ' + err.message);
      });
  }

  btnReload.addEventListener('click', () => {
    btnReload.disabled = true;
    fetch('/api/reload', { method: 'POST' })
      .then((r) => (r.ok ? load() : r.json().then((e) => Promise.reject(e.error))))
      .then(() => { btnReload.disabled = false; })
      .catch((err) => {
        btnReload.disabled = false;
        alert('Reload failed: ' + (err || 'Unknown error'));
      });
  });

  function deleteReward(id) {
    if (!confirm('Delete reward "' + id + '"?')) return;
    fetch('/api/rewards/' + encodeURIComponent(id), { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        load();
      })
      .catch((err) => alert('Delete failed: ' + err));
  }

  const formEdit = document.getElementById('formEditReward');
  const editCancel = document.getElementById('editCancel');
  if (formEdit) {
    formEdit.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editId').value;
      const body = {
        label: document.getElementById('editLabel').value.trim(),
        type: document.getElementById('editType').value,
        payload: document.getElementById('editPayload').value.trim(),
        assignedUserId: document.getElementById('editUserId').value.trim(),
      };
      fetch('/api/rewards/' + encodeURIComponent(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
        .then(({ ok, data }) => {
          if (ok) {
            load();
            switchPage('rewards');
          } else {
            alert(data.error || 'Failed to update reward');
          }
        })
        .catch((err) => alert('Error: ' + err.message));
    });
  }
  if (editCancel) {
    editCancel.addEventListener('click', () => switchPage('rewards'));
  }
  const editDelete = document.getElementById('editDelete');
  if (editDelete) {
    editDelete.addEventListener('click', () => {
      const id = document.getElementById('editId').value;
      if (!id) return;
      if (!confirm('Delete reward "' + id + '"? This cannot be undone.')) return;
      fetch('/api/rewards/' + encodeURIComponent(id), { method: 'DELETE' })
        .then((r) => {
          if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
          load();
          switchPage('rewards');
        })
        .catch((err) => alert('Delete failed: ' + err));
    });
  }

  const logsRefresh = document.getElementById('logsRefresh');
  if (logsRefresh) logsRefresh.addEventListener('click', loadLogs);

  formAdd.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formAdd);
    const body = {
      id: fd.get('id').trim(),
      label: fd.get('label').trim(),
      type: fd.get('type'),
      payload: fd.get('payload').trim(),
      assignedUserId: fd.get('assignedUserId').trim(),
    };
    fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          formAdd.reset();
          load();
          switchPage('rewards');
        } else {
          alert(data.error || 'Failed to add reward');
        }
      })
      .catch((err) => alert('Error: ' + err.message));
  });

  load();
})();
