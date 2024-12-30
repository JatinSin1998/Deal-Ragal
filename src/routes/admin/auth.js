const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const express = require("express");
const router = express.Router();
const mainCtrl = require("../../controller/adminController");
const { OK_STATUS, BAD_REQUEST } = require("../../../config");
const logger = require("../../../logger");
const andarbahar = require("../../andarbahar");
const SpinnerTables = mongoose.model("SpinnerTables");
const OnePlayingTable = mongoose.model("oneToTwelvePlayingTables");
const SoratTabe = mongoose.model("soratTables");
const AndarBaharTable = mongoose.model("blackNwhiteTables");
const RouletteTables = mongoose.model("RouletteTables");
const Pin = mongoose.model("pin");
const bcrypt = require("bcrypt");
const _ = require("underscore");
const Admin = mongoose.model("admin");
/**
 * @api {post} /admin/signup-admin
 * @apiName  register admin
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post("/signup-admin", async (req, res) => {
  res.json(await mainCtrl.registerAdmin(req.body));
});

router.post("/signup-admin-update", async (req, res) => {
  console.log("signup-admin :::::::::::::::", req.body);
  res.json(await mainCtrl.registerAdminUpdate(req.body));
});

/**
 * @api {post} /admin/login
 * @apiName  login for admin
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post("/login", async (req, res) => {
  try {
    // res.json(await mainCtrl.adminLogin(req.body));
    let data = {};
    console.log("req.body => ", req.body);
    // if (req.body.logintype == "SuperAdmin") {

    //   data = await mainCtrl.adminLogin(req.body);
    //   data.data.type_name = "SuperAdmin"
    //   data.data.name = req.body.email

    //   res.status(OK_STATUS).json(data);

    // } else if (req.body.logintype == "Admin") {

    //   data = await mainCtrl.AdminLogin(req.body);
    //   data.data.type_name = "Admin"
    //   res.status(OK_STATUS).json(data);

    // } else if (req.body.logintype == "Agent") {

    //   data = await mainCtrl.AgentLogin(req.body);
    //   data.data.type_name = "Agent"
    //   res.status(OK_STATUS).json(data);

    // }

    if (req.body.logintype == "Admin") {
      data = await mainCtrl.adminLogin(req.body);
      data.data.type_name = "Super Admin";
      data.data.name = req.body.email;

      res.status(OK_STATUS).json(data);
    } else if (req.body.logintype == "Agent") {
      data = await mainCtrl.AgentLogin(req.body);
      if (data.status === 403) {
        return res.status(data.status).json(data);
      }
      data.data.type_name = "Agent";
      res.status(OK_STATUS).json(data);
    } else if (req.body.logintype == "Shop") {
      data = await mainCtrl.ShopLogin(req.body);
      if (data.status === 403) {
        return res.status(data.status).json(data);
      }
      data.data.type_name = "Shop";
      res.status(OK_STATUS).json(data);
    } else {
      res
        .status(BAD_REQUEST)
        .json({ status: 0, message: "Something went wrong" });
    }
    logger.info("data => ", data);
  } catch (err) {
    console.log(err, "errerrerr");

    logger.error("admin/auth.js login error => ", err);
    res
      .status(BAD_REQUEST)
      .json({ status: 0, message: "Something went wrong" });
  }
});

router.post("/sendforgotemail", async (req, res) => {
  try {
    // res.json(await mainCtrl.adminLogin(req.body));
    console.log("req.body => ", req.body);
    if (req.body.pin == undefined) {
      res.send({ status: false, msg: "Wrong Pin Enter...!!" });
      return false;
    }

    let pindata = await Pin.find({ pin: req.body.pin });

    if (pindata.length > 0) {
      let admindata = await Admin.findOne({});
      if (admindata != null) {
        let password = _.sample("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 5).join(
          ""
        );
        const hashedPassword = await bcrypt.hash(password, 10);

        updateData = {
          $set: {
            password: hashedPassword,
          },
        };

        console.log("updateData ", updateData);

        const response = await Admin.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(admindata._id) },
          updateData,
          { new: true }
        );

        res.send({
          status: true,
          msg: "Success ...!!",
          data: { email: response.email, password: password },
        });
      } else {
        res.send({ status: true, msg: "Wrong Pin Enter...!!" });
      }
    } else {
      res.send({ status: false, msg: "Wrong Pin Enter...!!" });
    }
  } catch (err) {
    logger.error("admin/auth.js login error => ", err);
    res
      .status(BAD_REQUEST)
      .json({ status: 0, message: "Something went wrong" });
  }
});

/**
 * @api {get} /admin/DeletePlaying
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/DeletePlayingSpinner", async (req, res) => {
  try {
    await SpinnerTables.deleteMany({});

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

router.get("/DeleteSoratPlaying", async (req, res) => {
  try {
    await SoratTabe.deleteMany({});

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

router.get("/DeleteAndarBaharPlaying", async (req, res) => {
  try {
    await AndarBaharTable.deleteMany({});

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

router.get("/RoulletDeletePlaying", async (req, res) => {
  try {
    await RouletteTables.deleteMany({});

    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

/**
 * @api {get} /admin/DeletePlaying
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get("/OneDeletePlaying", async (req, res) => {
  try {
    await OnePlayingTable.deleteMany({});
    res.json({ status: "ok" });
  } catch (error) {
    logger.error("admin/dahboard.js post bet-list error => ", error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

module.exports = router;
