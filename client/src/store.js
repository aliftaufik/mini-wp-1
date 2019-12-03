import Vue from 'vue'
import Vuex from 'vuex'

import server from './api/server'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    onSession: false,
    userArticles: []
  },
  mutations: {
    CHANGE_SESSION(state, session) {
      state.onSession = session
    },
    CHANGE_USER_ARTICLES(state, articles) {
      state.userArticles = articles
    }
  },
  actions: {
    onSignUp(context, { username, email, password, fullName }) {
      return server.post('signup', {
        username,
        email,
        password,
        fullName
      })
    },
    onSignIn(context, { emailUsername, password }) {
      return server.post('signin', {
        emailUsername,
        password
      })
    },
    onSignOut({ commit }) {
      commit('CHANGE_SESSION', false)
      localStorage.clear()
    },
    fetchUserArticles(context) {
      const access_token = localStorage.getItem('access_token')
      return server
        .get('user/articles', { headers: { access_token } })
        .then(({ data }) => {
          context.commit('CHANGE_USER_ARTICLES', data.data)
        })
    }
  },
  modules: {}
})
