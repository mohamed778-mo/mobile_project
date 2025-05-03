const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Admin = require("../models/admin");

const auth = async (req, res, next) => {
  try {
    const token =
      req.headers?.authorization?.split(" ")[1] ||
      req.cookies?.access_token?.split(" ")[1];

    if (!token) {
      return res.status(401).send("Please login!");
    }

    const SECRETKEY = process.env.SECRETKEY;
    const result = jwt.verify(token, SECRETKEY, { complete: true });

    const user = await User.findById(result.payload.id);
    if (!user) {
      return res.status(401).send("User not found!");
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token =
      req.headers?.authorization?.split(" ")[1] ||
      req.cookies?.access_token?.split(" ")[1];

    if (!token) {
      return res.status(401).send("Please login!");
    }

    const SECRETKEY = process.env.SECRETKEY;
    const result = jwt.verify(token, SECRETKEY, { complete: true });

    const admin = await Admin.findById(result.payload.id);
    if (!admin) {
      return res.status(401).send("Admin not found!");
    }

    req.user = admin;
    next();
  } catch (e) {
    res.status(500).send(e.message);
  }
};

module.exports = {
  auth,
  adminAuth,
};
