import View from './View.js';

class ProductsView extends View {
    constructor() {
        super('.products');
    }

    addHandlerAction(handler) {
        this._parentElement.addEventListener('click', e => {
            const btn = e.target.closest('button[data-action]');
            if (btn) handler(btn.dataset.action, Number(btn.dataset.id));
        });
    }

    _card(product, isAdmin) {
        return `<article class="card">
      <h3>${this._esc(product.name)}</h3>
      <p>₱${product.price}</p>
      ${isAdmin ? '' : `<button data-action="order" data-id="${product.id}">Order</button>`}
    </article>`;
    }

    _generateMarkup() {
        const { products, orders, isAdmin } = this._data;
        const rows = orders.map(o => `<li>${this._esc(o.username)}: ${this._esc(o.product)} (₱${o.price})
      ${o.canServe ? `<button data-action="served" data-id="${o.id}">Mark served</button>` : ''}</li>`).join('');
        return `<h2>Products</h2>
      <p class="error"></p>
      <div class="grid">${products.map(p => this._card(p, isAdmin)).join('')}</div>
      <h3>${isAdmin ? 'Pending orders' : 'My orders'}</h3>
      <ul>${rows || '<li>No orders.</li>'}</ul>`;
    }
}

export default new ProductsView();
