'use strict';

angular.module('stockApp')
  .controller('WatchlistCtrl', function ($scope, $http, $timeout, $location, CommonFactory) {
    
    var chartDataCollection = [];
    
    $scope.$root.view = 'watchlist';
    
    $scope.search = {
        stock : [],
        selectedStock: null
    };

    $scope.editPageData = {
		predicate: 'priority',
		reverse: false,
		currentStock: null,
		watchlist2: [],
		watchlistCopy: null
	};

	function computeVolumeCriteria(chartData, flag) {
		var startIndex = flag === 'new' ? 10 : 12 ;
		var endIndex = flag === 'new' ? 0 : 2;
		var volumeCriteria = 0;
		var relevantVolumeData = angular.copy(chartData.volume).slice(chartData.volume.length-startIndex, chartData.volume.length - endIndex);
		var relevantPriceData = angular.copy(chartData.price).slice(chartData.price.length-startIndex, chartData.price.length - endIndex);
		_.each(relevantVolumeData, function(obj, index) {
			if(index && relevantVolumeData[index-1] != _.max(relevantVolumeData)) {
				volumeCriteria+= Number(relevantPriceData[index]) >= Number(relevantPriceData[index-1]) ? relevantVolumeData[index] * (1 + .05 * index) : - relevantVolumeData[index] * (1 + .05 * index);
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
	    	$scope.editPageData.watchlist2 = [];
	    	if(response.data && response.data.length) {
	        	$scope.editPageData.watchlist2 = response.data;
		    }
	    	$scope.editPageData.watchlistCopy = angular.copy($scope.editPageData.watchlist);

	    	// get stock specific price
	    	_.each($scope.editPageData.watchlist2, function(obj) {
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
    						obj.volumeCriteriaOld = Number(computeVolumeCriteria(chartData, 'old'));
    						obj.volumeCriteriaNew = Number(computeVolumeCriteria(chartData, 'new'));

	    	                obj.price = chartData.price[chartData.price.length-1];
	    	                obj.volume = chartData.volume[chartData.volume.length-1];
	    	                obj.changeInVolume = chartData.averageVolume ? Math.round((chartData.volume[chartData.volume.length-1])/chartData.averageVolume*100)/100 : 'NA';
	    	                obj.changeInPrice = chartData.price[chartData.price.length-2] ? Math.round(((chartData.price[chartData.price.length-1]-chartData.price[chartData.price.length-2])/chartData.price[chartData.price.length-2]*10000))/100 : 'NA';
	    	                
	    	                chartDataCollection.push(chartData);

			    		}, function(error) {
			    	        CommonFactory.toggleMessageVisibility('Something went wrong. Please try after some time !!', false)
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
	    	CommonFactory.toggleMessageVisibility(error.data.message, false);
	    });
    }

    $scope.redirectToDetailsPage = function(stock) {
    	$scope.$root.stock = stock;
    	$location.path('/#');
    };

    $scope.saveStockData = function() {
    	if(arguments && arguments[0] === false) {
    		$scope.editPageData.currentStock=null;
    		$scope.search.selectedStock = null;
    		$scope.mode = null;
    		return;
    	}

    	if(!$scope.editPageData.currentStock) {
    		return;
    	}

    	delete($scope.editPageData.currentStock._id);
    	delete($scope.editPageData.currentStock.price);
    	delete($scope.editPageData.currentStock.changeInPrice);
    	delete($scope.editPageData.currentStock.volume);
    	
		$http({
            method: 'post',
            url: $scope.mode === 'add' ? 'http://localhost:4000/addStock' : 'http://localhost:4000/editStock',
            data: {stock: $scope.editPageData.currentStock}
        }).then(function(response) {
        	if(response && response.data) {
                CommonFactory.toggleMessageVisibility('Data saved successfully', true);
        		populateWatchlistData();
        	}
        }, function(error) {
        	$scope.editPageData.watchlist2 = $scope.editPageData.watchlistCopy;
        	CommonFactory.toggleMessageVisibility('An error occured. View updated to previouly saved watchlist !!', false)
        });

    	$scope.mode = null;
    	$scope.search.selectedStock = null;
       	$scope.editPageData.currentStock = null;
    };

    $scope.onTypeaheadSelection = function() {
        if($scope.search.selectedStock) {
		    var selectedStock = _.find($scope.search.stock, {name: $scope.search.selectedStock});
		    if(selectedStock) {
		        $scope.editPageData.currentStock.name = selectedStock.name;
		        $scope.editPageData.currentStock.id = selectedStock.id;
		        $scope.editPageData.currentStock.symbol = selectedStock.url.split('/')[2];
		    }
		}
    };

    $scope.updateSearch = function() {
        $http.get('https://www.screener.in/api/company/search/?q='+$scope.search.selectedStock).then(function(response) {
            $scope.search.stock = response.data;
        });
    };

    $scope.addStock = function() {
    	$scope.mode = 'add';
    
    	$scope.editPageData.currentStock ={
    		name: null,
    		note: null,
    		symbol: null,
    		price: null,
    		priority: null
    	};
    };

    $scope.editStock = function(stock) {
    	$scope.mode = 'edit';
    	$scope.editPageData.currentStock = stock;
    };

    $scope.deleteStock = function(stock) {
    	$scope.editPageData.currentStock = stock;
		$http({
            method: 'post',
            url: 'http://localhost:4000/deleteStock',
            data: { stock: $scope.editPageData.currentStock}
        }).then(function(response) {
        	$scope.editPageData.currentStock = null;
        	if(response && response.data && response.data.saved) {
        		$scope.editPageData.watchlist2 = _.reject($scope.editPageData.watchlist2, {symbol: stock.symbol});
        		CommonFactory.toggleMessageVisibility('Data removed successfully', true);
        	}
        }, function(error) {
        	$scope.editPageData.currentStock = null;
        	CommonFactory.toggleMessageVisibility('An error occured. View updated to previouly saved watchlist !!', false);
        });
    };

    $scope.orderBy = function(predicate) {
    	$scope.editPageData.reverse = ($scope.editPageData.predicate === predicate) ? !$scope.editPageData.reverse : false;
    	$scope.editPageData.predicate = predicate;
    };

    $scope.updateNseValue = function() {
    	CommonFactory.updateNseValue();
    };

    $scope.openNewsPopup = function(stock) {
        CommonFactory.getNewsData(stock);
    };

    $scope.updateNseValue();

    populateWatchlistData();

  });
