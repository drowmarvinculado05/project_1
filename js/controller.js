import * as model from './model.js';
import authView from './views/AuthView.js';

model.init();
authView.render({ news: model.state.updates.slice(0, 2), unit: null });