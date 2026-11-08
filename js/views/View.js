// Base View: every view extends this. It never imports the model.
export default class View {
  _data;
  _parentElement;

  constructor(selector) {
    this._parentElement = document.querySelector(selector);
  }

  render(data) {
    this._data = data;
    this._parentElement.innerHTML = this._generateMarkup();
  }

  toggle(show) {
    this._parentElement.hidden = !show;
  }

  renderError(message = '') {
    this._setText('.error', message);
  }

  _setText(selector, text) {
    const el = this._parentElement.querySelector(selector);
    if (el) el.textContent = text;
  }

  _formData(form) {
    return Object.fromEntries(new FormData(form));
  }

  _esc(value) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value).replace(/[&<>"']/g, c => map[c]);
  }

  _generateMarkup() {
    throw new Error('Subclass must implement _generateMarkup');
  }
}