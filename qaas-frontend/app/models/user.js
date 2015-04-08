import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('String'),
  password: DS.attr('String')
});
