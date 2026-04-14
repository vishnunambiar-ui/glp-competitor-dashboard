async function loadData() {
  const response = await fetch('data/dashboard_data.json');
  if (!response.ok) {
    throw new Error('Unable to load dashboard data');
  }
  return response.json();
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  return new Intl.NumberFormat().format(value);
}

function formatRating(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  return Number(value).toFixed(1);
}

function buildLeaderboard(rows) {
  const tbody = document.querySelector('#leaderboard-table tbody');
  tbody.innerHTML = rows.map(row => `
    <tr>
      <td><strong>${row.app}</strong></td>
      <td>${formatRating(row.ios_store_rating)}</td>
      <td>${formatNumber(row.ios_rating_count)}</td>
      <td>${formatRating(row.android_store_rating)}</td>
      <td>${formatNumber(row.android_rating_count)}</td>
      <td>${row.android_downloads || 'N/A'}</td>
      <td>${formatNumber(row.overall_review_count)}</td>
    </tr>
  `).join('');
}

function metricCard(label, value, note = '') {
  return `
    <div class="metric">
      <span class="label">${label}</span>
      <span class="value">${value}</span>
      ${note ? `<p class="metric-note">${note}</p>` : ''}
    </div>
  `;
}

function metricLine(label, value) {
  return `<div class="metric-line"><span>${label}</span><strong>${value}</strong></div>`;
}

function chips(items, key, valueKey = 'count') {
  if (!items || !items.length) {
    return '<p class="note-text">No review signal available yet.</p>';
  }
  return `<div class="chips">${items.map(item => `<span class="chip">${item[key]} ${item[valueKey] ? `(${item[valueKey]})` : ''}</span>`).join('')}</div>`;
}

function samples(items) {
  if (!items || !items.length) {
    return '<p class="note-text">No matching review samples in this export.</p>';
  }
  return items.map(item => `
    <div class="sample-card">
      <div class="review-meta">${item.platform} • ${item.rating || 'N/A'} stars</div>
      <p><strong>${item.title || 'Untitled review'}</strong></p>
      <p>${item.content || ''}</p>
    </div>
  `).join('');
}

function renderStoreVisuals(platformLabel, platformData, fallbackCopy) {
  const screenshots = platformData.screenshots || [];
  const icon = platformData.icon;
  if (!icon && !screenshots.length) {
    return `
      <div class="visual-card">
        <h3>${platformLabel} Store Visuals</h3>
        <p class="note-text">${fallbackCopy}</p>
      </div>
    `;
  }

  return `
    <div class="visual-card">
      <h3>${platformLabel} Store Visuals</h3>
      <div class="visual-strip">
        ${icon ? `<img class="store-icon" src="${icon}" alt="${platformLabel} app icon" loading="lazy">` : ''}
        ${screenshots.slice(0, 5).map(url => `<img class="store-shot" src="${url}" alt="${platformLabel} screenshot" loading="lazy">`).join('')}
      </div>
    </div>
  `;
}

function buildAppCards(apps) {
  const root = document.querySelector('#app-grid');
  const template = document.querySelector('#app-card-template');
  root.innerHTML = '';

  apps.forEach(app => {
    const node = template.content.cloneNode(true);
    node.querySelector('.app-name').textContent = 'Competitor';
    node.querySelector('.app-title').textContent = app.app;

    const links = node.querySelector('.store-links');
    if (app.urls.ios) links.insertAdjacentHTML('beforeend', `<a href="${app.urls.ios}" target="_blank" rel="noreferrer">App Store</a>`);
    if (app.urls.android) links.insertAdjacentHTML('beforeend', `<a href="${app.urls.android}" target="_blank" rel="noreferrer">Google Play</a>`);

    node.querySelector('.kpi-row').innerHTML = [
      metricCard('Public Reviews', formatNumber(app.overall.review_count)),
      metricCard('Avg Review Rating', formatRating(app.overall.avg_review_rating)),
      metricCard('Top Sentiment', Object.entries(app.overall.sentiment_breakdown || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'),
      metricCard('Android Installs', app.android.downloads || 'N/A', app.android.downloads_note || ''),
    ].join('');

    node.querySelector('.visuals-grid').innerHTML = `
      ${renderStoreVisuals('iOS', app.ios, 'Apple is currently exposing app artwork, but not screenshot galleries for this app in the public metadata feed.')}
      ${renderStoreVisuals('Android', app.android, 'No public Google Play screenshots available for this app right now.')}
    `;

    node.querySelector('.platform-grid').innerHTML = `
      <div class="platform-card">
        <h3>iOS</h3>
        ${metricLine('Store rating', formatRating(app.ios.store_rating))}
        ${metricLine('Store rating count', formatNumber(app.ios.store_rating_count))}
        ${metricLine('Exported reviews', formatNumber(app.ios.review_count))}
        ${metricLine('Avg review rating', formatRating(app.ios.avg_review_rating))}
      </div>
      <div class="platform-card">
        <h3>Android</h3>
        ${metricLine('Store rating', formatRating(app.android.store_rating))}
        ${metricLine('Store rating count', formatNumber(app.android.store_rating_count))}
        ${metricLine('Install band', app.android.downloads || 'N/A')}
        ${metricLine('Exported reviews', formatNumber(app.android.review_count))}
      </div>
    `;

    node.querySelector('.themes-grid').innerHTML = `
      <div class="theme-card">
        <h3>Top Themes</h3>
        ${chips(app.overall.top_themes, 'theme')}
      </div>
      <div class="theme-card">
        <h3>Top Keywords</h3>
        ${chips(app.overall.top_keywords, 'term')}
      </div>
    `;

    node.querySelector('.samples-grid').innerHTML = `
      <div>
        <h3>Sample Praise</h3>
        ${samples(app.overall.sample_praise)}
      </div>
      <div>
        <h3>Sample Issues</h3>
        ${samples(app.overall.sample_issues)}
      </div>
    `;

    root.appendChild(node);
  });
}

function populateFilters(reviews) {
  const apps = ['All apps', ...new Set(reviews.map(r => r.app))];
  const platforms = ['All platforms', ...new Set(reviews.map(r => r.platform))];
  const sentiments = ['All sentiments', ...new Set(reviews.map(r => r.sentiment))];

  const fill = (selector, items) => {
    const el = document.querySelector(selector);
    el.innerHTML = items.map(item => `<option value="${item}">${item}</option>`).join('');
  };

  fill('#app-filter', apps);
  fill('#platform-filter', platforms);
  fill('#sentiment-filter', sentiments);
}

function renderReviews(reviews) {
  const appValue = document.querySelector('#app-filter').value;
  const platformValue = document.querySelector('#platform-filter').value;
  const sentimentValue = document.querySelector('#sentiment-filter').value;
  const keywordValue = document.querySelector('#keyword-filter').value.trim().toLowerCase();

  const filtered = reviews.filter(review => {
    if (appValue !== 'All apps' && review.app !== appValue) return false;
    if (platformValue !== 'All platforms' && review.platform !== platformValue) return false;
    if (sentimentValue !== 'All sentiments' && review.sentiment !== sentimentValue) return false;
    if (keywordValue && !`${review.title || ''} ${review.content || ''}`.toLowerCase().includes(keywordValue)) return false;
    return true;
  }).slice(0, 120);

  const root = document.querySelector('#review-results');
  if (!filtered.length) {
    root.innerHTML = '<div class="empty-state">No reviews match the current filters.</div>';
    return;
  }

  root.innerHTML = filtered.map(review => `
    <article class="review-card">
      <header>
        <div>
          <strong>${review.title || review.app}</strong>
          <div class="review-meta">${review.app} • ${review.platform} • ${review.sentiment} • ${review.author || 'Anonymous'}</div>
        </div>
        <span class="rating-badge">${review.rating || 'N/A'}</span>
      </header>
      <p>${review.content || ''}</p>
      <div class="chips">${(review.themes || []).map(theme => `<span class="chip">${theme}</span>`).join('')}</div>
    </article>
  `).join('');
}

function wireFilters(reviews) {
  ['#app-filter', '#platform-filter', '#sentiment-filter', '#keyword-filter'].forEach(selector => {
    document.querySelector(selector).addEventListener('input', () => renderReviews(reviews));
  });
}

loadData().then(data => {
  document.querySelector('#generated-at').textContent = data.generated_at;
  document.querySelector('#notes-list').innerHTML = data.notes.map(note => `<li>${note}</li>`).join('');
  buildLeaderboard(data.leaderboard);
  buildAppCards(data.apps);
  populateFilters(data.reviews);
  wireFilters(data.reviews);
  renderReviews(data.reviews);
}).catch(error => {
  document.body.innerHTML = `<div class="page-shell"><div class="card"><h2>Dashboard failed to load</h2><p>${error.message}</p></div></div>`;
});
