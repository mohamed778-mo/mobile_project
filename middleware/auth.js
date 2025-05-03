const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Admin = require("../models/admin");

const auth = async (req, res, next) => {
  try {

    const token = req.headers?.authorization?.split(" ")[1] || req.cookies?.access_token;

    if (!token) {
      return res.status(401).send("Please login!");
    }

    const SECRETKEY = process.env.SECRETKEY;
  
    const decoded = jwt.verify(token, SECRETKEY);

    const user = await User.findById(decoded.id);
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

    const token = req.headers?.authorization?.split(" ")[1] || req.cookies?.access_token;

    if (!token) {
      return res.status(401).send("Please login!");
    }

    const SECRETKEY = process.env.SECRETKEY;

    const decoded = jwt.verify(token, SECRETKEY);

   
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).send("Admin not found!");
    }

    req.user = admin; // إضافة المسؤول إلى الطلب
    next(); // الانتقال إلى الخطوة التالية
  } catch (e) {
    res.status(500).send(e.message); // معالجة الأخطاء
  }
};

module.exports = {
  auth,
  adminAuth,
};
