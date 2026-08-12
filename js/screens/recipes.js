/* ============================================================
   SafeCook Pro — Recipes Screen
   Veg & Non-Veg Cooking Recipes with Safety Tips
   ============================================================ */

Router.register('recipes', function() {
  var all = MockData.recipes;
  var vegCards = Recipes._renderCards(all.filter(function(r){ return r.type === 'veg'; }), 'veg');
  return (
    '<div class="recipes-screen" role="main" id="recipes-root">' +
    '<div class="recipes-header">' +
      '<div class="recipes-header-row">' +
        '<div>' +
          '<h1 class="t-h3" style="font-weight:800">🍳 Recipes</h1>' +
          '<p class="t-sm" style="color:var(--text-secondary);margin-top:2px">Safe cooking with SafeCook Pro</p>' +
        '</div>' +
        '<button class="recipes-search-btn" onclick="Recipes.openSearch()" aria-label="Search recipes">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">' +
            '<circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="recipe-tabs" role="tablist">' +
        '<button class="recipe-tab active" id="tab-veg" role="tab" aria-selected="true" onclick="Recipes.switchTab(\'veg\', this)">' +
          '<span class="tab-dot veg-dot"></span>🥦 Vegetarian' +
        '</button>' +
        '<button class="recipe-tab" id="tab-nonveg" role="tab" aria-selected="false" onclick="Recipes.switchTab(\'nonveg\', this)">' +
          '<span class="tab-dot nonveg-dot"></span>🍗 Non-Veg' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="recipe-chips-wrap">' +
      '<div class="recipe-chips" id="recipe-chips">' +
        '<button class="recipe-chip active" onclick="Recipes.filterCategory(\'all\', this)" id="chip-all">All</button>' +
        '<button class="recipe-chip" onclick="Recipes.filterCategory(\'breakfast\', this)" id="chip-breakfast">🌅 Breakfast</button>' +
        '<button class="recipe-chip" onclick="Recipes.filterCategory(\'lunch\', this)" id="chip-lunch">🍱 Lunch</button>' +
        '<button class="recipe-chip" onclick="Recipes.filterCategory(\'dinner\', this)" id="chip-dinner">🌙 Dinner</button>' +
        '<button class="recipe-chip" onclick="Recipes.filterCategory(\'snack\', this)" id="chip-snack">🍿 Snack</button>' +
        '<button class="recipe-chip" onclick="Recipes.filterCategory(\'dessert\', this)" id="chip-dessert">🍮 Dessert</button>' +
      '</div>' +
    '</div>' +
    '<div class="recipes-body">' +
      '<div id="recipe-list" role="tabpanel" class="recipe-grid">' +
      vegCards +
      '</div>' +
    '</div>' +
    '</div>' +
    '<div class="recipe-modal-overlay hidden" id="recipe-modal-overlay" onclick="Recipes.closeDetail(event)">' +
      '<div class="recipe-modal" id="recipe-modal" role="dialog" aria-modal="true">' +
        '<div id="recipe-modal-content"></div>' +
      '</div>' +
    '</div>'
  );
});

/* ── Recipes Controller ── */
var Recipes = (function() {
  var _tab = 'veg';
  var _cat = 'all';

  function _getDots(difficulty) {
    var n = { Easy: 1, Medium: 2, Hard: 3 }[difficulty] || 1;
    return '●'.repeat(n) + '○'.repeat(3 - n);
  }

  function _renderCards(list, tab) {
    if (!list || list.length === 0) {
      return '<div class="recipe-empty"><div style="font-size:3rem">🍽️</div><div style="font-size:1rem;font-weight:600;margin-top:8px">No recipes found</div><div style="font-size:0.875rem;color:var(--text-secondary);margin-top:4px">Try a different filter</div></div>';
    }
    return list.map(function(r, i) {
      var cardClass = tab === 'veg' ? 'recipe-card-veg' : 'recipe-card-nonveg';
      var badgeClass = tab === 'veg' ? 'badge-veg' : 'badge-nonveg';
      var badgeText  = tab === 'veg' ? '🌿 Veg' : '🍖 Non-Veg';
      return (
        '<div class="recipe-card ' + cardClass + '" onclick="Recipes.openDetail(' + r.id + ')" role="button" tabindex="0" id="recipe-card-' + r.id + '" style="animation-delay:' + (i * 55) + 'ms">' +
          '<div class="recipe-card-thumb">' +
            '<div class="recipe-thumb-emoji">' + r.emoji + '</div>' +
            '<div class="recipe-type-badge ' + badgeClass + '">' + badgeText + '</div>' +
            '<div class="recipe-card-meta-overlay">' +
              '<span class="recipe-meta-pill">⏱ ' + r.time + '</span>' +
              '<span class="recipe-meta-pill">🔥 ' + r.flameLevel + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="recipe-card-body">' +
            '<div class="recipe-card-category">' + (r.category.charAt(0).toUpperCase() + r.category.slice(1)) + '</div>' +
            '<h3 class="recipe-card-name">' + r.name + '</h3>' +
            '<p class="recipe-card-desc">' + r.tagline + '</p>' +
            '<div class="recipe-card-footer">' +
              '<div class="recipe-difficulty difficulty-' + r.difficulty.toLowerCase() + '">' + _getDots(r.difficulty) + ' ' + r.difficulty + '</div>' +
              '<div class="recipe-servings">👤 ' + r.servings + '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function switchTab(tab, btn) {
    _tab = tab; _cat = 'all';
    document.querySelectorAll('.recipe-tab').forEach(function(t) {
      t.classList.remove('active'); t.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
    document.querySelectorAll('.recipe-chip').forEach(function(c) { c.classList.remove('active'); });
    var ac = document.getElementById('chip-all');
    if (ac) ac.classList.add('active');
    var list = document.getElementById('recipe-list');
    if (list) list.innerHTML = _renderCards(MockData.recipes.filter(function(r) { return r.type === tab; }), tab);
  }

  function filterCategory(cat, btn) {
    _cat = cat;
    document.querySelectorAll('.recipe-chip').forEach(function(c) { c.classList.remove('active'); });
    btn.classList.add('active');
    var list = document.getElementById('recipe-list');
    if (list) {
      var filtered = MockData.recipes.filter(function(r) { return r.type === _tab; });
      if (cat !== 'all') filtered = filtered.filter(function(r) { return r.category === cat; });
      list.innerHTML = _renderCards(filtered, _tab);
    }
  }

  function openDetail(id) {
    var r = MockData.recipes.find(function(x) { return x.id === id; });
    if (!r) return;
    var isVeg = r.type === 'veg';
    var ingHTML = r.ingredients.map(function(ing) {
      return '<div class="ingredient-item"><div class="ingredient-dot ' + (isVeg ? 'ing-veg' : 'ing-nonveg') + '"></div><span class="ingredient-name">' + ing.name + '</span><span class="ingredient-qty">' + ing.qty + '</span></div>';
    }).join('');
    var stepsHTML = r.steps.map(function(step, idx) {
      return '<div class="step-item"><div class="step-number ' + (isVeg ? 'step-veg' : 'step-nonveg') + '">' + (idx + 1) + '</div><div class="step-text">' + step + '</div></div>';
    }).join('');
    var nutHTML = Object.keys(r.nutrition).map(function(k) {
      return '<div class="nutrition-item"><div class="nutrition-val">' + r.nutrition[k] + '</div><div class="nutrition-key">' + k + '</div></div>';
    }).join('');
    var hdr = isVeg ? 'detail-header-veg' : 'detail-header-nonveg';
    var badge = isVeg ? 'badge-veg' : 'badge-nonveg';
    var badgeTxt = isVeg ? '🌿 Vegetarian' : '🍖 Non-Vegetarian';
    var stepCls = isVeg ? 'step-veg' : 'step-nonveg';
    var mc = document.getElementById('recipe-modal-content');
    if (mc) {
      mc.innerHTML =
        '<div class="recipe-detail">' +
        '<div class="recipe-detail-header ' + hdr + '">' +
          '<button class="recipe-detail-close" onclick="Recipes.closeDetail(null)" aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">' +
            '<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg></button>' +
          '<div class="recipe-detail-emoji">' + r.emoji + '</div>' +
          '<div class="recipe-detail-badge ' + badge + '">' + badgeTxt + '</div>' +
          '<h2 class="recipe-detail-name">' + r.name + '</h2>' +
          '<p class="recipe-detail-tagline">' + r.tagline + '</p>' +
          '<div class="recipe-detail-stats">' +
            '<div class="detail-stat"><span class="detail-stat-val">⏱ ' + r.time + '</span><span class="detail-stat-label">Time</span></div>' +
            '<div class="detail-stat-div"></div>' +
            '<div class="detail-stat"><span class="detail-stat-val">👤 ' + r.servings + '</span><span class="detail-stat-label">Serves</span></div>' +
            '<div class="detail-stat-div"></div>' +
            '<div class="detail-stat"><span class="detail-stat-val">' + r.difficulty + '</span><span class="detail-stat-label">Level</span></div>' +
            '<div class="detail-stat-div"></div>' +
            '<div class="detail-stat"><span class="detail-stat-val">🔥 ' + r.flameLevel + '</span><span class="detail-stat-label">Gas</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="recipe-detail-body">' +
          '<div class="recipe-safety-alert">' +
            '<div class="safety-alert-icon">🛡️</div>' +
            '<div><div style="font-weight:700;font-size:0.875rem;margin-bottom:2px">SafeCook Safety Tip</div>' +
            '<div style="font-size:0.8125rem;color:var(--text-secondary);line-height:1.5">' + r.safetyTip + '</div></div>' +
          '</div>' +
          '<div class="recipe-section"><h3 class="recipe-section-title">🛒 Ingredients</h3><div class="ingredient-list">' + ingHTML + '</div></div>' +
          '<div class="recipe-section"><h3 class="recipe-section-title">👨‍🍳 Instructions</h3><div class="steps-list">' + stepsHTML + '</div></div>' +
          '<div class="recipe-section"><h3 class="recipe-section-title">📊 Nutrition (per serving)</h3><div class="nutrition-grid">' + nutHTML + '</div></div>' +
          '<div class="chef-tip-card">' +
            '<div class="chef-tip-header"><span>👨‍🍳</span><span style="font-weight:700">Chef\'s Tip</span></div>' +
            '<p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.6;margin-top:8px">' + r.chefTip + '</p>' +
          '</div>' +
        '</div>' +
        '</div>';
    }
    var overlay = document.getElementById('recipe-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      requestAnimationFrame(function() { overlay.classList.add('active'); });
    }
  }

  function closeDetail(e) {
    if (e && e.target !== document.getElementById('recipe-modal-overlay')) return;
    var overlay = document.getElementById('recipe-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(function() { overlay.classList.add('hidden'); }, 300);
    }
  }

  function openSearch() {
    if (typeof Components !== 'undefined') Components.toast('Recipe search coming soon!', 'info');
  }

  return { switchTab: switchTab, filterCategory: filterCategory, openDetail: openDetail, closeDetail: closeDetail, openSearch: openSearch, _renderCards: _renderCards };
})();

window.Recipes = Recipes;