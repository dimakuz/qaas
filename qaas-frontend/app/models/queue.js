import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('String'),
  secret: DS.attr('String'),
  subscribers: DS.hasMany('subscriber')
});
