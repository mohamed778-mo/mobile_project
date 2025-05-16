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
      const message = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      return res.status(404).send({ message });
    }

    if (!user.verfied) {
      const message = "يرجى التحقق من البريد الإلكتروني";
      return res.status(403).send({ message });
    }

    const isPassword = await bcryptjs.compare(password, user.password);
    if (!isPassword) {
      const message = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      return res.status(404).send({ message });
    }

    const SECRETKEY = process.env.SECRETKEY;
    const token = jwt.sign({ id: user._id, type: userType }, SECRETKEY);

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // أسبوع
    });

    res.cookie("userType", userType, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
    console.log("Set cookie with token:", token);

    //     res.cookie("access_token", Bearer ${token}, {
    //   httpOnly: true,
    //   secure: false, // مؤقتًا للتجريب على localhost
    //   sameSite: "Lax", // أو "None" مع secure: true
    //   path: "/",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    user.tokens.push(token);
    await user.save();

    const message = "تم تسجيل الدخول بنجاح!";
    res.status(200).send({ success: message, type: userType });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({ message: "لا يوجد توكن." });

    let user = await User.findOne({ tokens: token }) || await Admin.findOne({ tokens: token });
    if (user) {
      user.tokens = user.tokens.filter((t) => t !== token);
      await user.save();
    }

    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("userType", { path: "/" });

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
