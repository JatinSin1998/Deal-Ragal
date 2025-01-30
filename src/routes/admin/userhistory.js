const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;

const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');


const UserWalletTracks = mongoose.model('userWalletTracks');
const RouletteUserHistory = mongoose.model('RouletteUserHistory');

/**
* @api {get} /admin/rouletteHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/RouletteGameHistory', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            username = '', 
            startDate = '', 
            endDate = '' 
        } = req.query;

        // Construct the query object
        const query = {
            afterplaypoint: { $ne: 0 }, // Ensure afterPlayPoint is not zero
        };

        // Add username filter if provided
        if (username) {
            query.username = new RegExp(`^${username}`, 'i'); // Matches usernames starting with the provided string
        }

        // Add date range filter if both startDate and endDate are provided
        if (startDate && endDate) {
            query.createdAt = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }
        // Fetch the data with pagination
        const tabInfo = await RouletteUserHistory.find(query)
            .sort({ createdAt: -1 }) // Sort by creation date (descending)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Count the total documents matching the query
        const totalDocuments = await RouletteUserHistory.countDocuments(query);

        // Respond with the data
        res.json({ 
            gameHistoryData: tabInfo, 
            totalDocuments, 
            totalPages: Math.ceil(totalDocuments / limit), 
            currentPage: parseInt(page) 
        });
    } catch (error) {
        logger.error('admin/dahboard.js get RouletteGameHistory error => ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



/**
* @api {get} /admin/BaraKaDumGameHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/BaraKaDumGameHistory', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const rouletteHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RHRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            }, {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', rouletteHistoryData);

        res.json({ gameHistoryData: rouletteHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {get} /admin/WheelofFortuneGameHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/WheelofFortuneGameHistory', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const rouletteHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RHRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            }, {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', rouletteHistoryData);

        res.json({ gameHistoryData: rouletteHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/AndarBaharGameHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/AndarBaharGameHistory', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const rouletteHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RHRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            }, {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', rouletteHistoryData);

        res.json({ gameHistoryData: rouletteHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/SpinGameHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/SpinGameHistory', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const rouletteHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RHRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            }, {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', rouletteHistoryData);

        res.json({ gameHistoryData: rouletteHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/SoratGameHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/SoratGameHistory', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const rouletteHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RHRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            }, {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', rouletteHistoryData);

        res.json({ gameHistoryData: rouletteHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/rouletteHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/completeWithdrawal', async (req, res) => {
    try {
        console.info('completeWithdrawal  => ', req.query);

        const completeWithdrawalData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "CWRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CWRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CWRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', completeWithdrawalData);

        res.json({ completeWithdrawalData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/completeDeposite', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const completeDepositeData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "CDRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CDRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CDRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', completeDepositeData);

        res.json({ completeDepositeData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/registerRaferralBonus', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const registerRaferralBonusData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RRRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];


        logger.info('admin/dahboard.js post dahboard  error => ', registerRaferralBonusData);

        res.json({ registerRaferralBonusData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/myRaferrals', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const myRaferralsData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "MRRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "MRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "MRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];


        logger.info('admin/dahboard.js post dahboard  error => ', myRaferralsData);

        res.json({ myRaferralsData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {get} /admin/rouletteHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetSpinnerHistoryData', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        console.info('completeWithdrawal  => ', req.query);
        if (req.query.userId == undefined) {
            res.json({ GameHistoryData: [] });
            return false
        }
        const BlackandWhiteData = await UserWalletTracks.find({ userId: MongoID(req.query.userId), "gameType": "Spinner" },
            { DateandTime: 1, userId: 1, oppChips: 1, oppWinningChips: 1, chips: 1, winningChips: 1, trnxAmount: 1, gameType: 1, trnxTypeTxt: 1 }).sort({ DateTime: -1 })


        console.log("GetSpinnerHistoryData ", BlackandWhiteData)


        res.json({ GameHistoryData: BlackandWhiteData });

    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/GetSoratHistoryData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetSoratHistoryData', async (req, res) => {
    try {


        console.info('GetSoratHistoryData  => ', req.query);
        if (req.query.userId == undefined) {
            res.json({ GameHistoryData: [] });
            return false
        }
        const aviatorHistoryData = await UserWalletTracks.find({ userId: MongoID(req.query.userId), "gameType": "Sorat" },
            { DateandTime: 1, userId: 1, oppChips: 1, oppWinningChips: 1, chips: 1, winningChips: 1, trnxAmount: 1, gameType: 1, trnxTypeTxt: 1 }).sort({ DateTime: -1 })

        console.log("GetSoratHistoryData ", aviatorHistoryData)

        logger.info('admin/dahboard.js post dahboard  error => ', aviatorHistoryData);

        res.json({ GameHistoryData: aviatorHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {get} /admin/GetSoratHistoryData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetandarbaharHistoryData', async (req, res) => {
    try {


        console.info('GetSoratHistoryData  => ', req.query);
        if (req.query.userId == undefined) {
            res.json({ GameHistoryData: [] });
            return false
        }
        const aviatorHistoryData = await UserWalletTracks.find({ userId: MongoID(req.query.userId), "gameType": "andarbahar" },
            { DateandTime: 1, userId: 1, oppChips: 1, oppWinningChips: 1, chips: 1, winningChips: 1, trnxAmount: 1, gameType: 1, trnxTypeTxt: 1 }).sort({ DateTime: -1 })

        console.log("GetandarbaharHistoryData ", aviatorHistoryData)

        logger.info('admin/dahboard.js post dahboard  error => ', aviatorHistoryData);

        res.json({ GameHistoryData: aviatorHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/GetOneToTwelveHistoryData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetOneToTwelveHistoryData', async (req, res) => {
    try {


        console.info('GetOneToTwelveHistoryData  => ', req.query);
        if (req.query.userId == undefined) {
            res.json({ GameHistoryData: [] });
            return false
        }
        const aviatorHistoryData = await UserWalletTracks.find({ userId: MongoID(req.query.userId), "gameType": "OneToTwelve" },
            { DateandTime: 1, userId: 1, oppChips: 1, oppWinningChips: 1, chips: 1, winningChips: 1, trnxAmount: 1, gameType: 1, trnxTypeTxt: 1 }).sort({ DateTime: -1 })

        console.log("GetOneToTwelveHistoryData ", aviatorHistoryData)

        logger.info('admin/dahboard.js post dahboard  error => ', aviatorHistoryData);

        res.json({ GameHistoryData: aviatorHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/GetRouletteHistoryData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/GetRouletteHistoryData', async (req, res) => {
    try {


        console.info('GetRouletteHistoryData  => ', req.query);
        if (req.query.userId == undefined) {
            res.json({ GameHistoryData: [] });
            return false
        }
        const aviatorHistoryData = await UserWalletTracks.find({ userId: MongoID(req.query.userId), gameType : "roulette"},
            { createdAt: 1, userId: 1, oppChips: 1,ballposition:1, oppWinningChips: 1, chips: 1, winningChips: 1, trnxAmount: 1, gameType: 1, trnxTypeTxt: 1 }).sort({ createdAt: -1 })

        console.log("GetRouletteHistoryData ", aviatorHistoryData)

        logger.info('admin/dahboard.js post dahboard  error => ', aviatorHistoryData);

        res.json({ GameHistoryData: aviatorHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


module.exports = router;