'use strict';

/**
 * @ngdoc overview
 * @name stockApp
 * @description
 * # stockApp
 *
 * Main module of the application.
 */
angular
  .module('stockApp', [
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngTouch',
    'ui.bootstrap',
    'ngLoadingSpinner',
    'io.modernizr'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      // .when('/editStock', {
      //   templateUrl: 'views/edit.html',
      //   controller: 'EditCtrl',
      //   controllerAs: 'edit'
      // })
      .when('/watchlist', {
        templateUrl: 'views/watchlist.html',
        controller: 'WatchlistCtrl',
        controllerAs: 'watchlist'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
