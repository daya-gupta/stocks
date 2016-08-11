'use strict';

angular.module('stockApp')
  .factory('CommonFactory', function ($rootScope, $http, $timeout) {
  	
    var factoryObj = null;

    $rootScope.rootScopeData = {
      valueNse: null,
      changeNse: null,
      pChangeNse: null,
      messageString: null,
      messageStatus: null
    };

    function formatDate(duration) {
        var date = moment().subtract(duration, 'days').format('L').split('/');
        var month = date.shift();
        date.splice(1,0,month);
        date.join('-');
        return date;
    }

    function updateNseValue() {
        $http.get('https://www1.nseindia.com/homepage/Indices1.json').then(function(response) {
          $rootScope.rootScopeData.valueNse = response.data.data[1].lastPrice;
          $rootScope.rootScopeData.changeNse = response.data.data[1].change;
          $rootScope.rootScopeData.pChangeNse = response.data.data[1].pChange;
        });
    }

    var timeoutPrimise = null;

    function toggleMessageVisibility(message, status) {
        if(timeoutPrimise) {
          $timeout.cancel(timeoutPrimise);
        }
        $rootScope.rootScopeData.messageString = message;
        $rootScope.rootScopeData.messageStatus = status;
        timeoutPrimise = $timeout(function() {
            $rootScope.rootScopeData.messageString = null;
        }, 4000);
    }

    function renderChart(chartData) {
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

    function getNewsData(stock) {
        var searchSuggestion = [];
        // get bse-id for stock
        $('#myModalLabel').text(stock.name);
        $http.get('http://www.bseindia.com/SiteCache/1D/GetQuoteData.aspx?Type=EQ&text='+stock.symbol).then(function(response) {
            searchSuggestion = $(response.data);

            searchSuggestion = searchSuggestion.find('li a').attr('href').split('/');

            searchSuggestion = searchSuggestion[searchSuggestion.length-2];

            // notification
            $http({
                method: 'get',
                url: 'http://www.bseindia.com/stock-share-price/Notification.aspx?scripcode='+searchSuggestion
            }).then(function(response) {
                if(response && response.data) {
                    var notificationData = $(response.data).find('#divNotification');
                    notificationData = $(notificationData.find('tr'));
                    notificationData.splice(0,2);
                    console.log(notificationData);
                    $('#notification').html(notificationData);
                }
            }, function() {
                factoryObj.toggleMessageVisibility('An error occured while fetching news. !!', false);
            });

            // http://www.bseindia.com/stock-share-price/SiteCache/TabResult.aspx?text=531500&type=news
            // news
            $http({
                method: 'get',
                url: 'http://www.bseindia.com/stock-share-price/SiteCache/TabResult.aspx?text='+searchSuggestion+'&type=news'
            }).then(function(response) {
                if(response && response.data) {
                    console.log($(response.data));
                    var newsData = $(response.data).find('table');
                    newsData = $(newsData.find('tr'));
                    // notificationData.splice(0,1);
                    $('#news').html(newsData);
                }
            }, function() {
                factoryObj.toggleMessageVisibility('An error occured while fetching news. !!', false);
            });
        });
    }

    factoryObj = {
      formatDate: formatDate,
      updateNseValue: updateNseValue,
      toggleMessageVisibility: toggleMessageVisibility,
      renderChart: renderChart,
      getNewsData: getNewsData
    };

    return factoryObj;
  });

