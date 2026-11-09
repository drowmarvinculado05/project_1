import * as model from './model.js';
import authView from './views/AuthView.js';
import navView from './views/NavView.js';
import unitsView from './views/UnitsView.js';
import productsView from './views/ProductsView.js';
import topupView from './views/TopupView.js';
import updatesView from './views/UpdatesView.js';
import modalView from './views/ModalView.js';


let page = 'units';
let editingId = null;
let draft = null;

const renderBoard = user => {
  navView.render({ user, balance: model.balanceOf(user), page });
  unitsView.render(model.unitsInfo());
};

const refresh = () => {
  const user = model.currentUser();
  authView.render({ news: model.state.updates.slice(0, 2) });
  authView.toggle(!user);
  navView.toggle(Boolean(user));
  unitsView.toggle(Boolean(user) && page === 'units');
  productsView.toggle(Boolean(user) && page === 'products');
  topupView.toggle(Boolean(user) && page === 'topup');
  updatesView.toggle(Boolean(user) && page === 'announce');
  if (!user) return;
  renderBoard(user);
  productsView.render({ products: model.productInfo(), orders: model.ordersInfo(), isAdmin: user.role === 'admin' });
  topupView.render({ balance: model.balanceOf(user), pending: model.pendingInfo() });
  updatesView.render({ items: model.state.updates, isAdmin: user.role === 'admin', editing: model.getUpdate(editingId) });
};


const attempt = (view, change) => {
  try {
    change();
    refresh();
  } catch (err) {
    view.renderError(err.message);
  }
};

const controlAuth = (action, { username, password }) =>
  attempt(authView, () => {
    if (action === 'login') model.login(username, password);
    if (action === 'register') model.register(username, password);
  });

const controlNav = target => {
  if (target === 'logout') {
    model.logout();
    page = 'units';
  } else page = target;
  refresh();
};

const controlUnit = (action, id) =>
  attempt(unitsView, () => {
    if (action === 'in') model.startSession(id);
    if (action === 'out') model.endSession(id);
    if (action === 'toggle') model.toggleBroken(id);
  });

const controlPreview = amount => topupView.renderPreview(model.previewMinutes(amount));

const controlPay = (amount, method) => {
  try {
    model.checkPayment(amount, method);
    draft = { amount, method };
    modalView.render({
      title: 'Confirm',
      text: method === 'Counter'
        ? `Add ₱${amount} to your time? Please pay ₱${amount} at the counter. We will remind you every 5 minutes until it is paid.`
        : `Pay ₱${amount} with ${method}? payment is made.`,
      confirm: true,
    });
  } catch (err) {
    topupView.renderError(err.message);
  }
};

const controlModal = action => {
  const confirmed = action === 'confirm' && draft;
  const { amount, method } = draft ?? {};
  draft = null;
  modalView.render(null);
  if (confirmed) {
    attempt(topupView, () => {
      model.topUp(amount, method);
      if (method !== 'Counter') modalView.render({ title: 'Payment successful', text: `₱${amount} paid via ${method}. Time added to your balance.` });
    });
  }
};

const controlPaid = id => attempt(topupView, () => model.markPaid(id));

const controlSaveUpdate = data =>
  attempt(updatesView, () => {
    if (data.id) model.editUpdate(data);
    else model.addUpdate(data);
    editingId = null;
  });

const controlUpdateAction = (action, id) =>
  attempt(updatesView, () => {
    if (action === 'edit') editingId = id;
    if (action === 'delete') model.deleteUpdate(id);
  });


const tick = () => {
  const user = model.currentUser();
  if (!user) return;
  if (model.expireSessions()) refresh();
  else renderBoard(user);
};


const remind = () => {
  const total = model.unpaidTotal();
  if (total > 0 && !draft) modalView.render({ title: 'Reminder', text: `You still have ₱${total} to pay at the counter.` });
};
const controlOrder = (action, id) =>
  attempt(productsView, () => {
    if (action === 'order') {
      const product = model.orderProduct(id);
      modalView.render({ title: 'Order placed', text: `${product.name} (₱${product.price}) ordered. It was charged to your balance.` });
    }
    if (action === 'served') model.markServed(id);
  });

const init = () => {
  model.init();
  productsView.addHandlerAction(controlOrder);
  authView.addHandlerAuth(controlAuth);
  navView.addHandlerNav(controlNav);
  unitsView.addHandlerAction(controlUnit);
  topupView.addHandlerInput(controlPreview);
  topupView.addHandlerSubmit(controlPay);
  topupView.addHandlerPaid(controlPaid);
  updatesView.addHandlerSubmit(controlSaveUpdate);
  updatesView.addHandlerCardActions(controlUpdateAction);
  modalView.addHandler(controlModal);
  window.addEventListener('storage', e => model.reload(e.key) && refresh());
  refresh();
  setInterval(tick, 10000);
  setInterval(remind, 5 * 60 * 1000);
};

init();