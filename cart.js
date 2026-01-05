(function () {
  const STORAGE_KEY = "casekompass_cart_v1";

  /**
   * Catalog: prices are end consumer prices incl. VAT (as provided).
   * For the Pro Toolkit we model two SKUs (Privat / Pro).
   */
  const CATALOG = {
    startklar: {
      id: "startklar",
      name: "Startklar – Soforthilfe & Orientierung",
      price: 24.9,
      url: "/paket-startklar.html",
    },
    "care-plan": {
      id: "care-plan",
      name: "Care-Plan – Struktur für 4–8 Wochen",
      price: 69.9,
      url: "/paket-care-plan.html",
    },
    "pro-toolkit-privat": {
      id: "pro-toolkit-privat",
      name: "Pro Toolkit – Vorlagenbibliothek & System (Privat)",
      price: 169.0,
      url: "/paket-pro-toolkit.html",
    },
    "pro-toolkit-pro": {
      id: "pro-toolkit-pro",
      name: "Pro Toolkit – Vorlagenbibliothek & System (Pro/Lizenz)",
      price: 299.0,
      url: "/paket-pro-toolkit.html",
    },
  };

  function formatEUR(value) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.id === "string")
        .map((item) => ({
          id: item.id,
          qty: Math.max(1, Number(item.qty) || 1),
        }));
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent("cart:updated"));
  }

  function getCartCount(cart = loadCart()) {
    return cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  function upsert(cart, id, deltaQty) {
    if (!CATALOG[id]) return cart;
    const next = cart.slice();
    const idx = next.findIndex((x) => x.id === id);
    if (idx >= 0) {
      next[idx] = { ...next[idx], qty: Math.max(1, next[idx].qty + deltaQty) };
    } else {
      next.push({ id, qty: Math.max(1, deltaQty) });
    }
    return next;
  }

  function setQty(cart, id, qty) {
    if (!CATALOG[id]) return cart;
    const nextQty = Math.max(1, Number(qty) || 1);
    return cart.map((x) => (x.id === id ? { ...x, qty: nextQty } : x));
  }

  function removeItem(cart, id) {
    return cart.filter((x) => x.id !== id);
  }

  function calc(cart = loadCart()) {
    const lines = cart
      .filter((x) => CATALOG[x.id])
      .map((x) => {
        const product = CATALOG[x.id];
        const qty = Math.max(1, Number(x.qty) || 1);
        const lineTotal = product.price * qty;
        return { ...product, qty, lineTotal };
      });
    const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    return { lines, total };
  }

  function updateCartBadges() {
    const count = getCartCount();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      if (!count) {
        el.textContent = "";
        el.setAttribute("aria-hidden", "true");
        return;
      }
      el.textContent = String(count);
      el.removeAttribute("aria-hidden");
    });
  }

  function bindAddToCartButtons() {
    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const id = btn.getAttribute("data-add-to-cart");
        if (!id || !CATALOG[id]) return;

        const cart = loadCart();
        const next = upsert(cart, id, 1);
        saveCart(next);
        updateCartBadges();

        btn.blur();
      });
    });
  }

  function bindCardNavigation() {
    document.querySelectorAll("[data-card-href]").forEach((card) => {
      card.addEventListener("click", (e) => {
        const target = e.target;
        if (target && (target.closest("a") || target.closest("button") || target.closest("input") || target.closest("select") || target.closest("textarea"))) {
          return;
        }
        const href = card.getAttribute("data-card-href");
        if (href) window.location.href = href;
      });

      card.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const href = card.getAttribute("data-card-href");
        if (href) {
          e.preventDefault();
          window.location.href = href;
        }
      });
    });
  }

  function renderCartPage() {
    const mount = document.querySelector("[data-cart-mount]");
    if (!mount) return;

    const { lines, total } = calc();

    if (!lines.length) {
      mount.innerHTML = `
        <div class="panel cart-empty">
          <h3 class="panel-title">Ihr Warenkorb ist leer</h3>
          <p class="small">Wählen Sie ein Download‑Paket im Shop und legen Sie es in den Warenkorb.</p>
          <div class="hero-actions" style="margin-top: 14px;">
            <a class="btn btn-primary" href="/shop.html">Zum Shop</a>
            <a class="btn btn-secondary" href="/">Startseite</a>
          </div>
        </div>
      `;
      return;
    }

    const rows = lines
      .map((l) => {
        return `
          <div class="cart-row" data-cart-row>
            <div class="cart-row-main">
              <div class="cart-row-title">
                <a href="${l.url}">${l.name}</a>
              </div>
              <div class="cart-row-sub small">Preis: ${formatEUR(l.price)} inkl. MwSt.</div>
            </div>
            <div class="cart-row-controls">
              <label class="cart-qty">
                <span class="sr-only">Menge</span>
                <input type="number" min="1" step="1" value="${l.qty}" data-cart-qty="${l.id}" />
              </label>
              <div class="cart-row-total">${formatEUR(l.lineTotal)}</div>
              <button class="btn btn-secondary cart-remove" type="button" data-cart-remove="${l.id}">Entfernen</button>
            </div>
          </div>
        `;
      })
      .join("");

    mount.innerHTML = `
      <div class="panel cart-panel">
        <div class="cart-head">
          <h3 class="panel-title">Warenkorb</h3>
          <p class="small">Endpreise inkl. MwSt. (wie angegeben). Downloads werden nach Abschluss bereitgestellt.</p>
        </div>
        <div class="cart-rows">${rows}</div>
        <div class="cart-summary">
          <div class="cart-summary-line">
            <span>Gesamt</span>
            <strong>${formatEUR(total)}</strong>
          </div>
          <div class="hero-actions" style="margin-top: 12px;">
            <a class="btn btn-secondary" href="/shop.html">Weiter einkaufen</a>
            <a class="btn btn-primary" href="#checkout">Zur Kasse</a>
          </div>
        </div>
      </div>
    `;

    mount.querySelectorAll("[data-cart-qty]").forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.getAttribute("data-cart-qty");
        const qty = Number(input.value);
        const cart = loadCart();
        saveCart(setQty(cart, id, qty));
        renderCartPage();
        updateCartBadges();
      });
    });

    mount.querySelectorAll("[data-cart-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-cart-remove");
        const cart = loadCart();
        saveCart(removeItem(cart, id));
        renderCartPage();
        updateCartBadges();
      });
    });

    const checkoutLink = document.querySelector("[data-checkout-mailto]");
    if (checkoutLink) {
      const body = lines
        .map((l) => `- ${l.name} (Menge: ${l.qty}) – ${formatEUR(l.lineTotal)}`)
        .join("\n");
      const mailBody = `Hallo,\n\nich möchte folgende Download-Pakete bestellen:\n\n${body}\n\nGesamt: ${formatEUR(total)}\n\nBitte senden Sie mir die weiteren Schritte/Download-Infos.\n\nViele Grüße`;
      checkoutLink.href = `mailto:casekompass@gmx.de?subject=${encodeURIComponent("Bestellung – casekompass.de")}&body=${encodeURIComponent(mailBody)}`;
    }
  }

  function init() {
    updateCartBadges();
    bindAddToCartButtons();
    bindCardNavigation();
    renderCartPage();

    document.addEventListener("cart:updated", updateCartBadges);
  }

  window.CasekompassCart = {
    catalog: CATALOG,
    loadCart,
    saveCart,
    calc,
    formatEUR,
    updateCartBadges,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
