import * as model from './model.js';
import authView from './views/AuthView.js';
import navView from './views/NavView.js';

let page = 'home'; // 'home' | 'topup' | 'announce'

const refresh = () => {
  const user = model.currentUser();
  authView.render({ news: model.state.updates.slice(0, 2), unit: null });
  authView.toggle(!user);
  navView.toggle(Boolean(user));
  if (!user) return;
  navView.render({ user, balance: model.balanceOf(user), page });
};

const controlAuth = (action, { username, password }) => {
  try {
    if (action === 'login') model.login(username, password);
    if (action === 'register') model.register(username, password);
    refresh();
  } catch (err) {
    authView.renderError(err.message);
  }
};

const controlNav = target => {
  if (target === 'quit') {
    model.logout();
    page = 'home';
  } else page = target;
  refresh();
};

model.init();
authView.addHandlerAuth(controlAuth);
navView.addHandlerNav(controlNav);
refresh();