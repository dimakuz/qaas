import DS from 'ember-data';

export default DS.Model.extend({
  user: DS.belongsTo('user'),
  queue: DS.belongsTo('queue'),
});
