const mongoose = require('mongoose'); 
const validator = require('validator')
const bcryptjs = require('bcryptjs')

var cartItemSchema = new mongoose.Schema({
    product_id: {
        type: String,
        ref: 'Products',
        required: true,
    },
    product_arabic_name: { 
        type: String 
    },
    product_english_name: { 
        type: String 
    },
    version_id: {
        type: String,
        required: true,
    },
    model_id: {
        type: String,
        required: true,
    },
    model_arabic_name: {
        type: String, 
        required: true
    },
    model_english_name: {
        type: String, 
        required: true
    },
    service_id: {
            type: String,
            required: true,
    },
    service_arabic_name:{
        type:String,
        required: true
    },
    service_english_name:{
        type:String,
        required: true
    },
    service_price: {
        type: Number, 
        required: true
        },
    service_arabic_type: {
        type:String ,
    },
    service_english_type: {
        type:String ,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
},
{_id:false});
var saveProductSchema = new mongoose.Schema({
    
        product_id: { 
            type: String, 
            ref: "Products" 
        },
        product_arabic_name: { 
            type: String 
        },
        product_english_name: { 
            type: String 
        },
        version_id: { 
            type: String 
        },
        model_id: {
            type:String,
            required: true,
        },
        model_arabic_name: {
            type: String, 
            required: true
        },
        model_english_name: {
            type: String, 
            required: true
        },
        service_id: {
                type: String,
                required: true,
        },
        service_arabic_name:{
            type:String,
            required: true
        },
        service_english_name:{
            type:String,
            required: true
        },
        service_price: {
            type: Number, 
            required: true
            },
        service_arabic_type: {
            type:String ,
        },
        service_english_type: {
            type:String ,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        
    
},
{_id:false}
);

var userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true, 
        
        },
    email: { 
        type: String, 
        required: true,
        unique: true, 
        trim: true,
        validate(value) { 
         if (!validator.isEmail(value)) {
             throw new Error("Invalid email") } } 
            },
    otp:{
        type:Number,
        default:null
    },
    otpExpire: {
        type: Date,
        default: Date.now, 
      },
      verfied: {
        type: Boolean,
        default:false
        
    },
    type:{
     type: String,
     default:'user'
    },
    mobile: { 
        type:String, 
        required: true,
        trim: true 
        },
    password: { 
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        validate(value) { 
        const StrongPassword = new RegExp("^(?=.*[a-z])(?=.*[0-9])");
        if (!StrongPassword.test(value)) { throw new Error(" Password must contain ' ^(?=.*[a-z])(?=.*[0-9]) ' ") } } 
    },
    tokens: [{ 
        type: String, 
        expiresIn: "120d" 
    }],
    my_save_products: [saveProductSchema],
    cart: [cartItemSchema],

     passwordChangedAt: {
        type:Date
    },
    passwordResetToken: {
        type:String
    },
    passwordResetExpires: {
        type:Date
    },

}, 
{ timestamps: true }
);

userSchema.pre("save",async function(){

    try {
     const user = this 
        if(!user.isModified("password")){
        
          return
        }
            user.password = await bcryptjs.hash( user.password , 8)
      
      }
   catch (error) {
        console.log(error)
  } 
     })     
    
     userSchema.methods.toJSON = function(){
        const user = this 
        const dataToObject = user.toObject()
        delete dataToObject.password
        delete dataToObject.tokens
       
        return dataToObject
      }

module.exports = mongoose.model('User', userSchema);
