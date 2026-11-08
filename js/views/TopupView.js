import View from './View.js';

class TopupView extends View {
    constructor() {
        super('.topup');
    }

    renderPreview(minutes) {
        this._setText('.preview', `= ${minutes} min of play time`);
    }

    addHandlerInput(handler) {
        this._parentElement.addEventListener('input', e => {
            if (e.target.name === 'amount') handler(Number(e.target.value));
        });
    }

    addHandlerSubmit(handler) {
        this._parentElement.addEventListener('submit', e => {
            e.preventDefault();
            const { amount, method } = this._formData(e.target);
            handler(Number(amount), method);
        });
    }

    addHandlerPaid(handler) {
        this._parentElement.addEventListener('click', e => {
            const btn = e.target.closest('button[data-id]');
            if (btn) handler(Number(btn.dataset.id));
        });
    }

    _generateMarkup() {
        const { balance, pending } = this._data;
        const rows = pending.map(p => `<li>${this._esc(p.username)}: ₱${p.amount}
      ${p.canMarkPaid ? `<button data-id="${p.id}">Mark paid</button>` : ''}</li>`).join('');
        return `<h2>Top-up</h2>
      <form>
        <p>Current balance: <strong>₱${balance.toFixed(2)}</strong></p>
        <label>Add amount (₱) <input name="amount" type="number" placeholder="20"></label>
        <p class="preview">= 0 min of play time</p>
        <div>Payment method:
          <label><input type="radio" name="method" value="GCash" checked> GCash</label>
          <label><input type="radio" name="method" value="Maya"> Maya</label>
          <label><input type="radio" name="method" value="Counter"> Pay to Counter</label></div>
        <p class="error"></p>
        <button>Pay now</button>
      </form>
      <h3>Unpaid at the counter</h3><ul>${rows || '<li>Nothing unpaid.</li>'}</ul>`;
    }
}

export default new TopupView();