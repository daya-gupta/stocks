'use strict';

angular.module('stockApp')
    .controller('LoginCtrl', function($scope, $http) {
        console.log('login initialized !');
        console.log($scope.india);
        $scope.loginFormData = {
            userId: null,
            password: null,
            csrf: null
        };

        $http({
            method: 'get',
            url: 'http://localhost:4000/getCsrfToken',
        }).then(function(response) {
            console.log(response.data);
            $scope.loginFormData.csrf = response.data.csrf;
            // document.getElementsByName('csrf')[0].val = response.data.csrf;
        }, function(error) {
            console.log(error);
        });

        $scope.submitLoginForm = function() {
            console.log($scope.loginFormData);

            $http({
                method: 'post',
                url: 'http://localhost:4000/authenticateUser',
                data: $scope.loginFormData
            }).then(function(response) {
                console.log(response.data);
                $scope.userDetails = response.data;
            }, function(error) {
                console.log(error);
                $scope.errorMessage=error.data.errorMessage;
            });
        }
    });