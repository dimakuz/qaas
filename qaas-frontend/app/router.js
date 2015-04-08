import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

export default Router.map(function() {
  this.route('queues_create', {
    path: '/queues/create'
  });

  this.route('queues_login', {
    path: '/queues/login'
  });
  this.resource('queues', function() {
    this.route('show', {path: ':id'});
    this.route('new');
  });
  this.resource('users', function() {
    this.route('show', {path: ':id'});
    this.route('new');
  });
  this.resource('authtokens', function() {});
  this.route('login');
});
