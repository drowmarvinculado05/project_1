import View from './View.js';

class UnitsView extends View {
    constructor() {
        super('.units');
    }

    addHandlerAction(handler) {
        this._parentElement.addEventListener('click', e => {
            const btn = e.target.closest('button[data-action]');
            if (btn) handler(btn.dataset.action, Number(btn.dataset.id));
        });
    }

    _fmt(minutes) {
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }

    _body(u) {
        if (u.state !== 'busy') return '';
        return `<p>Player: ${this._esc(u.player)}${u.mine ? ' (you)' : ''}<br>Playing time: ${this._fmt(u.played)}
    <br>Balance: ₱${u.balance.toFixed(2)} (${this._fmt(u.left)} left)</p>`;
    }

    // One unit card.
    _card(u) {
        const btn = (action, label) => `<button data-action="${action}" data-id="${u.id}">${label}</button>`;
        return `<article class="card ${u.state} type-${u.type}">
      <h3>${u.name} ${u.type === 'vip' ? '<span class="vip">VIP</span>' : ''} <small>₱${u.rate}/hr</small></h3>
      ${this._body(u)}
      ${u.canStart ? btn('in', 'In') : ''}
      ${u.canEnd ? btn('out', 'Out') : ''}
      ${u.canToggle ? btn('toggle', u.state === 'broken' ? 'Mark fixed' : 'Mark damaged') : ''}
    </article>`;
    }

    // A titled section with its own grid. Hidden when the group is empty.
    _group(title, list) {
        if (!list.length) return '';
        return `<h2 class="group-title">${title}</h2>
      <div class="grid">${list.map(u => this._card(u)).join('')}</div>`;
    }

    _generateMarkup() {
        return `<p class="error"></p>
      ${this._group('Units', this._data.filter(u => u.type === 'regular'))}
      ${this._group('VIP Units', this._data.filter(u => u.type === 'vip'))}`;
    }
}

export default new UnitsView();