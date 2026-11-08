import View from './View.js';

class ModalView extends View {
    constructor() {
        super('.modal');
    }

    render(data) {
        this.toggle(Boolean(data));
        super.render(data);
    }

    addHandler(handler) {
        this._parentElement.addEventListener('click', e => {
            const btn = e.target.closest('button[data-action]');
            if (btn) handler(btn.dataset.action);
        });
    }

    _generateMarkup() {
        if (!this._data) return '';
        const { title, text, confirm } = this._data;
        return `<div class="box"><h3>${this._esc(title)}</h3><p>${this._esc(text)}</p>
      ${confirm ? '<button data-action="confirm">Confirm</button><button data-action="cancel">Cancel</button>'
                : '<button data-action="cancel">OK</button>'}</div>`;
    }
}

export default new ModalView();