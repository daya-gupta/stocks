'use strict';

/**
 * @ngdoc function
 * @name stockApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the stockApp
 */
angular.module('stockApp')
  .controller('MainCtrl', function ($scope, $http, $q, $timeout) {
  	
    // data initialization
    var chartData = {
  		days: [],
  		price: [],
  		volume: []
  	};
    var deferred = null;
    
    if($scope.$root.stock) {
        $scope.stock = $scope.$root.stock;
    } else {
        $scope.stock = {
            name: 'Rajesh Exports',
            symbol: 'RAJESHEXPO'
        };
        $scope.$root.stock = $scope.stock;
    }

    $scope.latestPriceVolumeData = null;

    $scope.search = {
        states : [],
        selectedState: null
    };

    $scope.$root.message = {
        messageString: null,
        messageStatus: false
    };

    $scope.duration = {
        radioModel : 365
    };

    // function updateSearch2() {
    //     console.log('1');
    //     if(deferred) {
    //         console.log('2');
    //         deferred.reject();
    //     }
    //     deferred = $q.defer();
    //     $timeout(function() {
    //         console.log('3');
    //         console.log(deferred);
    //         deferred.resolve({});
    //     }, 1000);
    //     return deferred.promise;
    // }

    function toggleMessageVisibility(message, status) {
        $scope.message.messageString = message;
        $scope.message.messageStatus = status;
        $timeout(function() {
            $scope.message.messageString = null;
        }, 4000);
    }
    
    $scope.updateSearch = function() {
        $http.get('https://www.screener.in/api/company/search/?q='+$scope.search.selectedState).then(function(response) {
            $scope.search.states = response.data;
        });
    };

    $scope.onTypeaheadSelection = function() {
        $scope.showStockDetails();
    };

    $scope.durationChanged = function() {
        getAPIData();
    };

    $scope.addToWatchlist = function() {
        var data = {
            name: $scope.stock.name,
            priority: "4",
            symbol: $scope.stock.symbol
        };
        $http({
            method: 'post',
            url: 'http://localhost:4000/addStock',
            data: {stock: data}
        }).then(function(response) {
            if(response && response.data) {
                toggleMessageVisibility(response.data.message, response.data.saved);
            }
        }, function(error) {
            toggleMessageVisibility('An error occured. Stock not added to watchlist !!', false);
        });
    };

    $scope.showNote = function() {
        $scope.showNotes=true;

        $http({
            method: 'get',
            url: 'http://localhost:4000/getWatchlist'
        }).then(function(response) {
            if(response.data && response.data.length) {
                var stock = _.find(response.data, {symbol: $scope.stock.symbol});
                if(stock) {
                    delete(stock._id);
                    $scope.stock = stock;
                }
                else {
                    $scope.stock.note = null;
                }
            }
        });
    };

    $scope.saveNote = function(mode) {
        $scope.showNotes = false;

        $http({
            method: 'post',
            url: 'http://localhost:4000/editStock',
            data: {stock: $scope.stock}
        }).then(function(response) {
            if(response && response.data) {
                toggleMessageVisibility(response.data.message, response.data.saved);
            }
        }, function(error) {
            toggleMessageVisibility('An error occured. View updated to previouly saved watchlist !!', false);
        });
    };

    $scope.showStockDetails = function() {
        if($scope.search.selectedState) {
            var selectedStock = _.find($scope.search.states, {name: $scope.search.selectedState});
            $scope.search.selectedState = null;
            $scope.stock = {};
            if(selectedStock) {
                $scope.stock.name = selectedStock.name;
                $scope.stock.id = selectedStock.id;
                $scope.stock.symbol = selectedStock.url.split('/')[2];
                $scope.$root.stock = $scope.stock;
                 
                if(isNaN(Number(selectedStock.url.split('/')[2]))) {
                    getAPIData();
                }
                else {
                    toggleMessageVisibility('stock not listed in nse !!', false);
                    getAPIDataBSE();
                }
            }
        }
    };

    $scope.openNewsPopup = function() {
        // http://www.bseindia.com/stock-share-price/SiteCache/TabResult.aspx?text=531500&type=news
        $http({
            method: 'get',
            url: 'http://www.bseindia.com/stock-share-price/SiteCache/TabResult.aspx?text='+531500+'&type=news'
        }).then(function(response) {
            if(response && response.data) {
                console.log(response.data);
            }
        }, function(error) {
            toggleMessageVisibility('An error occured while fetching news. !!', false);
        });
        $http({
            method: 'get',
            url: 'http://www.bseindia.com/stock-share-price/Notification.aspx?scripcode='+531500
        }).then(function(response) {
            if(response && response.data) {
                console.log(response.data);
            }
        }, function(error) {
            toggleMessageVisibility('An error occured while fetching news. !!', false);
        });
    };

    function getAPIDataBSE() {
        chartData.days = [];
        chartData.price = [];
        chartData.volume = [];
        chartData.revenue = [];
        chartData.profit = [];
        $http({
            method: 'get',
            url: 'https://www.screener.in/api/company/'+$scope.stock.id+'/prices/?what=years&period=3'
        }).then(function(response) {
            chartData.price = response.data.prices;
            chartData.days = response.data.dates;
            _.each(chartData.days, function(obj, index) {
                chartData.days[index] = obj.split(' ').join('-');
                chartData.volume.push(null);
                chartData.profit.push(null);
                chartData.revenue.push(null);
            });

            $http({
                method: 'get',
                url: 'https://www.screener.in/api/company/'+$scope.stock.symbol
            }).then(function(response) {
                if(response.data) {
                    for(var item in response.data.number_set.quarters[0][1]) {
                        var index = -1;
                        var t_sdate=item;                  
                        var sptdate = String(t_sdate).split("-");
                        var myMonth = sptdate[1];
                        var myDay = sptdate[2];
                        var myYear = sptdate[0];
                        var combineDatestr = myYear + "/" + myMonth + "/" + myDay;
                        myMonth = moment(combineDatestr).format('ll').split(' ')[0];
                        combineDatestr = myDay + "-" + myMonth + "-" + myYear;

                        for(var i = 0; i < 7; i++) {
                            combineDatestr = (myDay-i) + "-" + myMonth + "-" + myYear;
                            index = _.indexOf(chartData.days, combineDatestr);
                            if(index !== -1) {
                                chartData.profit[index] = Number(response.data.number_set.quarters[9][1][item]);
                                chartData.revenue[index] = Number(response.data.number_set.quarters[0][1][item]);
                                break;
                            }
                        }
                    }
                }
                renderChart();
            }, function(error) {
                toggleMessageVisibility('Something went wrong. Please try after some time !!', false);
                console.log(error);
            });
        });
    }

    function renderTabularData(data) {
        $('#tabular-data table').html(data);
    }

    function formatDate(duration) {
        var date = moment().subtract(duration, 'days').format('L').split('/');
        var month = date.shift();
        date.splice(1,0,month);
        date.join('-');
        return date;
    }

    function calculateAverageVolume(arr) {
        return _.meanBy(arr, function(obj) {
            return obj.y;
        }).toFixed(2);    
    }
    
    function getAPIData() {
        if(typeof $scope.stock.symbol !== 'string') {
            $scope.stock.id = $scope.stock.symbol;
            getAPIDataBSE();
            return;
        }

        chartData.days = [];
        chartData.price = [];
        chartData.volume = [];
        chartData.revenue = [];
        chartData.profit = [];

        if($scope.duration.radioModel === 1) {
            delete(chartData.volume);
            delete(chartData.revenue);
            delete(chartData.profit);
            
            $http({
                method: 'get',
                url: 'http://www.nseindia.com/charts/webtame/tame_intraday_getQuote_closing_redgreen.jsp?CDSymbol='+$scope.stock.symbol+'&Segment=CM&Series=EQ&CDExpiryMonth=&FOExpiryMonth=&IRFExpiryMonth=&CDDate1=&CDDate2=&PeriodType=2&Periodicity=1&Template=tame_intraday_getQuote_closing_redgreen.jsp'
            }).then(function(response) {
                console.log(response);
                var temp = null;
                if(response.data && $(response.data).find('csv') && $(response.data).find('csv').find('data')[0]) {
                    temp = $($(response.data).find('csv').find('data')[0]).text().split(' ');
                    _.each(temp, function(obj, index) {
                        if(index){
                            obj = _.compact(obj.split(','));
                            chartData.days.push(obj[0].split(':').splice(0,2).join(':'));
                            chartData.price.push(Math.round(obj[1]*10)/10);
                        }
                    });
                    renderChart();
                }
            }, function(error) {
                console.log('Error!!');
            });
            // return;
        }
    	

        chartData.days = [];
        chartData.price = [];
        chartData.volume = [];
        chartData.revenue = [];
        chartData.profit = [];

        var symbol = $scope.stock.symbol;
        var duration = $scope.duration.radioModel > 1095 ? $scope.duration.radioModel : 1095;
        var fromDate = formatDate(duration+1);
        var toDate = formatDate(0);
        
        // get hostorical data from NSE
        $http({
    		method: 'get',
            cache: true,
            url: 'http://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol='+symbol+'&series=EQ&fromDate='+fromDate+'&toDate='+toDate
    	}).then(function(response) {
            var day = $(response.data);
            var dataRows = _.compact($(day[4]).find('tr'));
            var noOfRecords = Math.round($scope.duration.radioModel*.7);
            var headerArray = dataRows.splice(0,1);

            dataRows = dataRows.slice(0, noOfRecords).reverse();
            angular.forEach(dataRows, function(obj,index) {
                var dataColumns = $(obj).find('td');
                chartData.days.push(dataColumns[0].innerHTML);
                chartData.price.push(Number(dataColumns[7].innerHTML.replace(/,/g,'')));
                chartData.volume.push(Number(dataColumns[8].innerHTML.replace(/,/g,''))/1000);
                if(chartData.price[index] > chartData.price[index-1] || index === 0) {
                    chartData.volume[index] = {
                        y: chartData.volume[index],
                        color: '#44B544'
                    };
                }
                else {
                    chartData.volume[index] = {
                        y: chartData.volume[index]
                    };
                }
                chartData.profit.push(null);
                chartData.revenue.push(null);
            });

            // get today's data from NSE    
            $http({
                method: 'get',
                url: 'https://www1.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuote.jsp?symbol='+symbol+'&illiquid=0&smeFlag=0&itpFlag=0'
            }).then(function(response) {
                var stockDetailsJSON = null;
                var jqObject = null;
                var averageVolume = 0;

                averageVolume = calculateAverageVolume(chartData.volume.slice(chartData.volume.length > 22 ? chartData.volume.length-22 : 0, chartData.volume.length));
                
                jqObject = $(response.data).find('#responseDiv');

                if(jqObject && jqObject.length) {
                    stockDetailsJSON = JSON.parse(jqObject.text()).data[0];
                    // append today's data to historical data array
                    // if(stockDetailsJSON.secDate && stockDetailsJSON.secDate.slice(0,2) !== chartData.days[chartData.days.length-1].slice(0,2)) {
                    if(stockDetailsJSON.secDate && stockDetailsJSON.secDate.slice(0,2) != moment().date()) {
                    // if(stockDetailsJSON.lastUpdateTime && stockDetailsJSON.lastUpdateTime.split(' ')[0] !== chartData.days[chartData.days.length-1].toUpperCase()) {
                        // chartData.days.push(stockDetailsJSON.lastUpdateTime.split(' ')[0]);
                        chartData.days.push(moment().date());
                        // chartData.days.push(stockDetailsJSON.secDate);
                        chartData.price.push(Number(stockDetailsJSON.lastPrice.replace(/,/g,'')));
                        // chartData.volume.push(Number(stockDetailsJSON.totalTradedVolume.replace(/,/g,''))/1000);
                        if(chartData.price[chartData.price.length-1] > chartData.price[chartData.price.length-2]) {
                            chartData.volume.push({
                                y: Number(stockDetailsJSON.totalTradedVolume.replace(/,/g,''))/1000,
                                color: '#44B544'
                            });
                        }
                        else {
                            chartData.volume.push({
                                y: Number(stockDetailsJSON.totalTradedVolume.replace(/,/g,''))/1000
                            });
                        }
                        chartData.profit.push(null);
                        chartData.revenue.push(null);
                    }
                
                    // compute relative values etc
                    if(chartData.days.length > 2) {
                        $scope.latestPriceVolumeData = {
                            price: chartData.price[chartData.price.length-1],
                            relativePrice: Math.round((chartData.price[chartData.price.length-1]-chartData.price[chartData.price.length-2])/chartData.price[chartData.price.length-2]*10000)/100,
                            volume: chartData.volume[chartData.volume.length-1].y,
                            averageVolume: averageVolume,
                            relativeVolume: Math.round((chartData.volume[chartData.volume.length-1].y)/averageVolume*100)/100
                        };
                    }

                    if($scope.duration.radioModel > 1) {
                        // profit and revenue data from screener
                        $http({
                            method: 'get',
                            url: 'https://www.screener.in/api/company/'+symbol
                        }).then(function(response) {
                            var index = -1;
                        
                            if(response.data) {
                                for(var item in response.data.number_set.quarters[0][1]) {
                                    var t_sdate=item;                  
                                    var sptdate = String(t_sdate).split("-");
                                    var myMonth = sptdate[1];
                                    var myDay = sptdate[2];
                                    var myYear = sptdate[0];
                                    var combineDatestr = myYear + "/" + myMonth + "/" + myDay;
                                    myMonth = moment(combineDatestr).format('ll').split(' ')[0];
                                    combineDatestr = myDay + "-" + myMonth + "-" + myYear;

                                    for(var i = 0; i < 7; i++) {
                                        combineDatestr = (myDay-i) + "-" + myMonth + "-" + myYear;
                                        index = _.indexOf(chartData.days, combineDatestr);
                                        if(index !== -1) {
                                            chartData.profit[index] = Number(response.data.number_set.quarters[9][1][item]);
                                            chartData.revenue[index] = Number(response.data.number_set.quarters[0][1][item]);
                                            break;
                                        }
                                    }
                                }
                            }
                            renderChart();
                        });
                    
                    }
                }
            });
    	}, function(error) {
            toggleMessageVisibility('Something went wrong. Please try after some time !!', false);
        });
    }

    function renderChart() {
    	$(function () {
    	    $('#chart-container').highcharts({
    	        chart: {
    	            zoomType: 'xy'
    	        },
    	        title: {
    	            text: 'Stocks price - volume - earnings graph'
    	        },
    	        subtitle: {
    	            text: 'Source: NA'
    	        },
    	        xAxis: [{
    	            categories: chartData.days,
    	            crosshair: true,
    	        }],
    	        yAxis: [{ // First yAxis
    	            labels: {
    	                format: 'Rs {value}',
    	                style: {
    	                    color: Highcharts.getOptions().colors[0]
    	                }
    	            },
    	            title: {
    	                text: 'Price',
    	                style: {
    	                    color: Highcharts.getOptions().colors[0]
    	                }
    	            },
                    max: _.max(chartData.price),
                    min: _.min(chartData.price)
    	        }, { // Second yAxis
                    labels: {
                        format: '{value} Cr',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    title: {
                        text: 'revenue',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    }
                },  { // Third yAxis
    	            title: {
    	                text: 'Volume (thousand)',
    	                style: {
    	                    color: Highcharts.getOptions().colors[1]
    	                }
    	            },
    	            labels: {
    	                style: {
    	                    color: Highcharts.getOptions().colors[1]
    	                }
    	            },
    	            opposite: true
    	        }, { // Fourth yAxis
                    gridLineWidth: 0,
                    title: {
                        text: 'Profit',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    labels: {
                        format: '{value} Cr',
                        style: {
                            color: Highcharts.getOptions().colors[1]
                        }
                    },
                    opposite: true
                }],
    	        tooltip: {
    	            shared: true,
                    positioner: function () {
                        return { x: 800, y: 0 };
                    },
                    shadow: false,
                    borderWidth: 0
    	        },
    	        legend: {}, 
    	        series: [{
    	            name: 'Volume',
    	            type: 'column',
    	            yAxis: 2,
    	            data: chartData.volume,
    	            tooltip: {
    	                valueSuffix: ' ths'
    	            },
                    color: Highcharts.getOptions().colors[3]
    	        }, {
    	            name: 'price',
    	            type: 'area',
                    yAxis: 0,
    	            data: chartData.price,
    	            tooltip: {
    	                valueSuffix: ''
    	            },
                    color: Highcharts.getOptions().colors[0],
                    fillColor: {
                        linearGradient: [0, 0, 0, 200],
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    }
    	        }, {
                    name: 'profit',
                    type: 'spline',
                    connectNulls: true,
                    yAxis: 3,
                    data: chartData.profit || [],
                    dashStyle: 'shortdot',
                    tooltip: {
                        valueSuffix: ' Cr'
                    },
                    color: Highcharts.getOptions().colors[2]
                }, {
                    name: 'revenue',
                    type: 'column',
                    connectNulls: true,
                    yAxis: 1,
                    data: chartData.revenue || [],
                    dashStyle: 'shortdot',
                    tooltip: {
                        valueSuffix: ' Cr'
                    },
                    color: Highcharts.getOptions().colors[1]
                }]
    	    });
    	});
    }

    getAPIData();
  });
