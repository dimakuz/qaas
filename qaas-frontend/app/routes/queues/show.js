import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    return this.store.find('queue', params.id);
    //this.store.createRecord('subscriber', {
    //  user: 1,
    //  queue: params.id,
    //})
  },
  setupController: function(controller, model) {
    controller.set('model', model);
  },
  actions: {
    enqueue: function() {
      var self = this;
      var user = this.store.createRecord('user', {id: localStorage.getItem('user_id')});
      this.store.createRecord('subscriber', {
        user: user,
        queue: this.controller.get('model')
      }).save().then(
        function(queue) {
          user.deleteRecord();
          self.reload();
        });
    }
  }
});
