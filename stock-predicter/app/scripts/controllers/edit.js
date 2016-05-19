'use strict';

/**
 * @ngdoc function
 * @name stockApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the stockApp
 */
angular.module('stockApp')
  .controller('EditCtrl', function ($scope, $http, $location) {
    
    if($scope.$root.stock) {
    	$scope.stock = {
    	    name: $scope.$root.stock.name,
    	    symbol: $scope.$root.stock.symbol
    	};
    } else {
    	// redirect to home page
    	$location.path('/');
    }

    $scope.savedStockProfile = [];
    
    // get data for selected stock 
    $http({
        method: 'get',
        url: 'http://localhost:4000/getStockProfile?symbol='+$scope.stock.symbol
    }).then(function(response) {
    	$scope.savedStockProfile = [];
    	if(response.data && response.data && response.data.length) {
        	$scope.savedStockProfile = response.data[0].profile;
	    	_.each($scope.savedStockProfile, function(obj) {
	    		if(obj.date) {
		    		obj.date = new Date(Date.parse(obj.date));
	    		}
	    	});
    	}
    	$scope.stockProfile = angular.copy($scope.savedStockProfile);
    });

    $scope.alterRecord = function(mode, index) {
    	if(mode==='add') {
    		var sampleData = {
	            quarter: '-1',
	            date: new Date(),
	            profit: 0,
	            revenue: 0
	        };
    		$scope.stockProfile.splice(index, 0, sampleData);
    	} else {
    		$scope.stockProfile.splice(index, 1);
    	}
    };

    $scope.saveRecord = function(mode) {
    	if(mode === 'save') {
    		// trigger API for save
    		var data = angular.copy($scope.stockProfile);
    		_.each(data, function(obj) {
    			var temp = String(obj.date).split(' ');
    			if(temp && temp.length) {
		    		obj.date = [temp[2],temp[1],temp[3]].join('-');
    			}
	    	});
	    	$http({
                method: 'post',
                url: 'http://localhost:4000/saveStockProfile',
                data: { symbol: $scope.stock.symbol, profile: data}
            }).then(function(response) {
            	if(response && response.data && response.data.saved) {
            		$scope.message.messageString = 'Data saved!!';
            		$scope.message.messageStatus = true;
            	}
            }, function(error) {
            	console.log(error);
            	$scope.stockProfile = $scope.savedStockProfile;
            	$scope.message.messageString = 'An error occured. View updated to previouly saved data status !!';
            	$scope.message.messageStatus = false;
            });
    	} else {
    		// revert changes to previous state
    		$scope.stockProfile = $scope.savedStockProfile;
    	}
    };

      $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
      };

      $scope.dateOptions = {
        dateDisabled: disabled,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
      };

      // Disable weekend selection
      function disabled(data) {
        var date = data.date,
          mode = data.mode;
        return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
      }

      $scope.toggleMin = function() {
        $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
        $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
      };

      $scope.toggleMin();

      $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate', 'dd-MMM-yyyy'];
      $scope.format = $scope.formats[4];
      $scope.altInputFormats = ['M!/d!/yyyy', 'dd-MMM-yyyy'];

      $scope.popup1 = {
        opened: false
      };

      function getDayClass(data) {
          var date = data.date,
            mode = data.mode;
          if (mode === 'day') {
            var dayToCheck = new Date(date).setHours(0,0,0,0);

            for (var i = 0; i < $scope.events.length; i++) {
              var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

              if (dayToCheck === currentDay) {
                return $scope.events[i].status;
              }
            }
          }
          return '';
        }

  });







// --------------------------------------watchlist---------------------------------------------

angular.module('stockApp')
  .controller('WatchlistCtrl', function ($scope, $http, $timeout, $location, CommonFactory) {
    
    var chartDataCollection = [];
    
    $scope.edit = null;
    	
    $scope.watchlist2 = [];

    $scope.search = {
        states : [],
        selectedState: null
    };

    $scope.message = {
        messageString: null,
        messageStatus: false
    }

    $scope.currentStock = null;

    $scope.predicate = 'priority';
	$scope.reverse = false;

	function toggleMessageVisibility(message, status) {
	    $scope.message.messageString = message;
	    $scope.message.messageStatus = status;
	    $timeout(function() {
	        $scope.message.messageString = null;
	    }, 4000);
	}

	function computeVolumeCriteria(chartData) {
		var volumeCriteria = 0;
		// var relevantVolumeData = chartData.volume.reverse().slice(0,10);
		var relevantVolumeData = angular.copy(chartData.volume).reverse().slice(0,10);
		var relevantPriceData = angular.copy(chartData.price).reverse().slice(0,10);
		_.each(relevantVolumeData, function(obj, index) {
			if(index) {
				volumeCriteria+= Number(relevantPriceData[index-1]) >= Number(relevantPriceData[index]) ? relevantVolumeData[index-1] : - relevantVolumeData[index-1];
			}
		});
		return (volumeCriteria/chartData.averageVolume).toFixed(2);
	}

	// get watchlist data 
    function populateWatchlistData() {
	    $http({
	        method: 'get',
	        url: 'http://localhost:4000/getWatchlist'
	    }).then(function(response) {
	    	$scope.watchlist2 = [];
	    	if(response.data && response.data.length) {
	        	$scope.watchlist2 = response.data;
		    }
	    	$scope.watchlistCopy = angular.copy($scope.watchlist);

	    	// get stock specific price
	    	_.each($scope.watchlist2, function(obj) {
	    		var chartData = {days: [], price:[], volume:[]};
		    	var jqObject = null;
		    	var stockDetailsJSON = null;

		    	if(isNaN(Number(obj.symbol))) {
			    	// get today's data from NSE
			    	$http({
			    		method: 'get',
			    		url: 'https://www1.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuote.jsp?symbol='+obj.symbol+'&illiquid=0&smeFlag=0&itpFlag=0'
			    	}).then(function(response) {
			    		jqObject = $(response.data).find('#responseDiv');
			    		
			    	    // get hostorical data from NSE
			    	    $http({
			    			method: 'get',
			    	        url: 'http://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol='+obj.symbol+'&series=EQ&fromDate='+fromDate+'&toDate='+toDate
			    		}).then(function(response) {
			    	        var day = $(response.data);
			    	        var dataRows = $(day[4]).find('tr');
			    	        var headerArray = dataRows.splice(0,1);
			    	        var lastPrice = null;
			    	        var lastToLastPrice = null;
			    	        angular.forEach(_.reverse(dataRows), function(obj, index) {
			    	            var dataColumns = $(obj).find('td');
			    	            chartData.days.push(dataColumns[0].innerHTML);
			    	            chartData.price.push(Number(dataColumns[7].innerHTML.replace(/,/g,'')));
			    	            chartData.volume.push(Number(dataColumns[8].innerHTML.replace(/,/g,''))/1000);
			    	        });

			    	        chartData.averageVolume = Math.round(_.mean(chartData.volume)*100)/100;

    			    		if(jqObject && jqObject.length) {
    				    		stockDetailsJSON = JSON.parse(jqObject.text()).data[0];
    				    		// if(stockDetailsJSON.lastUpdateTime && stockDetailsJSON.lastUpdateTime.split(' ')[0] !== chartData.days[chartData.days.length-1].toUpperCase()) {
    				    		// if(stockDetailsJSON.secDate && stockDetailsJSON.secDate.slice(0,2) !== chartData.days[chartData.days.length-1].slice(0,2)) {
    				    		if(stockDetailsJSON.secDate && stockDetailsJSON.secDate.slice(0,2) != moment().date()) {
    			           			chartData.price.push(stockDetailsJSON.lastPrice.replace(/,/g,''));
    			           			chartData.volume.push(stockDetailsJSON.totalTradedVolume.replace(/,/g,'')/1000)
        			           	}
    				    	}

    				    	// compute volume Criteria
    						obj.volumeCriteria = computeVolumeCriteria(chartData);

	    	                obj.price = chartData.price[chartData.price.length-1];
	    	                obj.volume = chartData.volume[chartData.volume.length-1];
	    	                obj.changeInVolume = chartData.averageVolume ? Math.round((chartData.volume[chartData.volume.length-1])/chartData.averageVolume*100)/100 : 'NA';
	    	                obj.changeInPrice = chartData.price[chartData.price.length-2] ? Math.round(((chartData.price[chartData.price.length-1]-chartData.price[chartData.price.length-2])/chartData.price[chartData.price.length-2]*10000))/100 : 'NA';
	    	                
	    	                chartDataCollection.push(chartData);
	    	                
			    		}, function(error) {
			    	        toggleMessageVisibility('Something went wrong. Please try after some time !!', false)
			    	    });

			    	});

		    	    var duration = 30;
		    	    var fromDate = CommonFactory.formatDate(duration+1);
		    	    var toDate = CommonFactory.formatDate(0);
		    	}
		    	else {
		    		obj.price = 'NA';
		    		obj.changeInPrice = 'NA';
		    		obj.volume = 'NA';
		    	}
	    	});
	    }, function(error) {
	    	console.log(error);
	    	toggleMessageVisibility(error.data.message, false);
	    });
    }

    $scope.redirectToDetailsPage = function(stock) {
    	$scope.$root.stock = stock;
    	$location.path('/#');
    };

    $scope.saveStockData = function() {
    	if(!$scope.currentStock) {
    		return;
    	}
    	delete($scope.currentStock._id);
    	delete($scope.currentStock.price);
    	delete($scope.currentStock.changeInPrice);
    	delete($scope.currentStock.volume);
    	
		$http({
            method: 'post',
            url: $scope.mode === 'add' ? 'http://localhost:4000/addStock' : 'http://localhost:4000/editStock',
            data: {stock: $scope.currentStock}
        }).then(function(response) {
        	if(response && response.data) {
        		toggleMessageVisibility(response.data.message, response.data.saved)
        		populateWatchlistData();
        	}
        }, function(error) {
        	$scope.watchlist2 = $scope.watchlistCopy;
        	toggleMessageVisibility('An error occured. View updated to previouly saved watchlist !!', false)
        });

    	$scope.mode = null;
    	$scope.search.selectedState = null;
       	$scope.currentStock = null;
    };

    $scope.onTypeaheadSelection = function() {
        if($scope.search.selectedState) {
		    var selectedStock = _.find($scope.search.states, {name: $scope.search.selectedState});
		    if(selectedStock) {
		        $scope.currentStock.name = selectedStock.name;
		        $scope.currentStock.id = selectedStock.id;
		        $scope.currentStock.symbol = selectedStock.url.split('/')[2];
		    }
		}
    };

    $scope.updateSearch = function() {
        $http.get('https://www.screener.in/api/company/search/?q='+$scope.search.selectedState).then(function(response) {
            $scope.search.states = response.data;
        });
    };

    $scope.addStock = function() {
    	$scope.mode = 'add';
    
    	$scope.currentStock ={
    		name: null,
    		note: null,
    		symbol: null,
    		price: null,
    		priority: null
    	};
    };

    $scope.editStock = function(stock) {
    	$scope.mode = 'edit';
    	$scope.currentStock = stock;
    };

    $scope.deleteStock = function(stock) {
    	$scope.currentStock = stock;
		$http({
            method: 'post',
            url: 'http://localhost:4000/deleteStock',
            data: { stock: $scope.currentStock}
        }).then(function(response) {
        	$scope.currentStock = null;
        	if(response && response.data && response.data.saved) {
        		$scope.message.messageString = 'Data deleted successfully!!';
        		$scope.message.messageStatus = true;
        		$scope.watchlist2 = _.reject($scope.watchlist2, {symbol: stock.symbol});
        	}
        }, function(error) {
        	$scope.currentStock = null;
        	console.log(error);
        	$scope.message.messageString = 'An error occured. View updated to previouly saved watchlist !!';
        	$scope.message.messageStatus = false;
        });
    };

    $scope.orderBy = function(predicate) {
    	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    	$scope.predicate = predicate;
    };

    populateWatchlistData();

  });
