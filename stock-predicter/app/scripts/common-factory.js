angular.module('stockApp')
  .factory('CommonFactory', function () {
  	function formatDate(duration) {
        var date = moment().subtract(duration, 'days').format('L').split('/');
        var month = date.shift();
        date.splice(1,0,month);
        date.join('-')
        return date;
    }

    return {
    	formatDate: formatDate
    }
  });

