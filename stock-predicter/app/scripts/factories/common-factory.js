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
        // $http.get('https://www1.nseindia.com/homepage/Indices1.json').then(function(response) {
        //   $rootScope.rootScopeData.valueNse = response.data.data[1].lastPrice;
        //   $rootScope.rootScopeData.changeNse = response.data.data[1].change;
        //   $rootScope.rootScopeData.pChangeNse = response.data.data[1].pChange;
        // });
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

    function getPreviousProfitAndRevenue(currentIndex) {
        var profitAndRevenue = {profit: 0, revenue: 0};
        var dataArrayLength = chartData.profit.length;
        var counter = 0;
        for(var i=currentIndex-1; i>=0; i--) {
            if(chartData.profit[i]) {
                if(++counter === 4) {
                    profitAndRevenue.profit = chartData.profit[i];
                    profitAndRevenue.revenue = chartData.revenue[i];
                    break;
                }
            }
        }
        return profitAndRevenue;
    }

    function getIndexOfLastNonNullActualPrice(currentIndex) {
      for(var index = currentIndex-1; index>=0; index--) {
        if(chartData.actualPrice[index]) {
          break;
        }
      }
      return index;
    }

    function renderChart(data) {
      window.chartData = data;

      // manipulate price array to mitigate the split effect
      for(var index=chartData.profit.length-1; index>0; index--) {
        // condition for split
        if(chartData.price[index-1]/chartData.price[index]>1.3) {
          var splitRatio = Math.round(chartData.price[index-1]*100/chartData.price[index])/100;
          for(var innerIndex=index-1; innerIndex>=0; innerIndex--) {
            chartData.price[innerIndex] = chartData.price[innerIndex]/splitRatio;
          }
        }
      }

      var originActualPrice = Math.round(_.sum(chartData.price.slice(0,350))/350);
      chartData.actualPrice = [];
      chartData.actualPriceUpper = [];
      chartData.actualPrice.length = chartData.price.length;
      chartData.actualPriceUpper.length = chartData.price.length;

      if(chartData.price.length > 400) {
          _.each(chartData.price, function(item, index) {
              if(index === 300) {
                  // chartData.actualPrice[index+50] = originActualPrice;
                  chartData.actualPrice[index] = originActualPrice;
              } else if(index > 300) {
                if(chartData.profit[index] !== null) {
                  var indexOfLastNonNullActualPrice = getIndexOfLastNonNullActualPrice(index);
                  // when profit and revenue are positive;
                  if(chartData.profit[index] > 0) {
                    var previousProfitAndRevenue = getPreviousProfitAndRevenue(index);
                    var currentProfitAndRevenue = {profit: chartData.profit[index], revenue: chartData.revenue[index]};
                    var percentageProfitChange = Number(((currentProfitAndRevenue.profit - previousProfitAndRevenue.profit) / Math.abs(previousProfitAndRevenue.profit)).toFixed(2));
                    var percentageRevenueChange = Number(((currentProfitAndRevenue.revenue - previousProfitAndRevenue.revenue) / Math.abs(previousProfitAndRevenue.revenue)).toFixed(2));
                    if(percentageProfitChange + percentageRevenueChange <= .42) {
                      if(percentageProfitChange + percentageRevenueChange <= 0) {
                        if(percentageProfitChange >= .05) {
                          // increase actual price slightly
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .03*(percentageProfitChange))).toFixed(2));
                        } else if(percentageProfitChange < .05 && percentageProfitChange > -.1) {
                          // keep the actual price intact
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]).toFixed(2));
                        } else {
                          chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .33*(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        }
                      } else {
                        chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .33*(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      } 
                      // chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .33*(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                    } else if(percentageProfitChange + percentageRevenueChange > .42 && percentageProfitChange + percentageRevenueChange <= .84) {
                      // if most of change is driven by profit
                      if(Math.abs(percentageProfitChange) > Math.abs(.66*(percentageProfitChange + percentageRevenueChange))) {
                        chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .18 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      } else {
                        chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .25 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      }
                    } else if(percentageProfitChange + percentageRevenueChange > .84 && percentageProfitChange + percentageRevenueChange <= 1.68){
                      // if most of change is driven by profit
                      if(Math.abs(percentageProfitChange) > Math.abs(.66*(percentageProfitChange + percentageRevenueChange))) {
                        // chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .1 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .15 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      } else {
                        chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .2 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      }
                    } else {
                      // if most of change is driven by profit
                      if(Math.abs(percentageProfitChange) > Math.abs(.66*(percentageProfitChange + percentageRevenueChange))) {
                        // chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .08 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                        chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .12 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      } else {
                        chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*( 1 + .15 *(percentageProfitChange + percentageRevenueChange))).toFixed(2));
                      }
                    }
                  // when profit/revenue are negative;
                  } else {
                    chartData.actualPrice[index+50] = Number((chartData.actualPrice[indexOfLastNonNullActualPrice]*(.75)).toFixed(2));
                  }
                }
              }
              if(!chartData.actualPrice[index]) {
                chartData.actualPriceUpper[index] = null;
              } else {
                chartData.actualPriceUpper[index] = Math.round(1.3 * chartData.actualPrice[index] * 100)/100;
              }
          });

          _.each(chartData.actualPrice, function(item, index) {
              if(!chartData.actualPrice[index]) {
                chartData.actualPrice[index] = null;
              }
          });
      }

      chartData.movingAverage = [];
      var movingAverageBase = 33;
      _.each(chartData.price, function(item, index) {
        if(index < movingAverageBase) {
          chartData.movingAverage.push(null);
        } else {
          chartData.movingAverage.push(Math.round(_.sum(chartData.price.slice(index-movingAverageBase, index))/movingAverageBase));
        }
      })

      console.log(chartData);

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
                  crosshair: true,
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
                  max: _.max(chartData.price) > _.max(chartData.actualPrice) ? _.max(chartData.price) : _.max(chartData.actualPrice),
                  // min: _.min(chartData.price)
                  min: _.min(chartData.price) > _.min(chartData.actualPrice) ? _.min(chartData.actualPrice) : _.min(chartData.price)
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
              series: [
                {
                    name: 'Volume',
                    type: 'column',
                    yAxis: 2,
                    data: chartData.volume,
                    tooltip: {
                        valueSuffix: ' ths'
                    },
                    color: Highcharts.getOptions().colors[3]
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
                    name: 'Actual Price',
                    type: 'spline',
                    yAxis: 0,
                    data: chartData.actualPrice,
                    connectNulls: true,
                    tooltip: {
                        valueSuffix: ''
                    },
                    color: Highcharts.getOptions().colors[4],
                    fillColor: {
                        linearGradient: [0, 0, 0, 200],
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    }
                }, {
                    name: 'Actual Price U',
                    type: 'spline',
                    yAxis: 0,
                    data: chartData.actualPriceUpper,
                    connectNulls: true,
                    dashStyle: 'shortdot',
                    tooltip: {
                        valueSuffix: ''
                    },
                    color: Highcharts.getOptions().colors[5],
                    fillColor: {
                        linearGradient: [0, 0, 0, 200],
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    }
                }, {
                    name: 'moving Price',
                    type: 'spline',
                    yAxis: 0,
                    data: chartData.movingAverage,
                    connectNulls: true,
                    dashStyle: 'shortdot',
                    tooltip: {
                        valueSuffix: ''
                    },
                    color: Highcharts.getOptions().colors[6],
                    fillColor: {
                        linearGradient: [0, 0, 0, 200],
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    }
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
                }
              ]
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

