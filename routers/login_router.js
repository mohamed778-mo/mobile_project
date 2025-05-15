const Admin = require("../models/admin");
const User = require("../models/user");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const isProduction = process.env.NODE_ENV === "production";

    // البحث عن المستخدم
    let user = await User.findOne({ email });
    let userType = "user";

    if (!user) {
      user = await Admin.findOne({ email });
      userType = "admin";
    }

    // التحقق من وجود المستخدم وتفعيله
    if (!user) {
      return res.status(404).json({ 
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
      });
    }

    if (!user.verified) {
      return res.status(403).json({ 
        message: "يرجى التحقق من البريد الإلكتروني" 
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({ 
        message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" 
      });
    }

    // إنشاء التوكن
    const SECRETKEY = process.env.SECRETKEY;
    const token = jwt.sign({ 
      id: user._id, 
      type: userType 
    }, SECRETKEY);

    // تحديث التوكنات في قاعدة البيانات
    user.tokens.push(token);
    await user.save();

    // تعيين الكوكيز - إعدادات ديناميكية للإنتاج/التطوير
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      domain: isProduction ? ".vercel.app" : undefined,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // أسبوع
    });

    res.cookie("userType", userType, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      domain: isProduction ? ".vercel.app" : undefined,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // الرد الناجح
    res.status(200).json({ 
      success: "تم تسجيل الدخول بنجاح!", 
      type: userType 
    });

  } catch (error) {
    res.status(500).json({ 
      message: "حدث خطأ في الخادم",
      error: error.message 
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.access_token;
    const isProduction = process.env.NODE_ENV === "production";

    if (!token) {
      return res.status(401).json({ 
        message: "لا يوجد توكن." 
      });
    }

    // البحث عن المستخدم وحذف التوكن
    let user = await User.findOne({ tokens: token });
    if (!user) user = await Admin.findOne({ tokens: token });

    if (user) {
      user.tokens = user.tokens.filter(t => t !== token);
      await user.save();
    }

    // حذف الكوكيز
    res.clearCookie("access_token", {
      domain: isProduction ? ".vercel.app" : undefined,
      path: "/"
    });

    res.clearCookie("userType", {
      domain: isProduction ? ".vercel.app" : undefined,
      path: "/"
    });

    res.status(200).json({ 
      message: "تم تسجيل الخروج بنجاح!" 
    });

  } catch (err) {
    res.status(500).json({ 
      message: "حدث خطأ أثناء تسجيل الخروج",
      error: err.message 
    });
  }
};

const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ 
        authenticated: false 
      });
    }

    // التحقق من التوكن
    const SECRETKEY = process.env.SECRETKEY;
    const decoded = jwt.verify(token, SECRETKEY);

    // البحث عن المستخدم
    let user = await User.findById(decoded.id);
    if (!user) user = await Admin.findById(decoded.id);

    if (!user || !user.tokens.includes(token)) {
      return res.status(401).json({ 
        authenticated: false 
      });
    }

    res.status(200).json({
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        type: decoded.type
      }
    });

  } catch (err) {
    res.status(401).json({ 
      authenticated: false 
    });
  }
};

module.exports = { 
  Login, 
  logout, 
  checkAuth 
};