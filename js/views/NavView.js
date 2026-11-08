import View from './View.js';

class NavView extends View {
  constructor() {
    super('.nav');
  }

  addHandlerNav(handler) {
    this._parentElement.addEventListener('click', e => {
      const btn = e.target.closest('button[data-page]');
      if (btn) handler(btn.dataset.page);
    });
  }

  _generateMarkup() {
    const { user, balance, page } = this._data;
    const tab = (id, label) => `<button data-page="${id}" class="${page === id ? 'active' : ''}">${label}</button>`;
    return `<span>Name: ${this._esc(user.username)}</span>
      <span>Balance: ₱${balance.toFixed(2)}</span>
      <nav>${tab('home', 'Home')}${tab('topup', 'Top-up')}${tab('announce', 'Announcement')}${tab('quit', 'Quit')}</nav>`;
  }
}

export default new NavView();