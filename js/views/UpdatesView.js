import View from './View.js';

class UpdatesView extends View {
    constructor() {
        super('.updates');
    }

    addHandlerSubmit(handler) {
        this._parentElement.addEventListener('submit', e => {
            e.preventDefault();
            handler(this._formData(e.target));
        });
    }

    addHandlerCardActions(handler) {
        this._parentElement.addEventListener('click', e => {
            const btn = e.target.closest('button[data-action]');
            if (btn) handler(btn.dataset.action, Number(btn.dataset.id));
        });
    }

    _form(editing) {
        const fieldValue = key => this._esc(editing?.[key] ?? '');
        const kindOptions = ['Tournament', 'Raffle', 'Event']
            .map(kind => `<option ${editing?.kind === kind ? 'selected' : ''}>${kind}</option>`).join('');
        return `<form>
      <input type="hidden" name="id" value="${editing?.id ?? ''}">
      <select name="kind">${kindOptions}</select>
      <input name="title" placeholder="Title" value="${fieldValue('title')}">
      <input name="date" type="date" value="${fieldValue('date')}">
      <input name="link" placeholder="Register link (https://...)" value="${fieldValue('link')}">
      <textarea name="details" placeholder="Details">${fieldValue('details')}</textarea>
      <p class="error"></p>
      <button>${editing ? 'Save changes' : 'Post announcement'}</button>
    </form>`;
    }

    _generateMarkup() {
        const { items, isAdmin, editing } = this._data;
        const cardsMarkup = items.map(item => `<article class="card announce">
      <div>
        <h3><span class="tag">${this._esc(item.kind)}</span> ${this._esc(item.title)}</h3>
        <p>${this._esc(item.details)}</p>
        ${item.date ? `<p>Date: ${new Date(item.date).toLocaleDateString('en-PH', { dateStyle: 'long' })}</p>` : ''}
        ${item.link ? `<p>Register here: <a href="${this._esc(item.link)}" target="_blank" rel="noopener">form link</a></p>` : ''}
        ${isAdmin ? `<button data-action="edit" data-id="${item.id}">Edit</button>
          <button data-action="delete" data-id="${item.id}">Delete</button>` : ''}
      </div>
      <div class="poster">${this._esc(item.kind)}</div>
    </article>`).join('');
        return `<h2>Announcement</h2>${isAdmin ? this._form(editing) : ''}${cardsMarkup || '<p>No announcements yet.</p>'}`;
    }
}

export default new UpdatesView();