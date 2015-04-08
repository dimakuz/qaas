import Ember from 'ember';

export default Ember.Controller.extend({
  username: localStorage.getItem('unsername'),
  actions: {
    login: function() {
      // ... Do some login stuff ...
      this.set('username', localStorage.getItem('username'));
    }
  }
});
