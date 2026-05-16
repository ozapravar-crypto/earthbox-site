// ─────────────────────────────────────────────────────────────────────
// render-about.js · About page sections
// Simple vertical layout · no number indices · founder side-by-side.
// ─────────────────────────────────────────────────────────────────────

import { sections, closingStatement } from '../data/about.js';


function renderSection(s){
  const body = (s.body || []).map(p => `<p>${p}</p>`).join('');

  let extra = '';

  if (s.steps){
    extra = `
      <ol class="about-steps">
        ${s.steps.map(st => `
          <li>
            <span class="step-n">${st.n}</span>
            <span class="step-text">${st.text}</span>
          </li>
        `).join('')}
      </ol>
    `;
  }

  if (s.person){
    const p = s.person;
    extra = `
      <div class="founder-split">
        <div class="founder-image">
          <img src="assets/founder.webp"
               alt="Aayush Lilani in his Kandivali studio with terrariums"
               loading="lazy"/>
        </div>
        <div class="founder-info">
          <div class="founder-name">${p.name}</div>
          <div class="founder-role caption">${p.role}</div>
          <p class="founder-bio italic">${p.bio}</p>
          <div class="founder-location italic">${p.location}</div>
        </div>
      </div>
    `;
  }

  if (s.table){
    extra = `
      <dl class="kv-table">
        ${s.table.map(r => `
          <div>
            <dt class="caption">${r.key}</dt>
            <dd>${r.value}</dd>
          </div>
        `).join('')}
      </dl>
    `;
  }

  if (s.contact){
    extra = `
      <dl class="kv-table">
        ${s.contact.map(r => `
          <div>
            <dt class="caption">${r.key}</dt>
            <dd>${r.value}</dd>
          </div>
        `).join('')}
      </dl>
    `;
  }

  return `
    <section class="about-section reveal">
      <header class="about-section-head">
        <h2 class="about-title">${s.title}</h2>
      </header>
      <div class="about-body">
        ${body}
        ${extra}
      </div>
    </section>
  `;
}


export function initAbout(){
  const host = document.getElementById('aboutSections');
  if (!host) return;

  host.innerHTML = sections.map(renderSection).join('');

  const close = document.getElementById('aboutClosing');
  if (close) close.textContent = closingStatement;
}
