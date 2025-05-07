const User = require("../models/user");

const Imports = require("../models/imports")
const Products = require("../models/products")
const sendOTPEmail = require("../utils/sendOTPEmail");


const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "https://mobile-project-xi.vercel.app";

const user_Register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const duplicatedEmail = await User.findOne({ email });

    if (duplicatedEmail) {
      const message = req.language === 'ar' 
        ? 'البريد الإلكتروني موجود بالفعل!' 
        : 'This email already exists!';
      return res.status(400).send({ message });
    }

    const otp = crypto.randomInt(10000000, 99999999).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000;

    const newUser = new User({
      name,
      email,
      mobile,
      password,
      otp,
      otpExpire,
      verfied: false
    });

    await sendOTPEmail({ to: email, name, otp });
    await newUser.save();

    const message = req.language === 'ar'
      ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'
      : 'OTP has been sent to your email';
    res.status(200).send({ message });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const verify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, otp });

    if (user) {
      if (user.otpExpire > Date.now()) {
        user.otp = null;
        user.verfied = true;
        await user.save();

        const message = req.language === 'ar' 
          ? 'تم التحقق بنجاح'
          : 'Verification successful';
        return res.status(200).send({ message });

      } else {
        const message = req.language === 'ar' 
          ? 'انتهت صلاحية الرمز. يرجى إعادة التسجيل.'
          : 'OTP has expired. Please register again.';
        return res.status(400).send({ message });
      }
    } else {
      const message = req.language === 'ar'
        ? 'الرمز غير صحيح'
        : 'Invalid OTP';
      return res.status(404).send({ message });
    }

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const resend_otp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      const message = req.language === 'ar'
        ? 'البريد الإلكتروني غير صحيح'
        : 'Invalid email address';
      return res.status(404).send({ message });
    }

    const otp = crypto.randomInt(10000000, 99999999).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpire = otpExpire;

    await user.save();
    await sendOTPEmail({ to: email, name: user.name, otp });

    const message = req.language === 'ar'
      ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'
      : 'OTP has been resent to your email';
    res.status(200).send({ message });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


const user_get_all_products = async (req, res) => {
  try {
    const language = req.language || 'en';
    const data = await Products.find();

    if (!data || data.length === 0) {
      const message = language === 'ar' 
        ? 'لم يتم العثور على المنتجات!' 
        : 'No products found!';
      return res.status(404).send({ message });
    }

    const productList = data.map(product => ({
      product_id: product.product_id,
      product_name: language === 'ar' ? product.arabic_main_category : product.english_main_category,
      icon: product.icon,
      supported_list: language === 'ar' ? product.arabic_supported_list : product.english_supported_list,
      comman_reapir: language === 'ar' ? product.arabic_comman_reapir : product.english_comman_reapir
    }));

    res.status(200).send(productList);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
};

const user_get_versions_in_product = async (req, res) => {
  try {
    const language = req.language || 'en';
    const product_id = req.params.product_id;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      const message = language === 'ar' ? 'المعرف غير صحيح!' : 'Invalid ID!';
      return res.status(400).send({ message });
    }

    const data = await Products.findOne({ product_id });

    if (!data) {
      const message = language === 'ar' ? 'المنتج غير موجود!' : 'Product not found!';
      return res.status(404).send({ message });
    }

    const versions = data.versions.map(version => ({
      version_id: version.version_id,
      version_name: language === 'ar' ? version.version_arabic_name : version.version_english_name
    }));

    const productData = {
      product_id: data.product_id,
      product_name: language === 'ar' ? data.arabic_main_category : data.english_main_category,
      main_photo: data.main_photo,
      versions
    };

    res.status(200).send(productData);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
};

const user_get_models_in_version = async (req, res) => {
  try {
    const language = req.language || 'en';
    const { product_id, version_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      const message = language === 'ar' ? 'المعرف غير صحيح!' : 'Invalid ID!';
      return res.status(400).send({ message });
    }

    const data = await Products.findOne({ product_id });

    if (!data) {
      const message = language === 'ar' ? 'المنتج غير موجود!' : 'Product not found!';
      return res.status(404).send({ message });
    }

    const version_data = data.versions.find(v => v.version_id.toString() === version_id);
    if (!version_data) {
      const message = language === 'ar' ? 'النسخة غير موجودة' : 'Version not found';
      return res.status(404).send({ message });
    }

    const models = version_data.model.map(model => ({
      model_id: model.model_id,
      model_name: language === 'ar' ? model.arabic_name : model.english_name
    }));

    const productData = {
      product_id: data.product_id,
      product_name: language === 'ar' ? data.arabic_main_category : data.english_main_category,
      version_id,
      version_name: language === 'ar' ? version_data.version_arabic_name : version_data.version_english_name,
      models
    };

    res.status(200).send(productData);
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
};


const user_get_service_in_model = async (req, res) => {
  try {
    const language = req.language || 'en';
    const { product_id, version_id, model_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      const message = language === 'ar' ? 'المعرف غير صحيح!' : 'Invalid ID!';
      return res.status(400).send({ message });
    }

    const data = await Products.findOne({ product_id });

    if (!data) {
      const message = language === 'ar' ? 'المنتج غير موجود!' : 'Product not found!';
      return res.status(404).send({ message });
    }

    const version_data = data.versions.find(v => v.version_id.toString() === version_id);
    if (!version_data) {
      const message = language === 'ar' ? 'النسخة غير موجودة' : 'Version not found';
      return res.status(404).send({ message });
    }

    const model_data = version_data.model.find(m => m.model_id.toString() === model_id);
    if (!model_data) {
      const message = language === 'ar' ? 'الموديل غير موجود' : 'Model not found';
      return res.status(404).send({ message });
    }

    const services = model_data.product_service.map(service => ({
      service_id: service.service_id,
      service_name: language === 'ar' ? service.service_arabic_name : service.service_english_name,
      service_description: service.service_description, // Assuming this is multilingual-safe or fixed string
      service_photo: service.service_photo,
      service_rate: service.service_rate,
      service_type: service.service_type.map(type => ({
        name: language === 'ar' ? type.arabic_name : type.english_name,
        price: type.price
      }))
    }));

    res.status(200).send({ services });
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
};


const save_product = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send(req.language === 'ar' ? "يرجى تسجيل الدخول أو التسجيل!" : "Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;
    const { service_arabic_type, service_english_type ,service_price } = req.body;
    const language = req.language || 'en'; 

    const userData = await User.findById(user._id);
    if (!userData) return res.status(404).send({ message: language === 'ar' ? "المستخدم غير موجود!" : "User not found!" });

    const product = await Products.findOne({ product_id: product_id });
    if (!product) return res.status(404).send({ message: language === 'ar' ? 'المنتج غير موجود!' : 'Product not found!' });

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send({ message: language === 'ar' ? 'الإصدار غير موجود!' : 'Version not found!' });

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send({ message: language === 'ar' ? 'الموديل غير موجود!' : 'Model not found!' });

    const service = model.product_service.find(s => s.service_id.toString() === service_id);
    if (!service) return res.status(404).send({ message: language === 'ar' ? 'الخدمة غير موجودة لهذا الموديل!' : 'Service not found for this model!' });
 
    
    const alreadySaved = userData.my_save_products.some(item =>
      item.model_id.toString() === model_id &&
      item.service_id.toString() === service_id 

    );

    if (alreadySaved) {
      return res.status(400).send({ message: language === 'ar' ? 'الخدمة موجودة بالفعل في المحفوظات!' : 'Service already saved!' });
    }

    userData.my_save_products.push({
      product_id: product.product_id,
      product_arabic_name: product.arabic_main_category,
      product_english_name: product.english_main_category,
      version_id: version.version_id,
      model_id: model.model_id,
      model_arabic_name: model.arabic_name,
      model_english_name: model.english_name,
      service_id: service.service_id,
      service_arabic_name: service.service_arabic_name,
      service_english_name: service.service_english_name,
      service_arabic_type: service_arabic_type,
      service_english_type:service_english_type,
      service_price: service_price,
      quantity: 1
    });

    await userData.save();

    res.status(200).send({ message: language === 'ar' ? 'تم حفظ الخدمة بنجاح!' : 'Service saved successfully!' });

  } catch (e) {
    console.error("Error in save_product:", e);
    res.status(500).send({ message: language === 'ar' ? "حدث خطأ أثناء الحفظ!" : "An error occurred while saving!", error: e.message });
  }
};



const get_all_save_products = async (req, res) => {
  try {
    const user = req.user;
    const language = req.language || 'en'; 

    if (!user) 
      return res.status(400).send(language === 'ar' ? "يرجى تسجيل الدخول أو التسجيل!" : "Please login or signup!!");

    const fresh = await User.findById(user._id).select('my_save_products');

    const products = fresh.my_save_products.map(product => ({
      product_id: product.product_id,
      product_name: language === 'ar' ? product.product_arabic_name : product.product_english_name,
      version_id: product.version_id, 
      model_id: product.model_id, 
      model_name: language === 'ar' ? product.model_arabic_name : product.model_english_name,
      service_id: product.service_id, 
      service_name: language === 'ar' ? product.service_arabic_name : product.service_english_name,
      service_type: language === 'ar' ? product.service_arabic_type : product.service_english_type,
      service_price: product.service_price,
      quantity: product.quantity
    }));

    res.status(200).send(products);
  } catch (e) {
    res.status(500).send(language === 'ar' ? e.message : "An error occurred while fetching saved products.");
  }
};

const delete_save_product = async (req, res) => {
  try {
    const user = req.user;
    const language = req.language || 'en'; // تحديد اللغة الافتراضية إذا لم تكن موجودة

    if (!user) 
      return res.status(400).send(language === 'ar' ? "يرجى تسجيل الدخول أو التسجيل!" : "Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;

    const userData = await User.findById(user._id);
    if (!userData) 
      return res.status(404).send({ message: language === 'ar' ? 'المستخدم غير موجود!' : 'User not found!' });
    
    const findDataInSave = userData.my_save_products.find(item =>
      item.product_id === product_id &&
      item.version_id === version_id &&
      item.model_id === model_id &&
      item.service_id === service_id
    );

    if (!findDataInSave) 
      return res.status(404).send({ message: language === 'ar' ? 'الخدمة غير موجودة في المحفوظات!' : 'Service not found in saved products!' });

    userData.my_save_products.pull({
      product_id: product_id,
      version_id: version_id,
      model_id: model_id,
      service_id: service_id
    });
    await userData.save();
    
    res.status(200).send({
      message: language === 'ar' ? 'تمت إزالة الخدمة من المحفوظات بنجاح!' : 'Service removed from saved products successfully!'
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(language === 'ar' ? e.message : "An error occurred while deleting saved product.");
  }
};





const addToCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send(req.language === 'ar' ? "من فضلك قم بتسجيل الدخول أو التسجيل!" : "Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;
    const { service_arabic_type, service_english_type, service_price } = req.body;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send({ message: req.language === 'ar' ? 'المنتج غير موجود!' : 'Product not found!' });

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send({ message: req.language === 'ar' ? 'الإصدار غير موجود!' : 'Version not found!' });

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send({ message: req.language === 'ar' ? 'الموديل غير موجود!' : 'Model not found!' });

    const service = model.product_service.find(s => s.service_id.toString() === service_id);
    if (!service) return res.status(404).send({ message: req.language === 'ar' ? 'الخدمة غير موجودة!' : 'Service not found!' });

    const exists = user.cart.some(item =>
      item.model_id.toString() === model_id &&
      item.service_id.toString() === service_id
    );
    if (exists) return res.status(400).send({ message: req.language === 'ar' ? 'الخدمة موجودة بالفعل في السلة!' : 'Service already exists in cart!' });

    user.cart.push({
      product_id: product_id,
      product_arabic_name: product.arabic_main_category ,
      product_english_name: product.english_main_category,
      version_id: version.version_id,
      model_id: model.model_id,
      model_arabic_name:model.arabic_name ,
      model_english_name: model.english_name,
      service_id: service.service_id,
      service_arabic_name: service.service_arabic_name,
      service_english_name:service.service_english_name,
      service_arabic_type:  service_arabic_type ,
      service_english_type: service_english_type ,
      service_price: service_price,
      quantity: 1
    });

    await user.save();
    res.status(200).send({ message: req.language === 'ar' ? 'تم إضافة الخدمة إلى السلة بنجاح!' : 'Service added to cart successfully!' });

  } catch (e) {
    res.status(500).send(e.message);
  }
};




const viewCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send(req.language === 'ar' ? "من فضلك قم بتسجيل الدخول أولاً" : "Please login first");

    let totalCartPrice = 0;
    const cartItems = user.cart.map(item => {
      const lineTotal = item.service_price * item.quantity;
      totalCartPrice += lineTotal;
      return {
        product_id: item.product_id,
        product_name: req.language === 'ar' ? item.arabic_main_category : item.english_main_category,  
        version_id: item.version_id,
        model_id: item.model_id,
        model_name: req.language === 'ar' ? item.model_arabic_name : item.model_english_name,
        service_id: item.service_id,
        service_name: req.language === 'ar' ? item.service_arabic_name : item.service_english_name,
        service_type:  req.language === 'ar' ?  item.service_arabic_type :item.service_english_type,
        service_price: item.service_price,
        quantity: item.quantity,
        total_price: lineTotal
      };
    });

    res.status(200).send({ cartItems, totalCartPrice });
  } catch (e) {
    res.status(500).send(e.message);
  }
};




const updateCartQuantity = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send(req.language === 'ar' ? "من فضلك قم بتسجيل الدخول أو التسجيل!" : "Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).send({ message: req.language === 'ar' ? 'الكمية يجب أن تكون أكبر من صفر!' : 'Quantity must be greater than zero!' });

    const item = user.cart.find(item =>
      item.product_id.toString() === product_id &&
      item.version_id.toString() === version_id &&
      item.model_id.toString() === model_id &&
      item.service_id.toString() === service_id
    );
    if (!item) return res.status(404).send({ message: req.language === 'ar' ? 'العنصر غير موجود في السلة!' : 'Item not found in cart!' });

    item.quantity = quantity;
    await user.save();
    res.status(200).send({ message: req.language === 'ar' ? 'تم تحديث الكمية بنجاح!' : 'Quantity updated successfully!', cart: user.cart });
  } catch (e) {
    res.status(500).send(e.message);
  }
};



const calculateTotal = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send(req.language === 'ar' ? "من فضلك قم بتسجيل الدخول أو التسجيل!" : "Please login or signup!!");

    const total = user.cart.reduce((sum, item) => {
      return sum + (item.service_price * item.quantity);
    }, 0);

    res.status(200).send({ message: req.language === 'ar' ? 'المبلغ الكلي:' : 'Total amount:', total });
  } catch (e) {
    res.status(500).send(e.message);
  }
};




const delete_from_cart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send(req.language === 'ar' ? "من فضلك قم بتسجيل الدخول أو التسجيل!" : "Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;

    const userData = await User.findById(user._id);
    const findDataInCart = userData.cart.find(item =>
      item.model_id === model_id &&
      item.service_id === service_id
    );

    if (!findDataInCart) return res.status(404).send({ message: req.language === 'ar' ? 'الخدمة غير موجودة في السلة!' : 'Service not found in cart!' });

    userData.cart.pull({
      product_id: product_id,
      version_id: version_id,
      model_id: model_id,
      service_id: service_id
    });

    await userData.save();
    res.status(200).send({ message: req.language === 'ar' ? 'تم إزالة الخدمة من السلة بنجاح!' : 'Service removed from cart successfully!' });
  } catch (e) {
    res.status(500).send(e.message);
  }
};




const forgetPassword = async (req, res) => {
  try {
    const user = req.body;
    const dubUser = await User.findOne({ email: user.email });
    if (!dubUser) {
      return res
        .status(404)
        .send(" email is not exist , please write a correct email ");
    }
    const SEKRET = process.env.SECRET;
    const resettoken = crypto.randomBytes(32).toString("hex");
    dubUser.passwordResetToken = crypto
      .createHmac("sha256", SEKRET)
      .update(resettoken)
      .digest("hex");

    const token = dubUser.passwordResetToken;
    await dubUser.save();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      service: process.env.SERVICE,
      secure: true,
      auth: {
        user: 'icmobile.company@gmail.com',
        pass: process.env.USER_PASS,
      },
    });
    const Message = `${BASE_URL}/app/user/website/resetpassword/${token}`;

    async function main() {
      await transporter.sendMail({
        from: 'icmobile.company@gmail.com',
        to: dubUser.email,
        subject: "Reset Your Password",
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
              
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f9;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                    font-size: 24px;
                    text-align: center;
                    margin-bottom: 20px;
                }
                p {
                    color: #666;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                .button {
                    display: inline-block;
                    background-color: #007bff;
                    color: #fff !important;
                    padding: 12px 24px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-size: 16px;
                    text-align: center;
                    margin: 20px 0;
                }
                .button:hover {
                    background-color: #0056b3;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #999;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Reset Your Password</h1>
                <p>Hello ${dubUser.email},</p>
                <p>We received a request to reset your password. Click the button below to reset it:</p>
                <p style="text-align: center;">
                    <a href="${Message}" class="button">Reset Password</a>
                </p>
                <p>If you did not request a password reset, please ignore this email or contact support.</p>
                <p>This link will expire in <strong>1 hour</strong>.</p>
                <div class="footer">
                    <p>If you have any questions, feel free to <a href="mailto:icmobile.company@gmail.com">contact us</a>.</p>
                    <p>&copy; 2025 ICMOBILE. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,
        });

      console.log("Message sent");
    }

    main().catch(console.error);

    res.status(200).send(" check your email to reset password !");
  } catch (error) {
    res.status(500).send(error.message);
  }
};




const resetPassword =  async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.params.token;

    
    const user = await User.findOne({
      passwordResetToken: token,
    });

    if (!user) {
      return res.status(400).send('Token expired or invalid. Please try again.');
    }

    
    user.password = password
    user.passwordResetToken = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();
    
  res.send(`<!DOCTYPE html> 
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <style>
          body {
              font-family: 'Arial', sans-serif;
              background-image: url('https://images.pexels.com/photos/916017/pexels-photo-916017.jpeg');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
          }

          .container {
              background: rgb(255,255,255,0); 
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
              text-align: center;
              max-width: 400px;
              width: 100%;
              animation: fadeIn 0.5s ease-in-out;
          }

          h2 {
              color: #FFFFFF;
              font-size: 24px;
              margin-bottom: 20px;
          }

          p {
              color: #FFFFFF;
              font-weight:15px;
              font-size: 15px;
              margin-bottom: 30px;
          }

          a {
              display: inline-block;
              background-color: #0172BD;
              color: #FFFFFF;;
              padding: 12px 24px;
              border-radius: 5px;
              text-decoration: none;
              font-size: 16px;
              transition: background-color 0.3s ease;
          }

          a:hover {
              background-color: #143252;
          }

          @keyframes fadeIn {
              from {
                  opacity: 0;
                  transform: translateY(-20px);
              }
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h2>Your password has been successfully changed &#10004;</h2>
          <p>You can now log in with your new password.</p>
          <a href="https://mobile-project-xi.vercel.app">Back to Website</a>
      </div>
  </body>
  </html>`);

  } catch (e) {
    res.status(500).send('Server error.');
  }
}






module.exports = {
  user_Register,
  verify,
  resend_otp,


  user_get_all_products,
  user_get_versions_in_product,
  user_get_models_in_version,
  user_get_service_in_model,
  

  save_product,
  delete_save_product,
  get_all_save_products,
  
  addToCart, 
  viewCart, 
  updateCartQuantity, 
  calculateTotal,
  delete_from_cart,

  forgetPassword,
  resetPassword,
  
};
