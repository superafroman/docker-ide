'use strict';

angular.module('dockerIde')
  .controller('ApplicationCtrl', ['$scope', '$state', '$filter', '$timeout',
    function ($scope, $state, $filter, $timeout) {

      $scope.alerts = [];

      $scope.showAlert = function (type, message) {
        var alert = { type: type, message: message },
          existingAlert = $filter('filter')($scope.alerts, alert, true).shift();

        if (existingAlert) {
          alert = existingAlert;
          if (!alert.count) {
            alert.count = 1;
          }
          existingAlert.count++;
        } else {
          $scope.alerts.push(alert);
        }
        if (alert.timeout) {
          $timeout.cancel(alert.timeout);
        }
        alert.timeout = $timeout(function () {
          var index = $scope.alerts.indexOf(alert);
          if (index !== -1) {
            $scope.closeAlert(index);
          }
        }, 5000);
      };

      $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
      };

      $scope.currentYear = new Date().getFullYear();
    }]);
