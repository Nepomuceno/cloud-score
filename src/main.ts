import * as Vue from 'vue';
import VueRouter from 'vue-router';

import { HomeComponent } from './components/home';
import { NavbarComponent } from './components/navbar';
import Materials from 'vue-materials';



// register the plugin
Vue.use(VueRouter);
Vue.use(Materials);

let router = new VueRouter({
  routes: [
    { path: '/', component: HomeComponent }
  ]
});

new Vue({
  el: '#app-main',
  router: router,
  components: {
    'navbar': NavbarComponent
  }
});
