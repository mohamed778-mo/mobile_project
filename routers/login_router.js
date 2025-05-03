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
      const message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      return res.status(404).send({ message });
    }

  
    if (!user.verfied) {
      const message = 'يرجى التحقق من البريد الإلكتروني';
      return res.status(403).send({ message });
    }

    const isPassword = await bcryptjs.compare(password, user.password);
    if (!isPassword) {
      const message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      return res.status(404).send({ message });
    }

    const SECRETKEY = process.env.SECRETKEY;
    const token = jwt.sign({ id: user._id, type: userType }, SECRETKEY);

    res.cookie("access_token", `Bearer ${token}`, {
      expires: new Date(Date.now() + 60 * 60 * 24 * 1024 * 300),
      httpOnly: true,
    });

    user.tokens.push(token);
    await user.save();

    const message = 'تم تسجيل الدخول بنجاح!';
    res.status(200).send({ success: message, type: userType });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const logout = async (req, res) => {
  try {
    const token =
      req.headers?.authorization?.split(" ")[1] ||
      req.cookies?.access_token?.split(" ")[1];

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

  
    res.clearCookie("access_token");

    res.status(200).json({ message: "تم تسجيل الخروج بنجاح!" });
  } catch (err) {
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج", error: err.message });
  }
};

module.exports = {Login, logout};
