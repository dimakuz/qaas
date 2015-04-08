import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  host: 'http://209.132.179.29:8000',
  namespace: '',
  headers: function() {
    return {
      "X-AUTH-TOKEN": this.get('App.authToken') || localStorage.getItem('token')
    };
  }.property("App.authToken")
});
