import View from './View.js';

class AuthView extends View {
  constructor() {
    super('.auth');
  }

  addHandlerAuth(handler) {
    this._parentElement.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (btn) handler(btn.dataset.action, this._formData(this._parentElement.querySelector('form')));
    });
  }

  _generateMarkup() {
    const { news: items } = this._data;
    const news = items.map(item => `<article class="card">
        <h3><span class="tag">${this._esc(item.kind)}</span> ${this._esc(item.title)}</h3><p>${this._esc(item.details)}</p></article>`).join('');
    return `<div class="login-page">
      <form class="login-box">
        <h2>Login</h2>
        <input name="username" placeholder="Username">
        <input name="password" type="password" placeholder="Password">
        <p class="error"></p>
        <button type="button" data-action="login">Login</button>
        <button type="button" data-action="register">Create Account</button>
      </form>
      <div><h1>Welcome Player</h1>${news}</div>
    </div>`;
  }
}

export default new AuthView();