'use strict';

/**
 * @ngdoc function
 * @name stockApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the stockApp
 */
angular.module('stockApp')
  .controller('MainCtrl', function ($scope, $http) {
  	var chartData = {
  		days: [],
  		price: [],
  		volume: []
  	};
  	
  	this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    getAPIData();

    function renderTabularData(data) {
        $('#tabular-data table').html(data);
    }

    function appendTransform(defaults) {
        console.log(defaults[0]());
        return defaults;
    }

    function formatDate(duration) {
        var date = moment().subtract(duration, 'days').format('L').split('/');
        var month = date.shift();
        date.splice(1,0,month);
        date.join('-')
        return date;
    }

    var sampleProfit = [{
            quarter: 'Q1',
            date: '20-Aug-2014',
            profit: 72.0,
            revenue: 6699.7
        }, {
            quarter: 'Q2',
            date: '13-Nov-2014',
            profit: 110.9,
            revenue: 9155.9
        }, {
            quarter: 'Q3',
            date: '13-Feb-2015',
            profit: 78.0,
            revenue: 9642.3
        }, {
            quarter: 'Q4',
            date: '28-May-2015',
            profit: 2.9,
            revenue: 12421.3
        },{
            quarter: 'Q1',
            date: '04-Sep-2015',
            profit: 121.5,
            revenue: 8452.5
        },{
            quarter: 'Q2',
            date: '16-Nov-2015',
            profit: 138.7,
            revenue: 10709.5
        },{
            quarter: 'Q3',
            date: '11-Feb-2016',
            profit: 139.7,
            revenue: 9049.9
        }];
        

    function getAPIData() {
    	chartData.days = [];
    	chartData.price = [];
    	chartData.volume = [];
        chartData.revenue = [];
        chartData.profit = [];
        var symbol = 'RAJESHEXPO';
        var duration = 430;
        var fromDate = formatDate(duration+1);
        var toDate = formatDate(0);
        $http({
    		method: 'get',
            // url: 'http://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol=RAJESHEXPO&series=EQ&fromDate=undefined&toDate=undefined&datePeriod=1month'
            url: 'http://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol='+symbol+'&series=EQ&fromDate='+fromDate+'&toDate='+toDate
    		// url: 'http://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/getHistoricalData.jsp?symbol=RAJESHEXPO&series=EQ&fromDate=02-10-2014&toDate=07-04-2016'
    	}).then(function(response) {
    		var day = $(response.data);
            renderTabularData(day[4].innerHTML);
            var dataRows = $(day[4]).find('tr');
            var headerArray = dataRows.splice(0,1);
            angular.forEach(_.reverse(dataRows), function(obj) {
                var dataColumns = $(obj).find('td');
                chartData.days.push(dataColumns[0].innerHTML);
                chartData.price.push(Number(dataColumns[7].innerHTML.replace(/,/g,'')));
                chartData.volume.push(Number(dataColumns[8].innerHTML.replace(/,/g,''))/1000);
            });
            var index = -1;
            _.each(chartData.days, function(obj) {
                chartData.profit.push(null);
                chartData.revenue.push(null);
            });
            console.log(chartData.profit);
            _.each(sampleProfit, function(obj) {
                index = _.indexOf(chartData.days, obj.date);
                if(index !== -1) {
                    chartData.profit[index] = obj.profit;
                    chartData.revenue[index] = obj.revenue;
                }
            })
            console.log(chartData.profit);
    		// console.log(dataRows);
    		renderChart();
    	});
    }

    // chartData.days = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  	// chartData.volume = [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4];
  	// chartData.price = [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6];
    // renderChart();

    function renderChart() {
    	$(function () {
    	    $('#container').highcharts({
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
    	            crosshair: true
    	        }],
    	        yAxis: [{ // secondary yAxis
    	            labels: {
    	                format: 'Rs {value}',
    	                style: {
    	                    color: Highcharts.getOptions().colors[1]
    	                }
    	            },
    	            title: {
    	                text: 'Price',
    	                style: {
    	                    color: Highcharts.getOptions().colors[1]
    	                }
    	            }
    	        }, { // Primary yAxis
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
                },  { // Secondary yAxis
    	            title: {
    	                text: 'Volume (thousand)',
    	                style: {
    	                    color: Highcharts.getOptions().colors[0]
    	                }
    	            },
    	            labels: {
    	                // format: '{value} mm',
    	                style: {
    	                    color: Highcharts.getOptions().colors[0]
    	                }
    	            },
    	            opposite: true
    	        }, { // Tertiary yAxis
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
    	            shared: true
    	        },
    	        // legend: {
    	        //     layout: 'vertical',
    	        //     align: 'left',
    	        //     x: 120,
    	        //     verticalAlign: 'top',
    	        //     y: 100,
    	        //     floating: true,
    	        //     backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
    	        // },
                legend: {}, 
    	        series: [{
    	            name: 'Volume',
    	            type: 'column',
    	            yAxis: 2,
    	            data: chartData.volume,
    	            tooltip: {
    	                valueSuffix: ' ths'
    	            }
    	        }, {
    	            name: 'price',
    	            type: 'spline',
                    yAxis: 0,
    	            data: chartData.price,
    	            tooltip: {
    	                valueSuffix: ''
    	            }
    	        }, {
                    name: 'profit',
                    type: 'column',
                    connectNulls: true,
                    yAxis: 3,
                    data: chartData.profit,
                    // data: [1016, null, null, null, null, null, null, null, null, null, 1018.2, null, null, null, null, null, null, null, null, null, , null, null, null, null, null, null, null, null, null, , null, null, null, null, null, null, null, null, null, 1016.7],
                    // marker: {
                    //     enabled: false
                    // },
                    dashStyle: 'shortdot',
                    tooltip: {
                        valueSuffix: ' Cr'
                    }

                }, {
                    name: 'revenue',
                    type: 'spline',
                    connectNulls: true,
                    yAxis: 1,
                    data: chartData.revenue,
                    // data: [1016, null, null, null, null, null, null, null, null, null, 1018.2, null, null, null, null, null, null, null, null, null, , null, null, null, null, null, null, null, null, null, , null, null, null, null, null, null, null, null, null, 1016.7],
                    // marker: {
                    //     enabled: false
                    // },
                    dashStyle: 'shortdot',
                    tooltip: {
                        valueSuffix: ' Cr'
                    }

                }]
    	    });
    	});
    }
  });
