const router = require('express').Router()
const User = require("../models/user");

const {auth}=require('../middleware/auth')
const { setLanguage } = require('../middleware/setLanguage'); 

const {
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
}=require('../controllers/web_control')

router.post('/website/user_register',setLanguage,user_Register)
router.post('/website/verify',setLanguage,verify)
router.post('/website/resend_otp',setLanguage,resend_otp)


router.post('/website/save_product/:product_id/:version_id/:model_id/:service_id',auth,setLanguage,save_product)
router.get('/website/get_all_save_products',auth,setLanguage,get_all_save_products)
router.delete('/website/delete_save_product/:product_id/:version_id/:model_id/:service_id',auth,setLanguage,delete_save_product)


router.get('/website/get_all_products',setLanguage,  user_get_all_products)
router.get('/website/user_get_versions_in_product/:product_id',setLanguage,  user_get_versions_in_product)
router.get('/website/user_get_models_in_version/:product_id/:version_id',setLanguage,  user_get_models_in_version)
router.get('/website/user_get_service_in_model/:product_id/:version_id/:model_id', setLanguage, user_get_service_in_model)



router.post('/website/cart/add/:product_id/:version_id/:model_id/:service_id', auth,setLanguage, addToCart)
router.get('/website/cart/view', auth, setLanguage,viewCart)
router.patch('/website/cart/update_quantity/:product_id/:version_id/:model_id/:service_id', auth,setLanguage, updateCartQuantity)
router.get('/website/cart/total', auth,setLanguage, calculateTotal)
router.delete('/website/remove_from_cart/:product_id/:version_id/:model_id/:service_id',auth,setLanguage,delete_from_cart)




router.post('/website/forgetpassword',forgetPassword)
router.get('/website/resetpassword/:token',  async (req, res) => {
  const token = req.params.token;

  const user = await User.findOne({
    passwordResetToken: token,
  });

  if (!user) {
    return res.status(400).send('Invalid token or token has expired.');
  }
res.send(`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset Password</title>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
        }

        .container {
          background-color: #fff;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          width: 100%;
          max-width: 400px;
        }

        h1 {
          color: #333;
        }

        label {
          display: block;
          margin: 20px 0 10px;
          font-size: 16px;
          color: #555;
        }

        input[type="password"] {
          width: 100%;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        button {
          margin-top: 20px;
          padding: 10px 20px;
          font-size: 18px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        button:hover {
          background-color: #218838;
        }

        .info {
          margin-top: 10px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset your password</h1>
        <form action="/app/user/resetpassword/${token}" method="POST">
          <label for="password">New Password:</label>
          <input type="password" name="password" id="password" required />
          <button type="submit">Reset Password</button>
        </form>
        <div class="info">
          <p>Please enter your new password to continue.</p>
        </div>
      </div>
    </body>
  </html>
`);

})

router.post('/website/resetpassword/:token',resetPassword)


module.exports = router;
