import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.createRecord('authtoken');
  },
  actions: {
    login: function() {
      var self = this;
      this.controller.get('model').save().then(
        function(authToken, user) {
          var App = self.container.lookup('application:main');
          App.set('authToken', authToken.id);
          App.set('username', authToken.get('name'));
          localStorage.setItem('username', authToken.get('name'));
          localStorage.setItem('token', authToken.id);
          localStorage.setItem('user_id', authToken.get('user').get('id'));
          self.transitionTo('queues.index');
        }
      ).catch(
        function(errmsg) {
          self.set('error', errmsg.responseJSON.error.message);
        }
      );
    }
  }
});
