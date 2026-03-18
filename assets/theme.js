// CALI K9 — SHOPIFY THEME JS
document.addEventListener('DOMContentLoaded', function() {

  // === NAV MOBILE ===
  var mobileBtn = document.querySelector('.nav-mobile-btn');
  var drawer = document.querySelector('.nav-drawer');
  if (mobileBtn && drawer) {
    mobileBtn.addEventListener('click', function() {
      drawer.classList.toggle('open');
      var isOpen = drawer.classList.contains('open');
      mobileBtn.innerHTML = isOpen
        ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        : '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  }

  // === PROGRAMS DROPDOWN ===
  document.querySelectorAll('.nav-has-dropdown').forEach(function(wrap) {
    var btn = wrap.querySelector('button');
    var dropdown = wrap.querySelector('.nav-dropdown');
    var chevron = wrap.querySelector('.nav-chevron');
    if (btn && dropdown) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        if (chevron) chevron.classList.toggle('open');
      });
    }
  });
  document.addEventListener('click', function() {
    document.querySelectorAll('.nav-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
    document.querySelectorAll('.nav-chevron.open').forEach(function(c) { c.classList.remove('open'); });
  });

  // === CART DRAWER ===
  var cartDrawer = document.querySelector('.cart-drawer');
  var cartOverlay = document.querySelector('.cart-overlay');
  var cartItemsEl = document.querySelector('.cart-items');
  var cartSubtotalEl = document.querySelector('.cart-subtotal-val');
  var cartCountEls = document.querySelectorAll('.cart-count');

  function openCart() {
    fetchCart();
    if (cartDrawer) cartDrawer.classList.add('open');
    if (cartOverlay) cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (cartOverlay) cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-cart]').forEach(function(btn) {
    btn.addEventListener('click', openCart);
  });
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  document.querySelectorAll('[data-close-cart]').forEach(function(btn) {
    btn.addEventListener('click', closeCart);
  });

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function updateCartCount(count) {
    cartCountEls.forEach(function(el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function fetchCart() {
    fetch('/cart.js').then(function(r) { return r.json(); }).then(function(cart) {
      updateCartCount(cart.item_count);
      renderCartItems(cart);
    }).catch(function() {});
  }

  function renderCartItems(cart) {
    if (!cartItemsEl) return;
    if (cart.item_count === 0) {
      cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.<br><br><a href="/collections/all" style="color:var(--blue);font-family:var(--font-cond);font-weight:700;">Shop Now</a></div>';
      if (cartSubtotalEl) cartSubtotalEl.textContent = '$0.00';
      return;
    }
    cartItemsEl.innerHTML = cart.items.map(function(item) {
      return '<div class="cart-item" data-key="' + item.key + '">' +
        '<img class="cart-item-img" src="' + (item.image ? item.image : '') + '" alt="' + item.title + '">' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-title">' + item.title + '</div>' +
          '<div class="cart-item-price">' + formatMoney(item.final_line_price) + '</div>' +
          '<div class="cart-item-qty">' +
            '<button class="qty-btn" data-action="decrease" data-key="' + item.key + '">\u2212</button>' +
            '<span class="qty-val">' + item.quantity + '</span>' +
            '<button class="qty-btn" data-action="increase" data-key="' + item.key + '" data-qty="' + item.quantity + '">+</button>' +
          '</div>' +
        '</div>' +
        '<button class="cart-remove" data-key="' + item.key + '" aria-label="Remove">\u00d7</button>' +
      '</div>';
    }).join('');
    if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(cart.total_price);

    cartItemsEl.querySelectorAll('.qty-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.dataset.key;
        var action = this.dataset.action;
        var itemEl = this.closest('.cart-item');
        var qtyEl = itemEl.querySelector('.qty-val');
        var qty = parseInt(qtyEl.textContent);
        var newQty = action === 'increase' ? qty + 1 : Math.max(0, qty - 1);
        fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: newQty })
        }).then(function(r) { return r.json(); }).then(function(cart) {
          updateCartCount(cart.item_count);
          renderCartItems(cart);
        });
      });
    });

    cartItemsEl.querySelectorAll('.cart-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var key = this.dataset.key;
        fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: 0 })
        }).then(function(r) { return r.json(); }).then(function(cart) {
          updateCartCount(cart.item_count);
          renderCartItems(cart);
        });
      });
    });
  }

  // === ADD TO CART (AJAX) ===
  document.querySelectorAll('form[data-ajax-cart]').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var orig = btn ? btn.textContent : '';
      if (btn) { btn.textContent = 'Adding...'; btn.disabled = true; }
      var data = new FormData(form);
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.get('id'), quantity: parseInt(data.get('quantity') || 1) })
      }).then(function(r) { return r.json(); }).then(function() {
        if (btn) { btn.textContent = 'Added!'; }
        fetchCart();
        openCart();
        setTimeout(function() {
          if (btn) { btn.textContent = orig; btn.disabled = false; }
        }, 2000);
      }).catch(function() {
        if (btn) { btn.textContent = orig; btn.disabled = false; }
      });
    });
  });

  // === SCROLL REVEAL ===
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el) { revealObs.observe(el); });

    // === COUNT UP ===
    var countObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.dataset.target || '0');
        var suffix = el.dataset.suffix || '';
        var duration = 1500;
        var startTime = performance.now();
        function tick(now) {
          var p = Math.min((now - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Number.isInteger(target) ? Math.round(eased * target) : (eased * target).toFixed(1);
          el.textContent = val + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        countObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.count-up[data-target]').forEach(function(el) { countObs.observe(el); });
  }

  // === CELEBRITY BADGES ===
  var activeWrap = null;
  document.querySelectorAll('.celeb-badge-wrap').forEach(function(wrap) {
    if (!wrap.querySelector('.celeb-badge-img')) return;
    wrap.addEventListener('click', function(e) {
      e.stopPropagation();
      if (activeWrap && activeWrap !== wrap) activeWrap.classList.remove('active');
      wrap.classList.toggle('active');
      activeWrap = wrap.classList.contains('active') ? wrap : null;
    });
  });
  document.addEventListener('click', function() {
    if (activeWrap) { activeWrap.classList.remove('active'); activeWrap = null; }
  });

  // Initial cart count fetch
  fetch('/cart.js').then(function(r) { return r.json(); }).then(function(cart) {
    updateCartCount(cart.item_count);
  }).catch(function() {});

});
