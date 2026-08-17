/**
 * Simulated online ordering. No backend — cart state lives in localStorage
 * so it survives a reload, and "placing an order" just generates a
 * confirmation screen and clears the cart.
 */

type OrderType = "pickup" | "delivery";

type CartLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderState = {
  orderType: OrderType | null;
  lines: CartLine[];
};

type Step = "type" | "browse" | "checkout" | "confirmation";

const STORAGE_KEY = "via-roma-order";
const TAX_RATE = 0.0925;
const DELIVERY_FEE = 4.99;

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function loadState(): OrderState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { orderType: null, lines: [] };
    const parsed = JSON.parse(raw) as Partial<OrderState>;
    if (!Array.isArray(parsed.lines)) return { orderType: null, lines: [] };
    return {
      orderType: parsed.orderType === "pickup" || parsed.orderType === "delivery" ? parsed.orderType : null,
      lines: parsed.lines,
    };
  } catch {
    return { orderType: null, lines: [] };
  }
}

function saveState(state: OrderState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function initOrderPage(): void {
  const typeSection = document.querySelector<HTMLElement>('[data-step="type"]');
  const browseSection = document.querySelector<HTMLElement>('[data-step="browse"]');
  const checkoutSection = document.querySelector<HTMLElement>('[data-step="checkout"]');
  const confirmationSection = document.querySelector<HTMLElement>('[data-step="confirmation"]');
  const cartToggle = document.querySelector<HTMLButtonElement>("[data-cart-toggle]");
  const cartToggleLabel = document.querySelector<HTMLElement>("[data-cart-toggle-label]");
  const cartOverlay = document.querySelector<HTMLElement>("[data-cart-overlay]");
  const cartPanel = document.querySelector<HTMLElement>("[data-cart-panel]");
  const cartClose = document.querySelector<HTMLButtonElement>("[data-cart-close]");
  const cartLinesEl = document.querySelector<HTMLElement>("[data-cart-lines]");
  const cartSubtotalEl = document.querySelector<HTMLElement>("[data-cart-subtotal]");
  const cartDeliveryRow = document.querySelector<HTMLElement>("[data-delivery-row]");
  const cartDeliveryEl = document.querySelector<HTMLElement>("[data-cart-delivery]");
  const cartTaxEl = document.querySelector<HTMLElement>("[data-cart-tax]");
  const cartTotalEl = document.querySelector<HTMLElement>("[data-cart-total]");
  const checkoutBtn = document.querySelector<HTMLButtonElement>("[data-checkout-btn]");
  const orderTypeLabel = document.querySelector<HTMLElement>("[data-order-type-label]");
  const changeTypeBtn = document.querySelector<HTMLButtonElement>("[data-change-type]");
  const checkoutForm = document.querySelector<HTMLFormElement>("[data-checkout-form]");
  const checkoutSummary = document.querySelector<HTMLElement>("[data-checkout-summary]");
  const deliveryFields = document.querySelector<HTMLElement>("[data-delivery-fields]");
  const pickupNote = document.querySelector<HTMLElement>("[data-pickup-note]");
  const addressInput = document.querySelector<HTMLInputElement>("#co-address");
  const backToBrowseBtn = document.querySelector<HTMLButtonElement>("[data-back-to-browse]");
  const newOrderBtn = document.querySelector<HTMLButtonElement>("[data-new-order]");

  if (!typeSection || !browseSection || !checkoutSection || !confirmationSection || !cartPanel) {
    return; // Not on the order page.
  }

  let state = loadState();
  let currentStep: Step = state.orderType ? "browse" : "type";

  const findLine = (id: string): CartLine | undefined => state.lines.find((line) => line.id === id);

  const totals = () => {
    const subtotal = state.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const deliveryFee = state.orderType === "delivery" && subtotal > 0 ? DELIVERY_FEE : 0;
    const tax = (subtotal + deliveryFee) * TAX_RATE;
    const total = subtotal + deliveryFee + tax;
    return { subtotal, deliveryFee, tax, total };
  };

  function setStep(step: Step, options: { focus?: boolean } = {}): void {
    currentStep = step;
    for (const section of [typeSection, browseSection, checkoutSection, confirmationSection]) {
      if (!section) continue;
      section.hidden = section.dataset.step !== step;
    }
    if (step !== "browse") {
      cartPanel?.setAttribute("hidden", "");
      cartOverlay?.setAttribute("hidden", "");
    }
    if (cartToggle) cartToggle.hidden = step !== "browse" || state.lines.length === 0;

    if (options.focus !== false) {
      const focusTarget =
        step === "browse"
          ? browseSection
          : step === "checkout"
            ? checkoutSection
            : step === "confirmation"
              ? confirmationSection
              : typeSection;
      focusTarget?.focus();
    }
  }

  function renderMenuRows(): void {
    document.querySelectorAll<HTMLElement>("[data-item-row]").forEach((row) => {
      const id = row.dataset.itemId;
      if (!id) return;
      const line = findLine(id);
      const addBtn = row.querySelector<HTMLElement>("[data-add-btn]");
      const stepper = row.querySelector<HTMLElement>("[data-stepper]");
      const qtyEl = row.querySelector<HTMLElement>("[data-qty]");
      const qty = line?.quantity ?? 0;
      if (addBtn) addBtn.hidden = qty > 0;
      if (stepper) stepper.hidden = qty === 0;
      if (qtyEl) qtyEl.textContent = String(qty);
    });
  }

  function renderCart(): void {
    const { subtotal, deliveryFee, tax, total } = totals();
    const count = state.lines.reduce((sum, line) => sum + line.quantity, 0);

    if (cartLinesEl) {
      if (state.lines.length === 0) {
        cartLinesEl.innerHTML = `<p class="text-sm text-espresso-600">Your order is empty. Add something from the menu.</p>`;
      } else {
        cartLinesEl.innerHTML = state.lines
          .map(
            (line) => `
              <div class="flex items-start justify-between gap-3 border-b border-cream-200 py-4 first:pt-0">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-espresso-900">${escapeHtml(line.name)}</p>
                  <p class="mt-0.5 text-sm text-espresso-600">${currency.format(line.price)} each</p>
                  <div class="mt-2 flex w-fit items-center gap-3 border border-espresso-800 px-2 py-1 text-espresso-800">
                    <button type="button" data-cart-decrement data-item-id="${line.id}" aria-label="Remove one ${escapeHtml(line.name)}" class="px-1 text-base font-semibold">−</button>
                    <span class="w-4 text-center text-sm font-semibold">${line.quantity}</span>
                    <button type="button" data-cart-increment data-item-id="${line.id}" aria-label="Add one more ${escapeHtml(line.name)}" class="px-1 text-base font-semibold">+</button>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-semibold text-espresso-900">${currency.format(line.price * line.quantity)}</p>
                  <button type="button" data-cart-remove data-item-id="${line.id}" class="mt-2 text-xs font-semibold text-wine-600 underline underline-offset-2">Remove</button>
                </div>
              </div>`,
          )
          .join("");
      }
    }

    if (cartSubtotalEl) cartSubtotalEl.textContent = currency.format(subtotal);
    if (cartDeliveryRow) cartDeliveryRow.hidden = deliveryFee === 0;
    if (cartDeliveryEl) cartDeliveryEl.textContent = currency.format(deliveryFee);
    if (cartTaxEl) cartTaxEl.textContent = currency.format(tax);
    if (cartTotalEl) cartTotalEl.textContent = currency.format(total);
    if (checkoutBtn) checkoutBtn.disabled = state.lines.length === 0;
    if (cartToggleLabel) {
      cartToggleLabel.textContent = count > 0 ? `View Order · ${count} · ${currency.format(total)}` : "View Order";
    }
    if (cartToggle) cartToggle.hidden = currentStep !== "browse" || count === 0;
  }

  function renderOrderType(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-order-type-btn]").forEach((btn) => {
      const selected = btn.dataset.orderTypeBtn === state.orderType;
      btn.classList.toggle("border-wine-600", selected);
      btn.classList.toggle("bg-wine-50", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });
    if (orderTypeLabel) {
      orderTypeLabel.textContent = state.orderType === "delivery" ? "Delivery" : "Pickup";
    }

    const isDelivery = state.orderType === "delivery";
    if (deliveryFields) deliveryFields.hidden = !isDelivery;
    if (pickupNote) pickupNote.hidden = isDelivery;
    if (addressInput) {
      if (isDelivery) addressInput.setAttribute("required", "");
      else addressInput.removeAttribute("required");
    }
  }

  function renderAll(): void {
    saveState(state);
    renderOrderType();
    renderMenuRows();
    renderCart();
  }

  function addItem(id: string, name: string, price: number): void {
    const existing = findLine(id);
    if (existing) existing.quantity += 1;
    else state.lines.push({ id, name, price, quantity: 1 });
    renderAll();
  }

  function decrementItem(id: string): void {
    const existing = findLine(id);
    if (!existing) return;
    existing.quantity -= 1;
    if (existing.quantity <= 0) {
      state.lines = state.lines.filter((line) => line.id !== id);
    }
    renderAll();
  }

  function removeItem(id: string): void {
    state.lines = state.lines.filter((line) => line.id !== id);
    renderAll();
  }

  function openCart(): void {
    cartPanel?.removeAttribute("hidden");
    cartOverlay?.removeAttribute("hidden");
    cartPanel?.querySelector<HTMLElement>("button, [href]")?.focus();
  }

  function closeCart(): void {
    cartPanel?.setAttribute("hidden", "");
    cartOverlay?.setAttribute("hidden", "");
    cartToggle?.focus();
  }

  // --- Order type selection -------------------------------------------------
  document.querySelectorAll<HTMLButtonElement>("[data-order-type-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.orderTypeBtn;
      if (type !== "pickup" && type !== "delivery") return;
      state.orderType = type;
      renderAll();
      setStep("browse");
    });
  });

  changeTypeBtn?.addEventListener("click", () => setStep("type"));

  // --- Menu browsing (event delegation) --------------------------------------
  browseSection.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>("[data-item-row]");
    if (!row) return;
    const id = row.dataset.itemId ?? "";
    const name = row.dataset.itemName ?? "";
    const price = Number(row.dataset.itemPrice ?? "0");

    if (target.closest("[data-add-btn]") || target.closest("[data-increment]")) {
      addItem(id, name, price);
    } else if (target.closest("[data-decrement]")) {
      decrementItem(id);
    }
  });

  // --- Cart panel -------------------------------------------------------------
  cartToggle?.addEventListener("click", openCart);
  cartClose?.addEventListener("click", closeCart);
  cartOverlay?.addEventListener("click", closeCart);
  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && cartPanel && !cartPanel.hidden) closeCart();
  });

  cartLinesEl?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const id = target.closest<HTMLElement>("[data-item-id]")?.dataset.itemId;
    if (!id) return;
    if (target.closest("[data-cart-increment]")) addItem(id, findLine(id)?.name ?? "", findLine(id)?.price ?? 0);
    else if (target.closest("[data-cart-decrement]")) decrementItem(id);
    else if (target.closest("[data-cart-remove]")) removeItem(id);
  });

  checkoutBtn?.addEventListener("click", () => {
    if (state.lines.length === 0) return;
    closeCart();
    renderCheckoutSummary();
    setStep("checkout");
  });

  backToBrowseBtn?.addEventListener("click", () => setStep("browse"));

  // --- Checkout -----------------------------------------------------------
  function renderCheckoutSummary(): void {
    if (!checkoutSummary) return;
    const { subtotal, deliveryFee, tax, total } = totals();
    const rows = state.lines
      .map((line) => `<div class="flex justify-between"><span>${line.quantity} × ${escapeHtml(line.name)}</span><span>${currency.format(line.price * line.quantity)}</span></div>`)
      .join("");
    checkoutSummary.innerHTML = `
      <div class="space-y-1">${rows}</div>
      <div class="mt-3 space-y-1 border-t border-cream-300 pt-3">
        <div class="flex justify-between"><span>Subtotal</span><span>${currency.format(subtotal)}</span></div>
        ${deliveryFee > 0 ? `<div class="flex justify-between"><span>Delivery fee</span><span>${currency.format(deliveryFee)}</span></div>` : ""}
        <div class="flex justify-between"><span>Tax</span><span>${currency.format(tax)}</span></div>
        <div class="flex justify-between font-semibold text-espresso-900"><span>Total</span><span>${currency.format(total)}</span></div>
      </div>`;
  }

  checkoutForm?.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();
    if (!checkoutForm) return;

    const requiredFields = checkoutForm.querySelectorAll<HTMLInputElement>("input[required]");
    let valid = true;
    requiredFields.forEach((field) => {
      const fieldValid = field.checkValidity();
      const error = field.closest("div")?.querySelector<HTMLElement>("[data-error]");
      if (error) error.hidden = fieldValid;
      if (!fieldValid) valid = false;
    });
    if (!valid) return;

    const data = new FormData(checkoutForm);
    const name = String(data.get("name") ?? "");

    const submitButton = checkoutForm.querySelector<HTMLButtonElement>("[data-submit-button]");
    const label = submitButton?.querySelector<HTMLElement>("[data-label]");
    if (submitButton) submitButton.disabled = true;
    if (label) label.textContent = "Placing Order…";

    window.setTimeout(() => {
      const orderNumber = String(1000 + Math.floor(Math.random() * 9000));
      const eta =
        state.orderType === "delivery"
          ? "Estimated delivery time: 45–60 minutes"
          : "Estimated pickup time: 25–35 minutes";

      const confirmNumberEl = document.querySelector<HTMLElement>("[data-confirm-order-number]");
      const confirmNameEl = document.querySelector<HTMLElement>("[data-confirm-name]");
      const confirmEtaEl = document.querySelector<HTMLElement>("[data-confirm-eta]");
      const confirmSummaryEl = document.querySelector<HTMLElement>("[data-confirm-summary]");

      if (confirmNumberEl) confirmNumberEl.textContent = orderNumber;
      if (confirmNameEl) confirmNameEl.textContent = name;
      if (confirmEtaEl) confirmEtaEl.textContent = eta;
      if (confirmSummaryEl) confirmSummaryEl.innerHTML = checkoutSummary?.innerHTML ?? "";

      state = { orderType: null, lines: [] };
      renderAll();
      setStep("confirmation");

      checkoutForm.reset();
      if (submitButton) submitButton.disabled = false;
      if (label) label.textContent = "Place Order";
    }, 600);
  });

  newOrderBtn?.addEventListener("click", () => {
    state = { orderType: null, lines: [] };
    renderAll();
    setStep("type");
  });

  // --- Init -----------------------------------------------------------------
  renderAll();
  setStep(currentStep, { focus: false });
}

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
