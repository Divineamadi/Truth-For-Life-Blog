// scripts/app.js
document.addEventListener('DOMContentLoaded', () => {
  // footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  const page = document.body.dataset.page;
  if (page === 'home') initHome();
  if (page === 'article') initArticle();
});

const DATA_URL = 'data/articles.json';

// ---------- Home ----------
function initHome() {
  const listEl = document.getElementById('article-list');
  const emptyEl = document.getElementById('list-empty');
  const errEl = document.getElementById('list-error');
  const loadMoreBtn = document.getElementById('load-more');
  const searchEl = document.getElementById('search');
  const chipRow = document.querySelector('.chip-row');

  if (!listEl) return;

  const state = {
    all: [],
    filtered: [],
    page: 1,
    perPage: 8,
    filter: 'all',
    query: ''
  };

  fetch(DATA_URL)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(articles => {
      state.all = Array.isArray(articles) ? articles : [];
      // newest first (if date present)
      state.all.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      applyFilters();
    })
    .catch(err => {
      console.error(err);
      if (errEl) errEl.textContent = 'Could not load articles. Check that /data/articles.json exists and you’re running a local server.';
    });

  function catsOf(a) {
    // supports "life, faith" or ["life","faith"] or "life"
    const raw = a.category ?? a.categories ?? '';
    if (Array.isArray(raw)) return raw.map(c => String(c).toLowerCase().trim()).filter(Boolean);
    return String(raw)
      .split(',')
      .map(c => c.toLowerCase().trim())
      .filter(Boolean);
  }

  function applyFilters() {
    const q = state.query.trim().toLowerCase();
    const cat = state.filter;
    state.filtered = state.all.filter(a => {
      const inCat = cat === 'all' ? true : catsOf(a).includes(cat);
      const inText = !q ? true : (
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.summary && a.summary.toLowerCase().includes(q))
      );
      return inCat && inText;
    });
    state.page = 1;
    render();
  }

  function render() {
    listEl.innerHTML = '';
    const end = state.page * state.perPage;
    const slice = state.filtered.slice(0, end);
    slice.forEach(a => listEl.appendChild(renderCard(a)));
    emptyEl?.classList.toggle('hidden', slice.length > 0);
    if (loadMoreBtn) loadMoreBtn.style.display = state.filtered.length > end ? 'inline-block' : 'none';
  }

  function renderCard(a) {
    const el = document.createElement('a');
    el.className = 'card';
    const date = a.date ? new Date(a.date).toLocaleDateString() : '';
    const slug = encodeURIComponent(a.slug ?? a.id ?? '');
    el.href = `article.html?slug=${slug}`;
    el.innerHTML = `
      <h3>${escapeHTML(a.title || 'Untitled')}</h3>
      <p>${escapeHTML(a.summary || '')}</p>
      <small>${escapeHTML((Array.isArray(a.category) ? a.category.join(', ') : a.category) || '')}${date ? ' • ' + date : ''}</small>
    `;
    return el;
  }

  // search
  searchEl?.addEventListener('input', (e) => {
    state.query = e.target.value || '';
    applyFilters();
  });

  // category chips
  chipRow?.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    chipRow.querySelectorAll('.chip').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    state.filter = btn.dataset.filter || 'all';
    applyFilters();
  });

  // load more
  loadMoreBtn?.addEventListener('click', () => {
    state.page += 1;
    render();
  });
}

// ---------- Article ----------
function initArticle() {
  const params = new URLSearchParams(location.search);
  const key = params.get('slug') || params.get('id');

  const titleEl = document.getElementById('post-title');
  const authorEl = document.getElementById('post-author');
  const dateEl = document.getElementById('post-date');
  const readEl = document.getElementById('post-readtime');
  const contentEl = document.getElementById('post-content');
  const authorNameEl = document.getElementById('author-name');
  const authorBioEl = document.getElementById('author-bio');

  if (!key) {
    titleEl && (titleEl.textContent = 'Article Not Found');
    contentEl && (contentEl.innerHTML = '<p>Missing ?slug= in the URL. Go back and choose an article.</p>');
    return;
  }

  fetch(DATA_URL)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(articles => {
      const a = (Array.isArray(articles) ? articles : []).find(x =>
        String(x.slug ?? x.id) === String(key)
      );
      if (!a) {
        titleEl && (titleEl.textContent = 'Article Not Found');
        contentEl && (contentEl.innerHTML = '<p>We couldn’t find that article.</p>');
        return;
      }

      document.title = `${a.title} • Truth For Life`;
      titleEl && (titleEl.textContent = a.title || 'Untitled');

      // author can be a string or {name, bio}
      const authorName = typeof a.author === 'string' ? a.author : (a.author?.name || '');
      const authorBio = typeof a.author === 'object' ? (a.author?.bio || '') : '';

      if (authorEl) authorEl.textContent = authorName;
      if (authorNameEl) authorNameEl.textContent = authorName;
      if (authorBioEl) authorBioEl.textContent = authorBio;

      if (a.date && dateEl) dateEl.textContent = new Date(a.date).toLocaleDateString();

      const rt = (typeof a.readTime === 'number') ? `${a.readTime} min read`
              : (typeof a.readTime === 'string' ? a.readTime : '');
      if (rt && readEl) readEl.textContent = rt;

      // Related articles
const relatedList = document.getElementById("related-list");

function normalizeCats(cat) {
  if (Array.isArray(cat)) return cat.map(c => String(c).toLowerCase().trim());
  if (typeof cat === "string") return cat.split(",").map(c => c.toLowerCase().trim());
  return [];
}

const currentCats = normalizeCats(a.category);
if (currentCats.length > 0) {
  const related = articles.filter(x => {
    const otherCats = normalizeCats(x.category);
    return otherCats.some(c => currentCats.includes(c)) &&
           String(x.slug || x.id) !== String(a.slug || a.id);
  }).slice(0, 3);

  if (related.length > 0) {
    relatedList.innerHTML = related.map(r => `
      <a href="article.html?slug=${encodeURIComponent(r.slug || r.id)}" class="card">
        <h3>${r.title}</h3>
        <p>${r.summary || ""}</p>
      </a>
    `).join("");
  } else {
    relatedList.innerHTML = "<p>No related articles found.</p>";
  }
} else {
  relatedList.innerHTML = "<p>No related articles found.</p>";
}





      // Build content HTML (supports contentHTML or structured content[])
      let html = '';
      if (a.contentHTML) html += a.contentHTML;

      if (Array.isArray(a.content)) {
        a.content.forEach(block => {
          if (block.type === 'text' && block.data) {
            html += `<p>${escapeHTML(block.data)}</p>`;
          } else if (block.type === 'image' && block.src) {
            const alt = escapeHTML(block.alt || '');
            html += `<img src="${block.src}" alt="${alt}" />`;
          }
        });
      }

      // prepend hero image if provided
      if (a.heroImage) {
        const safeAlt = escapeHTML(a.title || '');
        html = `<figure class="post-hero"><img src="${a.heroImage}" alt="${safeAlt}"></figure>` + html;
      }

      if (contentEl) contentEl.innerHTML = html || '<p>—</p>';
    })
    .catch(err => {
      console.error(err);
      if (contentEl) contentEl.innerHTML = '<p class="error">Could not load article. Ensure /data/articles.json exists and you are running a local server.</p>';
    });
}

// ---------- Utils ----------
function escapeHTML(s = '') {
  return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}













// script.js
/*fetch('articles.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('articles-container');

    data.forEach(article => {
      const card = document.createElement('a');
      card.className = 'article-card';
      card.href = `article.html?id=${article.id}`; // ✅ Corrected link
      card.innerHTML = `<h2>${article.title}</h2><p>${article.summary}</p>`;
      container.appendChild(card);
    });
  })
  .catch(error => {
    console.error("Error loading articles:", error);
  });*/


