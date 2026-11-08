import * as model from './model.js';
import authView from './views/AuthView.js';

const refresh = () => {
  const user = model.currentUser();
  authView.render({ news: model.state.updates.slice(0, 2), unit: null });
  authView.toggle(!user);
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

model.init();
authView.addHandlerAuth(controlAuth);
refresh();