const server = require('https').createServer();
const schedule = require('node-schedule');

// eslint-disable-next-line no-undef
io = module.exports = require('socket.io')(server, { allowEIO3: true });

const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const logger = (module.exports = require('../../logger'));
const CONST = require('../../constant');
const signupActions = require('../helper/signups/index');
const commonHelper = require('../helper/commonHelper');
const gamePlayActionsSORAT = require('../SORAT');
const gamePlayActionsANDARBAHAR = require('../andarbahar');
const gamePlayActionsRoulette = require('../roulette');
const gamePlayActions = require('../teenpatti/');


const GameUser = mongoose.model('users');
const gamePlayActionsSpinner = require('../SpinerGame');
//const OnePlayActions = require('../OneToTwelve/');


const { registerUser, changePassword } = require('../helper/signups/signupValidation');
const mainCtrl = require('./mainController');
const { sendEvent, sendDirectEvent } = require('../helper/socketFunctions');
const { userReconnect } = require('../SORAT/reConnectFunction');
const { userReconnectRoulette } = require('../roulette/reConnectFunction');

const { userReconnectSpinner } = require('../SpinerGame/reconnect');

const { getBannerList } = require('./adminController');

logger.info("gamePlayActionsRoulette ", gamePlayActionsRoulette)

const myIo = {};

// create a init function for initlize the socket object
myIo.init = function (server) {
    // attach server with socket
    // eslint-disable-next-line no-undef
    io.attach(server);

    // eslint-disable-next-line no-undef
    io.on('connection', async (socket) => {

        try {
            logger.info("Socket connected ===> ", socket.id);
            sendEvent(socket, CONST.DONE, {});

            socket.on('req', async (data) => {
                console.log("data ", data)
                console.log("data.payload ", data.payload)

                const decryptObj = commonHelper.decrypt(data.payload);

                const payload = JSON.parse(decryptObj);
                console.log("payload ::::::::::::::::", payload)
                console.log("payload ::::::::::::::::", payload.eventName)

                switch (payload.eventName) {

                    case CONST.PING: {
                        sendEvent(socket, CONST.PONG, {});
                        break;
                    }

                    case CONST.CHECK_MOBILE_NUMBER: {
                        try {
                            signupActions.checkMobileNumber(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js check Mobile Number User error => ', error);
                        }
                        break;
                    }

                    case CONST.REGISTER_USER: {
                        try {
                            await registerUser(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js Register User Table error => ', error);
                        }
                        break;
                    }
                    case CONST.CHANGEPASSWORD: {
                        try {
                            await changePassword(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js Register User Table error => ', error);
                        }
                        break;
                    }

                    case CONST.SEND_OTP: {
                        try {
                            let result = await mainCtrl.otpSend(payload.data);
                            sendEvent(socket, CONST.SEND_OTP, result);
                        } catch (error) {
                            logger.error('socketServer.js Send Otp error => ', error);
                        }
                        break;
                    }

                    case CONST.VERIFY_OTP: {
                        try {
                            const result = await mainCtrl.verifyOTP(payload.data);
                            if (result.status && payload.data.otpType === 'signup') {
                                sendEvent(socket, CONST.VERIFY_OTP, result.data);
                                await registerUser(payload.data, socket);
                            }
                            else if (result.status && payload.data.otpType == 'login') {
                                await signupActions.userLogin(payload.data, socket);
                            }
                            else {
                                sendEvent(socket, CONST.VERIFY_OTP, { verified: false });
                            }
                        } catch (error) {
                            logger.error('socketServer.js Verify Otp error => ', error);
                        }
                        break;
                    }

                    case CONST.LOGIN: {
                        try {
                            await signupActions.userLogin(payload.data, socket);
                        } catch (e) {
                            logger.info('Exception userLogin :', e);
                        }
                        break;
                    }

                    case CONST.DASHBOARD: {
                        try {
                            await signupActions.appLunchDetail(payload.data, socket);
                        } catch (e) {
                            logger.info('CONST.DASHBOARD Exception appLunchDetail :', e);
                        }
                        break;
                    }


                    case CONST.GET_TEEN_PATTI_ROOM_LIST: {
                        try {
                            await gamePlayActions.getBetList(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js GET_TEEN_PATTI_ROOM_LIST error => ', error);
                        }
                        break;
                    }

                    // //OneTotwelve
                    // case CONST.ONE_JOIN_TABLE: {
                    //     socket.uid = payload.data.playerId;
                    //     socket.sck = socket.id;

                    //     await OnePlayActions.joinTable(payload.data, socket);
                    //     break;
                    // }

                    // case CONST.ONE_LEAVE_TABLE: {
                    //     await OnePlayActions.leaveTable(payload.data, socket);
                    //     break;
                    // }

                    // case CONST.ONE_ACTION: {
                    //     await OnePlayActions.action(payload.data, socket);
                    //     break;
                    // }


                    // SORAT GAME Event 
                    case CONST.SORAT_PLAYGAME: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;

                        await gamePlayActionsSORAT.sortjointable(payload.data, socket);
                        break;
                    }

                    case CONST.ACTIONSORAT: {
                        await gamePlayActionsSORAT.actionslot(payload.data, socket);
                        break;
                    }

                    case CONST.ClearBetSORAT: {
                        await gamePlayActionsSORAT.ClearBetSORAT(payload.data, socket);
                        break;
                    }

                    case CONST.LEAVETABLESORAT: {
                        await gamePlayActionsSORAT.leaveTable(payload.data, socket);
                        break;
                    }

                    case CONST.RECONNECT: {
                        await userReconnect(payload.data, socket);
                        break;
                    }
                    //=============================
                    // Andar Bahar GAME Event 
                    case CONST.ANADAR_BAHAR_PLAYGAME: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;

                        await gamePlayActionsANDARBAHAR.joinTable(payload.data, socket);
                        break;
                    }

                    case CONST.ACTION_ANADAR_BAHAR: {
                        await gamePlayActionsANDARBAHAR.action(payload.data, socket);
                        break;
                    }

                    // case CONST.ClearBetANADAR_BAHAR: {
                    //     await gamePlayActionsANDARBAHAR.ClearBetSORAT(payload.data, socket);
                    //     break;
                    // }

                    case CONST.LEAVETABLEANADAR_BAHAR: {
                        await gamePlayActionsANDARBAHAR.leaveTable(payload.data, socket);
                        break;
                    }

                    case CONST.CHECKOUT_ANADAR_BAHAR: {
                        await gamePlayActionsANDARBAHAR.CHECKOUT_ANADAR_BAHAR(payload.data, socket);
                        break;
                    }

                    // case CONST.RECONNECT: {
                    //     await userReconnect(payload.data, socket);
                    //     break;
                    // }
                    //====================================

                    // SPinner GAME Event 
                    case CONST.SPINNER_GAME_PLAYGAME: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;

                        await gamePlayActionsSpinner.SPINNER_JOIN_TABLE(payload.data, socket);
                        break;
                    }

                    case CONST.ACTIONSPINNNER: {
                        await gamePlayActionsSpinner.actionSpin(payload.data, socket);
                        break;
                    }

                    // case CONST.ClearBet: {
                    //     await gamePlayActionsSpinner.ClearBet(payload.data, socket);
                    //     break;
                    // }

                    case CONST.DoubleBet: {
                        await gamePlayActionsSpinner.DoubleBet(payload.data, socket);
                        break;
                    }

                    case CONST.PSPINER: {
                        await gamePlayActionsSpinner.printMytranscation(payload.data, socket);
                        break;
                    }

                    case CONST.LEAVETABLESPINNER: {
                        await gamePlayActionsSpinner.leaveTable(payload.data, socket);
                        break;
                    }

                    case CONST.RECONNECTSPINNER: {
                        await userReconnectSpinner(payload.data, socket);
                        break;
                    }

                    //============================================================


                    // ROULETTE GAME Event 
                    case CONST.ROULETTE_JOIN_TABLE: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;
                        logger.info("Table Name =======> ", payload.data.whichTable);
                        await gamePlayActionsRoulette.ROULETTE_GAME_JOIN_TABLE(payload.data, socket);
                        break;
                    }

                    case CONST.ACTIONROULETTE: {
                        await gamePlayActionsRoulette.actionSpin(payload.data, socket);
                        break;
                    }

                    case CONST.GETPLAYERDATA: {
                        await gamePlayActionsRoulette.getPlayerData(payload.data, socket);
                        break;
                    }

                    case CONST.REMOVEBETROULETTE: {
                        await gamePlayActionsRoulette.REMOVEBETROULETTE(payload.data, socket);
                        break;
                    }


                    case CONST.ClearBet: {
                        await gamePlayActionsRoulette.ClearBet(payload.data, socket);
                        break;
                    }

                    case CONST.DoubleBet: {
                        await gamePlayActionsRoulette.DoubleBet(payload.data, socket);
                        break;
                    }

                    case CONST.NEIGHBORBET: {
                        await gamePlayActionsRoulette.NEIGHBORBET(payload.data, socket);
                        break;
                    }

                    case CONST.PASTBET: {
                        await gamePlayActionsRoulette.PASTBET(payload.data, socket);
                        break;
                    }


                    case CONST.PASTBETSAVE: {
                        await gamePlayActionsRoulette.PASTBETSAVE(payload.data, socket);
                        break;
                    }

                    case CONST.LEAVETABLEROULETTE: {
                        await gamePlayActionsRoulette.leaveTable(payload.data, socket);
                        break;
                    }

                    //Teen Patti

                    //Teenpatti
                    case CONST.GET_TEEN_PATTI_ROOM_LIST: {
                        try {
                            await gamePlayActions.getBetList(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js GET_TEEN_PATTI_ROOM_LIST error => ', error);
                        }
                        break;
                    }

                    case CONST.TEEN_PATTI_SIGN_UP: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;

                        await gamePlayActions.joinTable(payload.data, socket);
                        break;
                    }

                    case CONST.TEEN_PATTI_SHOW: {
                        await gamePlayActions.show(payload.data, socket);
                        break;
                    }

                    case CONST.TEEN_PATTI_CHAL: {
                        await gamePlayActions.chal(payload.data, socket);
                        break;
                    }

                    case CONST.TEEN_PATTI_PACK: {
                        await gamePlayActions.cardPack(payload.data, socket);
                        break;
                    }

                    case CONST.TEEN_PATTI_CARD_SEEN: {
                        await gamePlayActions.seeCard(payload.data, socket);
                        break;
                    }

                    case CONST.TEEN_PATTI_LEAVE_TABLE: {
                        await gamePlayActions.leaveTable(payload.data, socket);
                        break;
                    }


                    case CONST.RECONNECTROULETTE: {
                        await userReconnectRoulette(payload.data, socket);
                        break;
                    }


                    case CONST.HISTORY: {
                        await gamePlayActionsRoulette.HISTORY(payload.data, socket);
                        break;
                    }

                    //====================================




                    //====================================
                    case CONST.BANNER: {
                        const result = await getBannerList(payload.data, socket);
                        sendEvent(socket, CONST.BANNER, result);
                        break;
                    }

                    default:
                        sendEvent(socket, CONST.INVALID_EVENT, {
                            msg: 'This Event Is Nothing',
                        });
                        break;
                }
            });

            /* Disconnect socket */
            socket.on('disconnect', async () => {
                try {
                    logger.info('\n<==== disconnect socket id ===>', socket.id, '\n Disconnect Table Id =>', socket.tbid);

                    const playerId = socket.uid;
                    let jobId = CONST.DISCONNECT + playerId;
                    logger.info('schedule USER Start DISCONNECTED jobId typeof : ', jobId, typeof jobId);

                    //object player is disconnect or not


                    let wh = {
                        sckId: socket.id,
                    };

                    let update = {
                        $set: {
                            sckId: "",
                        },

                    };
                    logger.info('\nuserSesssionSet wh : ', wh, update);

                    await GameUser.findOneAndUpdate(wh, update);

                    let timerSet = Date.now() + 60000;
                    //await setDelay(jobId, new Date(delay), 'disconnect');
                    schedule.scheduleJob(jobId.toString(), timerSet, async function () {
                        const result = schedule.cancelJob(jobId);

                        logger.info('after USER JOB CANCELLED scheduleJob: ', result);
                        await gamePlayActionsSORAT.disconnectTableHandle(socket);
                    });
                } catch (error) {
                    logger.error('socketServer.js error when user disconnect => ', error);
                }
            });
        } catch (err) {
            logger.info('socketServer.js error => ', err);
        }
    });
};

module.exports = myIo;
