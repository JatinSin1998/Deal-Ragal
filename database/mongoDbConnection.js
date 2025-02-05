/* eslint-disable no-console */
const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../logger');

//Set up default mongoose connection
const mongoDB = config.DATABASE;
// mongoose.connect(mongoDB, {
//   dbName: 'myDatabase',
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
//   useFindAndModify: false,
// });

// //Get the default connection
// const db = mongoose.connection;
// //mongoose.set('debug', process.env.MONGOOSE_SET);


// // When successfully connected
// db.on('connected', function () {
//   logger.info('Mongoose connection open');
// });

// // If the connection throws an error
// db.on('error', function (err) {
//   logger.info('Mongoose default connection error: ' + err);
// });

// // When the connection is disconnected
// db.on('disconnected', function () {
//   logger.info('Mongoose default connection disconnected');
// });

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDB, {
      dbName: 'dealregal',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    console.log('✅ Mongoose connection open');
  } catch (err) {
    console.error('❌ Mongoose connection error:', err.message);
    process.exit(1);
  }
};

connectDB();