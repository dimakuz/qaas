import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {return this.store.createRecord('queue');},
  actions: {
    create: function() {
      var self = this;
      this.controller.get('model').save().then(
        function(queue) {
          console.log(queue._id);
          self.transitionTo('queues.show', queue);
        });
    }
  }
});
