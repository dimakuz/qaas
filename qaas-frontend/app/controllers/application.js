import Ember from 'ember';

export default Ember.Controller.extend({
  username: function() {
    localStorage.getItem('username')
  },
  actions: {
    login: function() {
      // ... Do some login stuff ...
      this.set('username', localStorage.getItem('username'));
    },
    logout: function() {
      localStorage.clear();
      this.set('username', null);
      this.transitionToRoute('index');
    }
  }
});
