const Admin = require("../models/admin");
const User = require("../models/user");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    let userType = "user";

    if (!user) {
      user = await Admin.findOne({ email });
      userType = "admin";
    }

    if (!user) {
      return res.status(404).send({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    if (!user.verfied) {
      return res.status(403).send({ message: "يرجى التحقق من البريد الإلكتروني" });
    }

    const isPassword = await bcryptjs.compare(password, user.password);
    if (!isPassword) {
      return res.status(404).send({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    const SECRETKEY = process.env.SECRETKEY;
    const token = jwt.sign({ id: user._id, type: userType }, SECRETKEY);


    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // أسبوع
    };

    res.cookie("access_token", token, cookieOptions);
    res.cookie("userType", userType, cookieOptions);
    console.log("Set cookie with token:", token);

    user.tokens.push(token);
    await user.save();

    res.status(200).send({ success: "تم تسجيل الدخول بنجاح!", type: userType });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


const logout = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "لا يوجد توكن." });
    }

    let user = await User.findOne({ tokens: token });
    let userType = "user";

    if (!user) {
      user = await Admin.findOne({ tokens: token });
      userType = "admin";
    }

    if (user) {
      user.tokens = user.tokens.filter((t) => t !== token);
      await user.save();
    }

 
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };

    res.clearCookie("access_token", cookieOptions);
    res.clearCookie("userType", cookieOptions);

    res.status(200).json({ message: "تم تسجيل الخروج بنجاح!" });
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج", error: err.message });
  }
};

const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const SECRETKEY = process.env.SECRETKEY;
    const decoded = jwt.verify(token, SECRETKEY);

    let user = await User.findById(decoded.id);
    let userType = "user";

    if (!user) {
      user = await Admin.findById(decoded.id);
      userType = "admin";
    }

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.status(200).json({
      authenticated: true,
      user: {
        name: user.name,
        type: userType,
      },
    });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
};

module.exports = { Login, logout, checkAuth };

