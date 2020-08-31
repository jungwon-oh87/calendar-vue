import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import VueTextareaAutosize from "vue-textarea-autosize";
import firebase from "firebase/app";
import "firebase/firestore";
require("dotenv").config();

Vue.use(VueTextareaAutosize);
Vue.config.productionTip = false;

firebase.initializeApp({
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: "calendar-vue-976e3.firebaseapp.com",
  databaseURL: "https://calendar-vue-976e3.firebaseio.com",
  projectId: "calendar-vue-976e3",
  storageBucket: "calendar-vue-976e3.appspot.com",
  messagingSenderId: "691747554860",
  appId: "1:691747554860:web:2b7e7c0dcf24165364b389",
});

export const db = firebase.firestore();

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
