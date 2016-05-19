# stocks

MEAN stack technologies are required for this application:

1. MongoDB
2. ExpressJS
3. AngularJS
4. Node JS



Steps to run the APP:

1. Do installations for NodeJS and MongoDB.
2. Go to node_project folder in command prompt and download dependencies by running following commands:
	'npm install'
	'bower install'
3. Run Grunt server using following command: (runs server on localhost:9000)
	'grunt serve'
3. Switch to stock-predictor folder and run commands from step 2.
4. Run Node server using following command: (runs server on localhost:4000)
	'nodemon server.js'
5. Run MongoDB server using following command: (port to mentioned)
	mongod --dbpath (path-of-data-folder)\db

Note: you can install 'Admin Mongo' which is free npm utility to run UI for mongo @ http://127.0.0.1:1234/ using 'npm start'.
Otherseise you can run command 'mongo' in shell to access serve.


6. go to browser and open 'localhost:9000', which would show you the home page of application :)

------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------

MEAN stack technologies are required for this application:

1. M-MongoDB
2. E-ExpressJS
3. A-AngularJS
4. N-NodeJS


Advantages of node:
1. Easy learning and development for JS people
2. Node is faster (faster development)
3. can work very well with multile concurrent connections (non blocking IO) 
4. can be integrated with persistence layer (mongoDB).
5. suitable for chat & gaming etc


Limitations of Node.js:
1. Single threaded programming.
2. Not suitable for computation intensive tasks. When it executes long running task, it will queue other requests.
3. Not ideal for executing synchronous and CPU intensive tasks.