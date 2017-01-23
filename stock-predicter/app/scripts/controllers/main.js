'use strict';

/**
 * @ngdoc function
 * @name stockApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the stockApp
 */
angular.module('stockApp')
  .controller('MainCtrl', function ($scope, $http, $q, $timeout, CommonFactory) {
  	
    // data initialization
    var chartData = {
  		days: [],
  		price: [],
  		volume: []
  	};
    var deferred = null;

    $scope.$root.view = 'home';
    
    if($scope.$root.stock || sessionStorage.getItem('selectedStock')) {
        $scope.stock = $scope.$root.stock || JSON.parse(sessionStorage.getItem('selectedStock'));
        sessionStorage.setItem('selectedStock', JSON.stringify($scope.stock));
    } else {
        $scope.stock = {
            name: 'Rajesh Exports',
            symbol: 'RAJESHEXPO'
        };
        $scope.$root.stock = $scope.stock;
    }

    $scope.latestPriceVolumeData = null;

    $scope.search = {
        stock : [],
        selectedStock: null
    };

    $scope.duration = {};

    if(sessionStorage.duration) {
        $scope.duration.radioModel = Number(sessionStorage.getItem('duration'));
    }
    else {
        $scope.duration.radioModel = 365;    
    }
    

    $scope.updateSearch = function() {
        $http.get('https://www.screener.in/api/company/search/?q='+$scope.search.selectedStock).then(function(response) {
            $scope.search.stock = response.data;
        });
    };

    $scope.onTypeaheadSelection = function() {
        $scope.showStockDetails();
    };

    $scope.durationChanged = function() {
        sessionStorage.setItem('duration', $scope.duration.radioModel);
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
                CommonFactory.toggleMessageVisibility(response.data.message, response.data.saved);
            }
        }, function(error) {
            CommonFactory.toggleMessageVisibility('An error occured. Stock not added to watchlist !!', false);
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
                CommonFactory.toggleMessageVisibility(response.data.message, response.data.saved);
            }
        }, function(error) {
            CommonFactory.toggleMessageVisibility('An error occured. View updated to previouly saved watchlist !!', false);
        });
    };

    $scope.showStockDetails = function() {
        if($scope.search.selectedStock) {
            var selectedStock = _.find($scope.search.stock, {name: $scope.search.selectedStock});
            $scope.search.selectedStock = null;
            $scope.stock = {};
            if(selectedStock) {
                $scope.stock.name = selectedStock.name;
                $scope.stock.id = selectedStock.id;
                $scope.stock.symbol = selectedStock.url.split('/')[2];
                $scope.$root.stock = $scope.stock;
                sessionStorage.setItem('selectedStock', JSON.stringify($scope.stock));
                
                getAPIData();           
            }
        }
    };

    $scope.openNewsPopup = function() {
        CommonFactory.getNewsData($scope.stock);
    };

    $scope.updateNseValue = function() {
        CommonFactory.updateNseValue();
    };

    $scope.updateNseValue();

    function getAPIDataBSE() {
        chartData.days = [];
        chartData.price = [];
        chartData.volume = [];
        chartData.revenue = [];
        chartData.profit = [];

        // http://www.bseindia.com/BSEGraph/Graphs/GetStockReachVolPriceDatav1.aspx?index=500033
        // http://www.bseindia.com/BSEGraph/Graphs/GetStockReachVolPrice5D.aspx?index=500033&Flag=5D
        // http://www.bseindia.com/BSEGraph/Graphs/GetStockReachVolPriceData.aspx?index=500033&Flag=1M
        // http://www.bseindia.com/BSEGraph/Graphs/GetStockReachVolPriceData.aspx?index=500033&Flag=12M
        
        var duration = false;
        
        switch($scope.duration.radioModel) {
            case 1: duration = ''; break;
            case 7: duration = '5D'; break;
            case 15: ;
            case 30: duration = '1M'; break;
            case 90: duration = '3M'; break;
            case 180: duration = '6M'; break;
            case 365: duration = '12M'; break;
            case 1095: duration = '36M'; break;
            case 1825: duration = '60M'; break;
        }

        duration = duration?'&flag='+duration:'';
        
        $http({
            method: 'get',
            url: 'http://www.bseindia.com/BSEGraph/Graphs/GetStockReachVolPriceData.aspx?index='+$scope.stock.id+duration
        }).then(function(response) {
            var dataSet = response.data.split('#');
            dataSet.splice(0,2);
            var dataSet2 = [];
            _.each(dataSet, function(item) {
                if(item) {dataSet2.push(item);}
            });

            _.each(dataSet2, function(item, index) {
                if($scope.duration.radioModel <= 7) {
                    var timestamp = item.split(',')[0].split(' ');
                    timestamp[0] = timestamp[0].split('/').reverse().join('-');
                    chartData.days.push(timestamp.join(' '));
                }
                else {
                    chartData.days.push(item.split(',')[0].split(' ')[0].split('/').reverse().join('-'));
                }
                chartData.price.push(Number(item.split(',')[2]));
                chartData.volume.push(Number(item.split(',')[3])/1000);

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

            if($scope.duration.radioModel >=365) {
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
                            // var combineDatestr = myYear + "-" + myMonth + "-" + myDay;
                            // var combineDatestr = myDay + "-" + myMonth + "-" + myYear;
                            var combineDatestr = null;
                            // myMonth = moment(combineDatestr).format('ll').split(' ')[0];
                            // combineDatestr = myDay + "-" + myMonth + "-" + myYear;

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
                    CommonFactory.renderChart(chartData);
                });
            }
            else {
                CommonFactory.renderChart(chartData);
            }
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
        if(!isNaN(Number($scope.stock.symbol))) {
            CommonFactory.toggleMessageVisibility('stock not listed in nse !!', false);
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
                url: 'https://www.nseindia.com/charts/webtame/tame_intraday_getQuote_closing_redgreen.jsp?CDSymbol='+$scope.stock.symbol+'&Segment=CM&Series=EQ&CDExpiryMonth=&FOExpiryMonth=&IRFExpiryMonth=&CDDate1=&CDDate2=&PeriodType=2&Periodicity=1&Template=tame_intraday_getQuote_closing_redgreen.jsp'
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
                    CommonFactory.renderChart(chartData);
                }
            }, function(error) {
                console.log('Error!!');
            });
        }

        chartData.days = [];
        chartData.price = [];
        chartData.volume = [];
        chartData.revenue = [];
        chartData.profit = [];

        var symbol = $scope.stock.symbol;
        if(symbol.indexOf('&')!=-1) {
            symbol = symbol.replace('&', '%26');
        };
        var duration = $scope.duration.radioModel > 1095 ? $scope.duration.radioModel : 1095;
        var fromDate = formatDate(duration+1);
        var toDate = formatDate(0);
        
        // get hostorical data from NSE
        $http({
    		method: 'get',
            cache: true,
            url: 'https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol='+symbol+'&series=EQ&fromDate='+fromDate+'&toDate='+toDate
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
                            CommonFactory.renderChart(chartData);
                        });
                    
                    }
                }
            });
    	}, function(error) {
            CommonFactory.toggleMessageVisibility('Something went wrong. Please try after some time !!', false);
        });
    }

    getAPIData();
  });
