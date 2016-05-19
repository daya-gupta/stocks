// set variables for environment
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongodb = require('mongodb');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  req.header("Access-Control-Allow-Headers", "*");
  // res.header("Access-Control-Allow-Origin");
  next();
});

app.get("/getStockSymbol",function(req,res){
    var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/stocksData';
	MongoClient.connect(url, function(err, db) {
		if(err) {
			console.log('unable to connect!');
			response.send('Unable to connect to database');
			db.close();
		} else {
			console.log('connected !');
			db.collection('stockSymbol').find().toArray(function(err, result) {
				if(err) {
					res.send(err);
				} else {
					res.json(result);
				}
			db.close();
			});
		}
	});
});

app.get("/getWatchlist",function(req,res){
  var MongoClient = mongodb.MongoClient;
	var url = 'mongodb://localhost:27017/stocksData';
	MongoClient.connect(url, function(err, db) {
		if(err) {
      // res.json({'message': 'Unable to connect to database'});
      // res.send(err);
			res.status(500).send(err);
			// db.close();
		} else {
			db.collection('watchlist').find().toArray(function(err, result) {
				if(err) {
          res.status(500).send(err);
				} else {
					res.json(result);
				}
			db.close();
			});
		}
	});
});

app.post("/saveStockProfile",function(req,res){
  // var json_data = {"name":"amita","pass":"12345"};
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/stocksData';
  // var query = require('url').parse(req.url,true).query;
  var symbol = req.body.symbol;
  MongoClient.connect(url, function(err, db) {
  	if(err) {
  		response.send('Unable to connect to database');
  	} else {
  		// check if record for stock already exist
  		db.collection('stockProfile').find({symbol: symbol}).toArray(function(err, result) {
  			if(err) {
  				res.send(err);
				db.close();
  			} else {
  				// record exist, do an update
  				// console.log('daya');
  				console.log(symbol);
  				// console.log(result);
  				if(result && result.length) {
  					console.log('update');
  					db.collection('stockProfile').update({symbol: symbol}, {symbol: req.body.symbol, profile: req.body.profile}, function(err, result) {
  					// db.collection('stockProfile').update({symbol: sampleStockProfile[3].symbol}, {symbol: sampleStockProfile[3].symbol, profile: sampleStockProfile[3].profile}, function(err, result) {
  						if(err) {
  							res.json(err);
  						} else {
  							res.json({saved: true});
  						}
						db.close();
  					});
  				}
  				//insert
  				else {
  					db.collection('stockProfile').insert({symbol: req.body.symbol, profile: req.body.profile}, function(err, result) {
  					// db.collection('stockProfile').insert({symbol: sampleStockProfile[5].symbol, profile: sampleStockProfile[5].profile}, function(err, result) {
  						console.log('insert');
  						if(err) {
  							res.json(err);
  						} else {
  							res.json({saved: true});
  						}
						db.close();
  					});
  				}
  			}
  		});
  	}
  });
});

app.get("/getStockProfile",function(req,res){
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/stocksData';
  var query = require('url').parse(req.url,true).query;
  MongoClient.connect(url, function(err, db) {
  	if(err) {
  		console.log('unable to connect!');
  		response.send('Unable to connect to database');
		db.close();
  	} else {
  		console.log('connected !');
  		db.collection('stockProfile').find({symbol: query.symbol}).toArray(function(err, result) {
  			if(err) {
  				res.send(err);
  			} else {
  				// console.log(result);
  				res.json(result);
  			}
			db.close();
  		});
  	}
  });
});

app.post("/deleteStock",function(req,res){
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/stocksData';
  var symbol = req.body.symbol;

  MongoClient.connect(url, function(err, db) {
  	if(err) {
  		response.send('Unable to connect to database');
  	} else {
  		// check if record for stock already exist
  		db.collection('watchlist').find({symbol: req.body.stock.symbol}).toArray(function(err, result) {
  			if(err) {
  				res.send(err);
				db.close();
  			} else {
  				// record exist, perform delete
  				if(result && result.length) {
  					db.collection('watchlist').remove({symbol: req.body.stock.symbol}, function(err, result) {
  						if(err) {
  							res.json(err);
  						} else {
  							res.json({saved: true});
  						}
						db.close();
  					});
  				}
  				//record does not exist. throw exception.
  				else {
					res.json({saved: false, message: 'Selected stock is not available in the watchlist..'});
  				}
  			}
  		});
  	}
  });
});

app.post("/addStock",function(req,res){

  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/stocksData';
  var symbol = req.body.symbol || req.body.stock.symbol;

  MongoClient.connect(url, function(err, db) {
  	if(err) {
  		response.send('Unable to connect to database');
  	} else {
  		// check if record for stock already exist
  		db.collection('watchlist').find({symbol: symbol}).toArray(function(err, result) {
  			if(err) {
  				res.send(err);
				db.close();
  			} else {
  				// if record exists, return
  				if(result && result.length) {
  					res.json({saved: false, message: 'Stock exists in watchlist !'});
  				} // add otherwise
  				else {
  					db.collection('watchlist').insert(req.body.stock, function(err, result) {
  						if(err) {
  							res.json(err);
  						} else {
  							res.json({saved: true, message: 'Stock added successfully.'});
  						}
						db.close();
  					});
  				}
  			}
  		});
  	}
  });
});

app.post("/editStock",function(req,res){

  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/stocksData';
  var symbol = req.body.symbol || req.body.stock.symbol;

  MongoClient.connect(url, function(err, db) {
  	if(err) {
  		response.send('Unable to connect to database');
  	} else {
  		// check if record for stock already exist
  		db.collection('watchlist').find({symbol: symbol}).toArray(function(err, result) {
  			if(err) {
  				res.send(err);
				db.close();
  			} else {
  				// record exist, do an update
  				if(result && result.length) {
  					db.collection('watchlist').update({symbol: symbol}, req.body.stock, function(err, result) {
  						if(err) {
  							res.json(err);
  						} else {
  							res.json({saved: true, message: 'Stock information edited successfully !'});
  						}
						db.close();
  					});
  				} // return otherwise
  				else {
  					res.json({saved: false, message: 'Stock not available in watchlist !'});
  				}
  			}
  		});
  	}
  });
});

// Set server port
app.listen(4000);
