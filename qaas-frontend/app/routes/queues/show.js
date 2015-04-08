import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    this.store.find('queue', params.id);
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
      this.controller.get('model').save().then(
        function(queue) {
          console.log(queue._id);
          self.transitionTo('queues.show', queue);
        });
    }
  }
});
