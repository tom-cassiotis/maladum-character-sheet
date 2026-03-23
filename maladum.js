// ── Icon key derivation ───────────────────────────────────────────────────────
// Converts a skill name to its PNG filename: "Fleet of Foot" -> "fleet-of-foot"
function toIconKey(skillName) {
  return skillName.toLowerCase().replace(/\s+/g, '-');
}

// ── State ─────────────────────────────────────────────────────────────────────
let SKILLS_DATA = [];
let ICONS_DATA = [];
const selected = new Set();
const skillLevels = new Map(); // skill name -> levels to show: 1, 2, or 3
const selectedIcons = new Set(); // icon id -> selected

// ── Group data by category ────────────────────────────────────────────────────
function groupByCategory(data) {
  const map = new Map();
  for (const skill of data) {
    if (!map.has(skill.Category)) map.set(skill.Category, []);
    map.get(skill.Category).push(skill);
  }
  return map;
}

// ── Icon helper (selector panel) ─────────────────────────────────────────────
function iconEl(skillName) {
  const img = document.createElement('img');
  img.src = `assets/skills/${toIconKey(skillName)}.png`;
  img.alt = skillName;
  img.className = 'skill-icon';
  img.addEventListener('error', () => {
    const ph = document.createElement('div');
    ph.className = 'skill-icon-placeholder';
    ph.title = 'No icon available';
    ph.textContent = '?';
    img.replaceWith(ph);
  }, { once: true });
  return img;
}

// ── Build selector ────────────────────────────────────────────────────────────
function buildSelector() {
  const container = document.getElementById('skill-list-container');
  const grouped = groupByCategory(SKILLS_DATA);

  for (const [category, skills] of grouped) {
    const group = document.createElement('div');
    group.className = 'category-group';
    group.dataset.category = category;

    const catHeader = document.createElement('div');
    catHeader.className = 'category-header';
    catHeader.innerHTML = `<span>${category}</span><em class="chevron">&#9660;</em>`;
    catHeader.addEventListener('click', () => {
      group.classList.toggle('collapsed');
    });

    const skillList = document.createElement('div');
    skillList.className = 'skill-list';

    for (const skill of skills) {
      const row = document.createElement('div');
      row.className = 'skill-row';
      row.dataset.skill = skill.Skill;

      const icon = iconEl(skill.Skill);

      const nameWrap = document.createElement('div');
      nameWrap.className = 'skill-name-wrap';

      const name = document.createElement('span');
      name.className = 'skill-name';
      name.textContent = skill.Skill;

      const lvlBtns = document.createElement('div');
      lvlBtns.className = 'skill-level-btns';
      const lvlLabels = ['1', '1\u20132', '1\u20133'];
      [1, 2, 3].forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'skill-lvl-btn';
        btn.textContent = lvlLabels[n - 1];
        btn.dataset.levels = n;
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if (!selected.has(skill.Skill)) {
            selected.add(skill.Skill);
            row.classList.add('selected');
            updateCount();
          }
          skillLevels.set(skill.Skill, n);
          lvlBtns.querySelectorAll('.skill-lvl-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderTable();
          syncURL();
        });
        lvlBtns.appendChild(btn);
      });

      nameWrap.appendChild(name);
      nameWrap.appendChild(lvlBtns);

      row.appendChild(icon);
      row.appendChild(nameWrap);

      row.addEventListener('click', () => toggleSkill(skill.Skill, row, lvlBtns));
      skillList.appendChild(row);
    }

    group.appendChild(catHeader);
    group.appendChild(skillList);
    container.appendChild(group);
  }
}

// ── Toggle skill selection ────────────────────────────────────────────────────
function toggleSkill(skillName, rowEl, lvlBtns) {
  if (selected.has(skillName)) {
    selected.delete(skillName);
    skillLevels.delete(skillName);
    rowEl.classList.remove('selected');
    lvlBtns.querySelectorAll('.skill-lvl-btn').forEach(b => b.classList.remove('active'));
  } else {
    selected.add(skillName);
    skillLevels.set(skillName, 3);
    rowEl.classList.add('selected');
    const btns = lvlBtns.querySelectorAll('.skill-lvl-btn');
    btns.forEach(b => b.classList.remove('active'));
    btns[btns.length - 1].classList.add('active');
  }
  updateCount();
  renderTable();
  syncURL();
}

function updateCount() {
  const n = selected.size + selectedIcons.size;
  const tabBadge = document.getElementById('tab-count');
  if (tabBadge) tabBadge.textContent = n > 0 ? n : '';
}

function updateEmptyState() {
  const empty = document.getElementById('empty-state');
  if (empty) empty.style.display = (selected.size === 0 && selectedIcons.size === 0) ? '' : 'none';
}

// ── Mobile tab switching ──────────────────────────────────────────────────────
function switchMobileTab(panel) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === panel));
  document.querySelector('.selector-panel').classList.toggle('mobile-active', panel === 'selector');
  document.querySelector('.preview-panel').classList.toggle('mobile-active', panel === 'preview');
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchMobileTab(btn.dataset.panel));
});

// ── Render preview table ──────────────────────────────────────────────────────
function renderTable() {
  const tableWrap = document.getElementById('table-container');
  updateEmptyState();

  if (selected.size === 0) {
    tableWrap.style.display = 'none';
    return;
  }

  tableWrap.style.display = '';

  const grouped = groupByCategory(SKILLS_DATA);
  let html = '<div class="skills-table-wrap"><table class="skills-table">';

  for (const [category, skills] of grouped) {
    const catSkills = skills.filter(s => selected.has(s.Skill));
    if (catSkills.length === 0) continue;

    html += `<tbody><tr class="category-row"><td colspan="3">${category}</td></tr></tbody>`;

    for (const skill of catSkills) {
      const iconHtml = `<img src="assets/skills/${toIconKey(skill.Skill)}.png" alt="${skill.Skill}" class="tbl-icon-large">`;
      const numLevels = skillLevels.get(skill.Skill) || 3;
      const levels = [
        { label: 'Level 1', text: skill['Level 1 Action'] },
        { label: 'Level 2', text: skill['Level 2 Action'] },
        { label: 'Level 3', text: skill['Level 3 Action'] },
      ].slice(0, numLevels);

      html += '<tbody class="skill-body">';
      levels.forEach((lvl, i) => {
        const isFirst = i === 0;
        const isLast  = i === numLevels - 1;
        const rowClass = isLast ? 'skill-data-row skill-row-last' : 'skill-data-row';
        const identityCell = isFirst
          ? `<td class="skill-identity-cell" rowspan="${numLevels}">
               <span class="skill-name-label">${skill.Skill}</span>
               ${iconHtml}
             </td>`
          : '';
        html += `<tr class="${rowClass}">
          ${identityCell}
          <td class="level-cell"><span class="level-label">${lvl.label}</span></td>
          <td class="level-text"><span class="level-label level-label-mobile">${lvl.label}</span>${lvl.text}</td>
        </tr>`;
      });
      html += '</tbody>';
    }
  }

  html += '</table></div>';
  tableWrap.innerHTML = html;

  // Handle missing icons gracefully
  tableWrap.querySelectorAll('img.tbl-icon-large').forEach(img => {
    img.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'tbl-icon-ph';
      ph.textContent = '?';
      img.replaceWith(ph);
    }, { once: true });
  });
}

// ── Build icon selector ───────────────────────────────────────────────────────
function buildIconSelector() {
  const container = document.getElementById('icon-list-container');
  if (!ICONS_DATA.length) return;

  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'icons-section-header';
  sectionHeader.innerHTML = '<span>Icons Reference</span><em class="chevron">&#9660;</em>';
  sectionHeader.addEventListener('click', () => {
    container.classList.toggle('icons-collapsed');
  });

  const iconList = document.createElement('div');
  iconList.className = 'icon-selector-list';

  for (const icon of ICONS_DATA) {
    if (icon.disabled) continue;

    const row = document.createElement('div');
    row.className = 'icon-row';
    row.dataset.iconId = icon.id;

    const img = document.createElement('img');
    img.src = `assets/icons/${icon.id}.png`;
    img.alt = icon.name;
    img.className = 'selector-icon-img';
    img.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'selector-icon-ph';
      ph.textContent = '?';
      img.replaceWith(ph);
    }, { once: true });

    const name = document.createElement('span');
    name.className = 'icon-row-name';
    name.textContent = icon.name;

    row.appendChild(img);
    row.appendChild(name);

    row.addEventListener('click', () => {
      if (selectedIcons.has(icon.id)) {
        selectedIcons.delete(icon.id);
        row.classList.remove('selected');
      } else {
        selectedIcons.add(icon.id);
        row.classList.add('selected');
      }
      updateCount();
      renderIconsReference();
      syncURL();
    });

    iconList.appendChild(row);
  }

  container.appendChild(sectionHeader);
  container.appendChild(iconList);
}

// ── Render icons reference ────────────────────────────────────────────────────
function renderIconsReference() {
  const container = document.getElementById('icons-reference-container');
  updateEmptyState();

  if (selectedIcons.size === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  const icons = ICONS_DATA.filter(ic => selectedIcons.has(ic.id)).sort((a, b) => a.name.localeCompare(b.name));
  let html = '<div class="icons-reference">';
  html += '<div class="icons-ref-header">Icons Reference</div>';
  html += '<div class="icons-ref-grid">';
  for (const icon of icons) {
    html += `<div class="icon-ref-card">
      <img src="assets/icons/${icon.id}.png" alt="${icon.name}" class="icon-ref-img">
      <div class="icon-ref-content">
        <div class="icon-ref-name">${icon.name}</div>
        <div class="icon-ref-desc">${icon.description}</div>
      </div>
    </div>`;
  }
  html += '</div></div>';
  container.innerHTML = html;

  container.querySelectorAll('img.icon-ref-img').forEach(img => {
    img.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'icon-ref-img-ph';
      ph.textContent = '?';
      img.replaceWith(ph);
    }, { once: true });
  });
}

// ── Clear all ─────────────────────────────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', () => {
  selected.clear();
  skillLevels.clear();
  selectedIcons.clear();
  document.querySelectorAll('.skill-row.selected').forEach(r => r.classList.remove('selected'));
  document.querySelectorAll('.skill-lvl-btn.active').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.icon-row.selected').forEach(r => r.classList.remove('selected'));
  updateCount();
  renderTable();
  renderIconsReference();
  syncURL();
});

// ── URL state sync ────────────────────────────────────────────────────────────
function syncURL() {
  const skillParts = [];
  for (const [skillName, level] of skillLevels) {
    const idx = SKILLS_DATA.findIndex(s => s.Skill === skillName);
    if (idx !== -1) skillParts.push(`${idx}:${level}`);
  }
  const iconParts = [...selectedIcons];

  if (skillParts.length === 0 && iconParts.length === 0) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }
  let hash = '';
  if (skillParts.length > 0) hash += 's=' + skillParts.join(',');
  if (iconParts.length > 0) { if (hash) hash += '&'; hash += 'i=' + iconParts.join(','); }
  history.replaceState(null, '', '#' + hash);
}

function restoreFromURL() {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return;

  const params = {};
  hash.slice(1).split('&').forEach(part => {
    const eq = part.indexOf('=');
    if (eq > 0) params[part.slice(0, eq)] = part.slice(eq + 1);
  });

  if (params.s) {
    const parts = params.s.split(',');
    for (const part of parts) {
      const [idxStr, levelStr] = part.split(':');
      const idx = parseInt(idxStr, 10);
      const level = parseInt(levelStr, 10);
      if (isNaN(idx) || isNaN(level) || idx < 0 || idx >= SKILLS_DATA.length || level < 1 || level > 3) continue;
      const skillName = SKILLS_DATA[idx].Skill;
      const row = document.querySelector(`.skill-row[data-skill="${CSS.escape(skillName)}"]`);
      if (!row) continue;
      selected.add(skillName);
      skillLevels.set(skillName, level);
      row.classList.add('selected');
      const btns = row.querySelectorAll('.skill-lvl-btn');
      btns.forEach(b => b.classList.remove('active'));
      const targetBtn = [...btns].find(b => parseInt(b.dataset.levels, 10) === level);
      if (targetBtn) targetBtn.classList.add('active');
    }
  }

  if (params.i) {
    const iconIds = params.i.split(',');
    for (const iconId of iconIds) {
      const iconData = ICONS_DATA.find(ic => ic.id === iconId);
      if (!iconData || iconData.disabled) continue;
      const row = document.querySelector(`.icon-row[data-icon-id="${CSS.escape(iconId)}"]`);
      if (!row) continue;
      selectedIcons.add(iconId);
      row.classList.add('selected');
    }
  }

  if (selected.size > 0 || selectedIcons.size > 0) {
    updateCount();
    renderTable();
    renderIconsReference();
  }
}

// ── Init: fetch skills from JSON, then build UI ───────────────────────────────
async function init() {
  try {
    const resp = await fetch('maladum-skills.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    SKILLS_DATA = await resp.json();
  } catch (err) {
    const app = document.querySelector('.app');
    if (app) app.innerHTML = `
      <div style="padding:40px;font-family:Georgia,serif;color:#7c4f1e;max-width:520px;margin:0 auto;">
        <strong style="font-size:1.1rem;">&#9888; Could not load maladum-skills.json</strong>
        <p style="margin-top:12px;">This page must be served over HTTP. If you are opening the file directly in Chrome or Edge, use a local server instead:</p>
        <ul style="margin-top:10px;line-height:2;">
          <li>VS Code: install <em>Live Server</em> and click <em>Go Live</em></li>
          <li>Terminal: <code>npx serve .</code> then open <code>http://localhost:3000</code></li>
        </ul>
        <p style="margin-top:10px;color:#999;font-size:0.85rem;">Firefox can open the file directly without a server.</p>
      </div>`;
    return;
  }
  try {
    const resp = await fetch('icons.json');
    if (resp.ok) ICONS_DATA = await resp.json();
  } catch (err) {
    console.warn('Could not load icons.json:', err);
  }

  buildSelector();
  buildIconSelector();
  restoreFromURL();
}

init();
