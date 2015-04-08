import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {return this.store.createRecord('authtoken');},
  actions: {
    create: function() {
      var self = this;
      this.controller.get('model').save().then(
        function(authToken) {
          var App = self.container.lookup('application:main');
          App.authToken = authToken.id;
          App.Auth = Ember.Object({
            authToken: authToken.is,
            accountId: authToken.name
          });
          self.transitionTo('queues.index');
        });
    }
  }
});
