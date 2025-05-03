const User = require("../models/user");

const Imports = require("../models/imports")
const Products = require("../models/products")
const sendOTPEmail = require("../utils/sendOTPEmail");


const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const user_Register = async (req, res) => {
  try {
    const   {name,email, mobile,password, address } = req.body;
    const dublicatedEmail = await User.findOne({ email: email });
    if (dublicatedEmail) {
      const message = 'البريد الإلكتروني موجود بالفعل!' ;
      return res.status(400).send({message});
    }
    const otp = crypto.randomInt(10000000, 99999999).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000; 
    const newUser = new User({
      name,
      email,
       mobile,
       password, 
       address,
       otp,
       otpExpire,
       verfied:false
      });
    
      await sendOTPEmail({ to: newUser.email, name: newUser.name, otp });

    await newUser.save();
    const message = 'تم ارسال رمز التحقق على البريد الإلكتروني' ;
    res.status(200).send({message});
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const verify=async(req,res)=>{
  try {
    const otp = req.body.otp;
    const email=req.body.email

    const user = await User.findOne({email:email , otp: otp });
    if (user) {
      if (user.otpExpire > Date.now()) {
        user.otp = null;
        user.verfied = true;
        await user.save();
        const message = 'تم التحقق بنجاح' ;
        res.status(200).send({message});
       
      } else {
        res.status(400).send("تم انتهاء مده الرمز.من فضلك اعد التسجيل مرة اخرى");
      }
      ;
    }else{
      const message = 'الرمز غير صحيح' ;
      return res.status(404).send({message})
    }
   
  } catch (error) {
    res.status(500).send(error.message);
  }
}
const resend_otp=async(req,res)=>{
  try {
    const email=req.body.email
    const user = await User.findOne({email:email});
    if (user) {
      
        const otp = crypto.randomInt(10000000, 99999999).toString();
        const otpExpire = Date.now() + 10 * 60 * 1000; 
        user.otp = otp;
        user.otpExpire = otpExpire;
        await user.save();
        const message = 'تم ارسال رمز التحقق على البريد الإلكتروني' ;
        res.status(200).send({message});
        
      await sendOTPEmail({ to: user.email, name: user.name, otp });

    }else{
      const message = 'البريد الإلكتروني غير موجود' ;
      return res.status(404).send({message})
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
} 

const user_get_all_products = async (req, res) => {
  try {
    const data = await Products.find();

    if (!data || data.length === 0) {
      const message = 'لم يتم العثور على المنتجات!';
      return res.status(404).send({message});
    }

    const productList = data.map(product => ({
      product_id: product.product_id,
      product_name: product.main_category,
      icon:product.icon,
      supported_list:product.supported_list,
      comman_reapir:product.comman_reapir
    }));

    res.status(200).send(productList);
  } catch (e) {
    res.status(500).send(e.message);
  }
};
const user_get_versions_in_product = async (req, res) => {
  try {
    const product_id = req.params.product_id;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      const message = 'المعرف غير صحيح!' ;
      return res.status(400).send(message);
    }

    const data = await Products.findOne({product_id});

    if (!data) {
      const message = 'المنتج غير موجود!'  ;
      return res.status(404).send(message);
    }
     const versions_data = data.versions
     const v = versions_data.map(version => ({
       version_id:version.version_id,
       version_name:version.version_name
     }))
    const productData = {
      product_id: data.product_id,
      product_name: data.main_category,
      main_photo: data.main_photo,
      versions:v
    };

    res.status(200).send(productData);
  } catch (e) {
    res.status(500).send(e.message);
  }
};
const user_get_models_in_version= async (req, res) => {
  try {
    const {product_id,version_id} = req.params

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      const message = 'المعرف غير صحيح!' ;
      return res.status(400).send(message);
    }

    const data = await Products.findOne({product_id});

    if (!data) {
      const message = 'المنتج غير موجود!'  ;
      return res.status(404).send(message);
    }
     const version_data = data.versions.find(v => v.version_id.toString() === version_id)
     if (!version_data) return res.status(404).send('النسخة غير موجودة');
     const models_data = version_data.model
     const m = models_data.map(model => ({
       model_id:model.model_id,
       model_name:model.name
     }))
     
    const productData = {
      product_id: data.product_id,
      product_name: data.main_category,
      version_id:version_id,
      version_name:version_data.version_name,
      models:m
    };

    res.status(200).send(productData);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const user_get_service_in_model= async (req, res) => {
  try {
    const {product_id,version_id,model_id} = req.params

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      const message = 'المعرف غير صحيح!' ;
      return res.status(400).send(message);
    }

    const data = await Products.findOne({product_id});

    if (!data) {
      const message = 'المنتج غير موجود!'  ;
      return res.status(404).send(message);
    }
     const version_data = data.versions.find(v => v.version_id.toString() === version_id)
     if (!version_data) return res.status(404).send('النسخة غير موجودة');
     const model_data = version_data.model.find(m => m.model_id.toString() === model_id)
     if (!model_data) return res.status(404).send('الموديل غير موجود');

     const services_data = model_data.product_service
     const s = services_data.map(service => ({
       service_id:service.service_id,
       service_name:service.name,
       service_description:service.service_description,
       service_photo:service.service_photo,
       service_type:service.service_type,
       service_rate:service.service_rate
     }))
     
    const productData = {
      services:s
    };
    

    res.status(200).send(productData);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const save_product = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send("Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;

    const product = await Products.findOne({product_id});
    if (!product) return res.status(404).send({ message: 'المنتج غير موجود!' });

   
    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send({ message: 'الإصدار غير موجود!' });

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send({ message: 'الموديل غير موجود!' });

    
    const service = model.product_service.find(s => s.service_id.toString() === service_id);
    if (!service) return res.status(404).send({ message: 'الخدمة غير موجودة لهذا الموديل!' });

   
    const exists = user.my_save_products.some(item =>
      item.product_id.toString() === product_id &&
      item.version_id.toString() === version_id &&
      item.model_id.toString() === model_id &&
      item.service_id.toString() === service_id
    );
    if (exists) return res.status(400).send({ message: 'الخدمة موجودة بالفعل في المحفوظات!' });

  
    user.my_save_products.push({
      product_id: product._id,
      product_name: product.main_category,
      version_id: version.version_id,
      model_id: model.model_id,
      model_name: model.name,
      service_id: service.service_id,
      service_name: service.service_name,
      service_price: service.service_rate,
      service_type: Array.isArray(service.service_type) ? service.service_type.map(t => t.name).join(', ') : '',
      quantity: 1
    });

    await user.save();
    res.status(200).send({ message: 'تم حفظ الخدمة بنجاح!' });

  } catch (e) {
    res.status(500).send(e.message);
  }
};

const get_all_save_products = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send("Please login or signup!!");

    const fresh = await User.findById(user._id).select('my_save_products');
    res.status(200).send(fresh.my_save_products);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_save_product = async (req, res) => {
  try {
    const user = req.user;
    if (!user) 
      return res.status(400).send("Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;

    // طباعة للـ debugging (اختياري)
    console.log('قبل السحب:', user.my_save_products.map(x => ({
      pid: x.product_id.toString(),
      vid: x.version_id?.toString(),
      mid: x.model_id.toString(),
      sid: x.service_id.toString()
    })));

    // نحول الستريات لـ ObjectId instances
    const prodOid  = new mongoose.Types.ObjectId(product_id);
    const verOid   = new mongoose.Types.ObjectId(version_id);
    const modelOid = new mongoose.Types.ObjectId(model_id);
    const servOid  = new mongoose.Types.ObjectId(service_id);

    // نجيب المستخدم كامل كمستند
    const doc = await User.findById(user._id);
    if (!doc) 
      return res.status(404).send({ message: 'المستخدم غير موجود!' });

    // نلاقي فهرس العنصر في المصفوفة
    const idx = doc.my_save_products.findIndex(item =>
      item.product_id.equals(prodOid) &&
      item.version_id.equals(verOid) &&
      item.model_id.equals(modelOid) &&
      item.service_id.equals(servOid)
    );

    if (idx === -1) {
      return res.status(404).send({ message: 'العنصر غير موجود في المحفوظات!' });
    }

    // نشيل العنصر
    doc.my_save_products.splice(idx, 1);

    // نحفظ التغييرات
    await doc.save();

    // (اختياري) طباعة ما بعد الحذف
    console.log('بعد السحب:', doc.my_save_products.map(x => ({
      pid: x.product_id.toString(),
      vid: x.version_id?.toString(),
      mid: x.model_id.toString(),
      sid: x.service_id.toString()
    })));

    res.status(200).send({
      message: 'تمت إزالة الخدمة من المحفوظات بنجاح!',
      my_save_products: doc.my_save_products
    });

  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  }
};




const addToCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send("Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;

    const product = await Products.findOne({product_id});
    if (!product) return res.status(404).send({ message: 'المنتج غير موجود!' });

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send({ message: 'الإصدار غير موجود!' });

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send({ message: 'الموديل غير موجود!' });

    const service = model.product_service.find(s => s.service_id.toString() === service_id);
    if (!service) return res.status(404).send({ message: 'الخدمة غير موجودة!' });

    const exists = user.cart.some(item =>
      item.product_id.toString() === product_id &&
      item.version_id.toString() === version_id &&
      item.model_id.toString() === model_id &&
      item.service_id.toString() === service_id
    );
    if (exists) return res.status(400).send({ message: 'الخدمة موجودة بالفعل في السلة!' });

    user.cart.push({
      product_id: product._id,
      version_id: version.version_id,
      model_id: model.model_id,
      model_name: model.name,
      service_id: service.service_id,
      service_name: service.service_name,
      service_price: service.service_rate,
      service_type: Array.isArray(service.service_type) ? service.service_type.map(t => t.name).join(', ') : '',
      quantity: 1
    });

    await user.save();
    res.status(200).send({ message: 'تم إضافة الخدمة إلى السلة بنجاح!' });

  } catch (e) {
    res.status(500).send(e.message);
  }
};



const viewCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send("من فضلك قم بتسجيل الدخول أولاً");

    await user.populate({ path: 'cart.product_id', select: 'main_category main_photo' });

    let totalCartPrice = 0;
    const cartItems = user.cart.map(item => {
      const prod = item.product_id;
      if (!prod) return null;
      const lineTotal = item.service_price * item.quantity;
      totalCartPrice += lineTotal;
      return {
        product_id: prod._id,
        product_name: prod.main_category,
        product_photo: prod.main_photo,
        version_id: item.version_id,
        model_id: item.model_id,
        model_name: item.model_name,
        service_id: item.service_id,
        service_name: item.service_name,
        service_type: item.service_type,
        service_price: item.service_price,
        quantity: item.quantity,
        total_price: lineTotal
      };
    }).filter(x => x);

    res.status(200).send({ cartItems, totalCartPrice });
  } catch (e) {
    res.status(500).send(e.message);
  }
};



const updateCartQuantity = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send("Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).send({ message: 'الكمية يجب أن تكون أكبر من صفر!' });

    const item = user.cart.find(item =>
      item.product_id.toString() === product_id &&
      item.version_id.toString() === version_id &&
      item.model_id.toString() === model_id &&
      item.service_id.toString() === service_id
    );
    if (!item) return res.status(404).send({ message: 'العنصر غير موجود في السلة!' });

    item.quantity = quantity;
    await user.save();
    res.status(200).send({ message: 'تم تحديث الكمية بنجاح!', cart: user.cart });
  } catch (e) {
    res.status(500).send(e.message);
  }
};



const calculateTotal = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send("Please login or signup!!");

    const total = user.cart.reduce((sum, item) => {
      return sum + (item.service_price * item.quantity);
    }, 0);

    res.status(200).send({ message: 'المبلغ الكلي:', total });
  } catch (e) {
    res.status(500).send(e.message);
  }
};



const delete_from_cart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(400).send("Please login or signup!!");

    const { product_id, version_id, model_id, service_id } = req.params;

    await User.findByIdAndUpdate(
      user._id,
      { $pull: { cart: {
          product_id: mongoose.Types.ObjectId(product_id),
          version_id: mongoose.Types.ObjectId(version_id),
          model_id: mongoose.Types.ObjectId(model_id),
          service_id: mongoose.Types.ObjectId(service_id)
        }
      }},
      { new: true }
    );

    res.status(200).send({ message: 'تم إزالة الخدمة من السلة بنجاح!' });
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

    res.send(`
     
  <!DOCTYPE html>
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
          <a href="http://localhost:3000">Back to Website</a>
      </div>
  </body>
  </html>


  `);

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
