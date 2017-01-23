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
    'ngLoadingSpinner'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/company', {
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
      .when('/portfolio', {
        templateUrl: 'views/portfolio.html',
        controller: 'PortfolioCtrl',
        controllerAs: 'portfolio'
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'login'
      })
      .otherwise({
        redirectTo: '/login'
      });
  });
