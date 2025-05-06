const mongoose = require("mongoose");

const Admin = require("../models/admin");
const User = require("../models/user")

const Products = require("../models/products");


const Imports = require("../models/imports")

require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const admin_Register = async (req, res) => {
  try {
    const  {name,email, mobile,password } = req.body;
    const dublicatedEmail = await Admin.findOne({ email: email });
    
    if (dublicatedEmail) {
      const message = req.language === 'ar' ? 'البريد الإلكتروني موجود بالفعل!!':'this email already exist!!' ;
      return res.status(400).send(message);
    }
    
    const newUser = new Admin( {name,email, mobile,password });
    await newUser.save();
    
    const successMessage = req.language === 'ar' ? 'التسجيل ناجح!!' :'register is success!!'
    res.status(200).send(successMessage);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


/////////////////////////////////////////////
const add_main_product = async (req, res) => {
  try {
    let { arabic_main_category,english_main_category, english_supported_list,arabic_supported_list, arabic_comman_reapir,english_comman_reapir, icon } = req.body;
    const main_photo = req.files?.find(f => f.fieldname === 'main_photo');

    if (typeof supported_list === 'string') supported_list = JSON.parse(supported_list);
    if (typeof comman_reapir === 'string') comman_reapir = JSON.parse(comman_reapir);

   
   const existdata = await Products.findOne({ arabic_main_category:english_main_category,english_main_category:english_main_category });
    const message_exist =req.language==='ar'?'هذا المنتج موجود بالفعل':'this product already exist';
   if (existdata) return res.status(400).send(message_exist);

    const newProduct = new Products({
      arabic_main_category,
      english_main_category,
      main_photo: main_photo ? `${BASE_URL}/uploads/${main_photo.filename}` : 'empty',
      english_supported_list,
      arabic_supported_list,
      arabic_comman_reapir,
      english_comman_reapir,
      icon
    });
    const message = req.language === 'ar' ?'تم إنشاء المنتج بنجاح!':'product is created success'
    await newProduct.save();
    res.status(201).send({ message: message, product: newProduct });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const add_versions_and_models_in_product = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { versions } = req.body;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(400).send(req.language === 'ar' ? 'هذا المنتج غير موجود' : 'This product does not exist');

    const versions_parsed = typeof versions === 'string' ? JSON.parse(versions) : versions;
    const toAdd = versions_parsed.map(v => ({
      version_id: new mongoose.Types.ObjectId(),
      version_arabic_name: v.version_arabic_name,
      version_english_name: v.version_english_name,
      model: Array.isArray(v.model) ? v.model.map(m => ({
        model_id: new mongoose.Types.ObjectId(),
        arabic_name: m.arabic_name,
        english_name: m.english_name,
        product_service: []
      })) : [],
      product_service: []
    }));

    product.versions.push(...toAdd);
    await product.save();

    const successMessage = req.language === 'ar' ? 'تم إضافة الإصدارات بنجاح!' : 'Versions added successfully!';
    res.status(201).json({ message: successMessage });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const add_services_in_model = async (req, res) => {
  try {
    const { product_id, version_id, model_id } = req.params;
    let services = req.body.services;
    if (typeof services === 'string') services = JSON.parse(services);

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(400).send(req.language === 'ar' ? 'هذا المنتج غير موجود' : 'This product does not exist');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(400).send(req.language === 'ar' ? 'هذه النسخة غير موجودة' : 'This version does not exist');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(400).send(req.language === 'ar' ? 'هذا الموديل غير موجود' : 'This model does not exist');

    const servicesToAdd = services.map((s, index) => {
      const photo = req.files?.find(f => f.fieldname === `service_photo_${index}`);
      return {
        service_id: new mongoose.Types.ObjectId(),
        service_arabic_name: s.service_arabic_name,
        service_english_name: s.service_english_name,
        service_description: s.service_description,
        service_photo: photo ? `${BASE_URL}/uploads/${photo.filename}` : 'empty',
        service_rate: s.service_rate,
        service_type: Array.isArray(s.service_type) 
          ? s.service_type 
          : JSON.parse(s.service_type || '[]'),
      };
    });

    model.product_service.push(...servicesToAdd);
    await product.save();

    const successMessage = req.language === 'ar' ? 'تم إضافة الخدمات بنجاح!' : 'Services added successfully!';
    res.status(201).json({ message: successMessage });
  } catch (error) {
    res.status(500).send(error.message);
  }
};




const edit_main_product = async (req, res) => {
  try {
    const { product_id } = req.params;
    let { arabic_main_category, english_main_category, arabic_supported_list, english_supported_list, arabic_comman_reapir, english_comman_reapir, icon } = req.body;
    const newPhoto = req.files?.find(f => f.fieldname === 'main_photo');

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send(req.language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    if (arabic_main_category && arabic_main_category !== product.arabic_main_category) {
      const dup = await Products.findOne({ arabic_main_category });
      if (dup) return res.status(400).send(req.language === 'ar' ? 'هذا المنتج موجود بالفعل' : 'This product already exists');
      product.arabic_main_category = arabic_main_category;
    }
    if (english_main_category && english_main_category !== product.english_main_category) {
      product.english_main_category = english_main_category;
    }
    if (arabic_supported_list) product.arabic_supported_list = JSON.parse(arabic_supported_list);
    if (english_supported_list) product.english_supported_list = JSON.parse(english_supported_list);
    if (arabic_comman_reapir) product.arabic_comman_reapir = JSON.parse(arabic_comman_reapir);
    if (english_comman_reapir) product.english_comman_reapir = JSON.parse(english_comman_reapir);
    if (icon) product.icon = icon;
    if (newPhoto) product.main_photo = `${BASE_URL}/uploads/${newPhoto.filename}`;

    await product.save();
    res.status(200).json({ message: req.language === 'ar' ? 'تم تعديل المنتج بنجاح' : 'Product updated successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};



const edit_versions_in_product = async (req, res) => {
  try {
    const { product_id, version_id } = req.params;
    const { version_arabic_name, version_english_name } = req.body;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send(req.language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send(req.language === 'ar' ? 'النسخة غير موجودة' : 'Version not found');
    
    if (version_arabic_name) version.version_arabic_name = version_arabic_name;
    if (version_english_name) version.version_english_name = version_english_name;

    await product.save();

    res.status(200).json({ message: req.language === 'ar' ? 'تم تعديل الإصدار بنجاح' : 'Version updated successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};



const edit_model_and_service_in_version = async (req, res) => {
  try {
    const { product_id, version_id, model_id, service_id } = req.params;
    const { model_arabic_name, model_english_name, service_arabic_name, service_english_name, service_description, service_rate, service_type } = req.body;
    const newPhoto = req.files?.find(f => f.fieldname === 'service_photo');

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send(req.language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send(req.language === 'ar' ? 'النسخة غير موجودة' : 'Version not found');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send(req.language === 'ar' ? 'الموديل غير موجود' : 'Model not found');

    const service = model.product_service.find(s => s.service_id.toString() === service_id);
    if (!service) return res.status(404).send(req.language === 'ar' ? 'الخدمة غير موجودة' : 'Service not found');

    if (model_arabic_name) model.arabic_name = model_arabic_name;
    if (model_english_name) model.english_name = model_english_name;
    if (service_arabic_name) service.service_arabic_name = service_arabic_name;
    if (service_english_name) service.service_english_name = service_english_name;
    if (service_description) service.service_description = service_description;
    if (service_rate) service.service_rate = service_rate;
    if (service_type) service.service_type = typeof service_type === 'string' ? JSON.parse(service_type) : service_type;
    if (newPhoto) service.service_photo = `${BASE_URL}/uploads/${newPhoto.filename}`;

    await product.save();
    res.status(200).json({ message: req.language === 'ar' ? 'تم تعديل الخدمة بنجاح' : 'Service updated successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const get_all_supported_comman_reapir_devices = async (req, res) => {
  try {
    const products = await Products.find({}, 'product_id arabic_main_category english_main_category main_photo arabic_supported_list english_supported_list arabic_comman_reapir english_comman_reapir icon');
    
    if (req.language === 'ar') {
      res.status(200).json({
        message: 'تم جلب الأجهزة المدعومة لإصلاح الأعطال بنجاح',
        products,
      });
    } else {
      res.status(200).json({
        message: 'Successfully retrieved supported common repair devices',
        products,
      });
    }
  } catch (e) {
    res.status(500).send(req.language === 'ar' ? 'حدث خطأ أثناء استرجاع البيانات' : 'An error occurred while retrieving the data');
  }
};


const get_all_versions_in_product = async (req, res) => {
  try {
    const { product_id } = req.params;
    const language = req.language || 'en'; // default to English if not provided

    const product = await Products.findOne({ product_id }, 'versions');
    if (!product) {
      return res.status(404).send(
        language === 'ar' ? 'المنتج غير موجود' : 'Product not found'
      );
    }

    const versions = product.versions.map(v => ({
      version_id: v.version_id,
      version_name:
        language === 'ar' ? v.version_arabic_name : v.version_english_name,
    }));

    res.status(200).json(versions);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const get_all_models_in_version = async (req, res) => {
  try {
    const { product_id, version_id } = req.params;
    const language = req.language || 'en';

    const product = await Products.findOne({ product_id });
    if (!product)
      return res.status(404).send(language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version)
      return res.status(404).send(language === 'ar' ? 'النسخة غير موجودة' : 'Version not found');

    const models = version.model.map(m => ({
      model_id: m.model_id,
      name: language === 'ar' ? m.arabic_name : m.english_name,
    }));

    res.status(200).json(models);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const get_all_versions_and_models_in_product = async (req, res) => {
  try {
    const { product_id } = req.params;
    const language = req.language || 'en';

    const product = await Products.findOne({ product_id }, 'versions');
    if (!product)
      return res.status(404).send(language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const versions = product.versions.map(v => ({
      version_id: v.version_id,
      version_name: language === 'ar' ? v.version_arabic_name : v.version_english_name,
      model: v.model.map(m => ({
        model_id: m.model_id,
        name: language === 'ar' ? m.arabic_name : m.english_name,
      })),
    }));

    res.status(200).json(versions);
  } catch (e) {
    res.status(500).send(e.message);
  }
};


const get_all_services_in_model = async (req, res) => {
  try {
    const { product_id, version_id, model_id } = req.params;
    const language = req.language || 'en';

    const product = await Products.findOne({ product_id });
    if (!product)
      return res.status(404).send(language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version)
      return res.status(404).send(language === 'ar' ? 'النسخة غير موجودة' : 'Version not found');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model)
      return res.status(404).send(language === 'ar' ? 'الموديل غير موجود' : 'Model not found');

    const services = model.product_service.map(s => ({
      service_id: s.service_id,
      name: language === 'ar' ? s.arabic_name : s.english_name,
      description: language === 'ar' ? s.arabic_description : s.english_description,
      price: s.price,
      duration: s.duration,
    }));

    res.status(200).json(services);
  } catch (e) {
    res.status(500).send(e.message);
  }
};


const delete_product = async (req, res) => {
  try {
    const { product_id } = req.params;

    const product = await Products.findOneAndDelete({ product_id });
    if (!product) return res.status(404).send(req.language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    await User.updateMany(
      { "cart.product_id": product_id },
      { $pull: { cart: { product_id } } }
    );
    await User.updateMany(
      { "my_save_products.product_id": product_id },
      { $pull: { my_save_products: { product_id } } }
    );

    res.status(200).send(req.language === 'ar' ? 'تم حذف المنتج بنجاح!' : 'Product deleted successfully!');
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_all_products = async (req, res) => {
  try {
    await Products.deleteMany();

    await User.updateMany({}, { $pull: { cart: { product_id: { $exists: true } } } });
    await User.updateMany({}, { $pull: { my_save_products: { product_id: { $exists: true } } } });

    res.status(200).send(req.language === 'ar' ? 'تم حذف جميع المنتجات بنجاح!' : 'All products deleted successfully!');
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_version_from_product = async (req, res) => {
  try {
    const { product_id, version_id } = req.params;
    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send(req.language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send(req.language === 'ar' ? 'النسخة غير موجودة' : 'Version not found');

    await Products.findOneAndUpdate(
      { product_id },
      { $pull: { versions: { version_id } } },
      { new: true }
    );

    await User.updateMany(
      { "cart.version_id": version_id },
      { $pull: { cart: { version_id } } }
    );
    await User.updateMany(
      { "my_save_products.version_id": version_id },
      { $pull: { my_save_products: { version_id } } }
    );

    res.status(200).json({ message: req.language === 'ar' ? 'تم حذف النسخة بنجاح' : 'Version deleted successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const delete_model_from_version = async (req, res) => {
  try {
    const { product_id, version_id, model_id } = req.params;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send(req.language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send(req.language === 'ar' ? 'النسخة غير موجودة' : 'Version not found');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send(req.language === 'ar' ? 'الموديل غير موجود' : 'Model not found');

    version.model.pull({ model_id });

    await User.updateMany(
      { "cart.model_id": model_id },
      { $pull: { cart: { model_id } } }
    );
    await User.updateMany(
      { "my_save_products.model_id": model_id },
      { $pull: { my_save_products: { model_id } } }
    );

    await product.save();

    res.status(200).json({ message: req.language === 'ar' ? 'تم حذف الموديل بنجاح' : 'Model deleted successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const delete_service_from_model = async (req, res) => {
  try {
    const { product_id, version_id, model_id, service_id } = req.params;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send(req.language === 'ar' ? 'المنتج غير موجود' : 'Product not found');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send(req.language === 'ar' ? 'النسخة غير موجودة' : 'Version not found');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send(req.language === 'ar' ? 'الموديل غير موجود' : 'Model not found');

    const serviceExist = model.product_service.find(s => s.service_id.toString() === service_id);
    if (!serviceExist) return res.status(404).send(req.language === 'ar' ? 'الخدمة غير موجودة' : 'Service not found');

    model.product_service.pull({ service_id });

    await User.updateMany(
      { "cart.service_id": service_id },
      { $pull: { cart: { service_id } } }
    );
    await User.updateMany(
      { "my_save_products.service_id": service_id },
      { $pull: { my_save_products: { service_id } } }
    );

    await product.save();

    res.status(200).json({ message: req.language === 'ar' ? 'تم حذف الخدمة بنجاح' : 'Service deleted successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};



const get_imports = async (req, res) => {
  try {
    const data = await Imports.find();
    if (!data) return res.status(404).send('No Imports found!');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_imports = async (req, res) => {
  try {
    const import_id = req.params.import_id;
    if (!mongoose.Types.ObjectId.isValid(import_id)) {
      return res.status(404).send('ID is not correct!');
    }
    await Imports.findByIdAndDelete(import_id);
    const message =req.language === 'ar'?' تم حذف الداتا بنجاح!' :'import deleted successfully!'
    res.status(200).send(message);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_all_imports = async (req, res) => {
  try {
    await Imports.deleteMany();
    const message =req.language === 'ar'?'تم حذف جميع الطلبات بنجاح!' :'imports deleted successfully!'
    res.status(200).send(message);
  } catch (e) {
    res.status(500).send(e.message);
  }
};



module.exports = {
  admin_Register,
  
  add_main_product,
  add_versions_and_models_in_product,
  add_services_in_model,
  
  edit_main_product,
  edit_versions_in_product,
  edit_model_and_service_in_version,


  get_all_supported_comman_reapir_devices,
  get_all_versions_in_product,
  get_all_models_in_version,
  get_all_services_in_model,
  get_all_versions_and_models_in_product,

  delete_product,
  delete_all_products,
  delete_version_from_product,
  delete_model_from_version,
  delete_service_from_model,
 
  
  get_imports,
  delete_imports,
 delete_all_imports

};
