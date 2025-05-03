const mongoose = require("mongoose");

const Admin = require("../models/admin");
const User = require("../models/user")

const Products = require("../models/products");


const Imports = require("../models/imports")

require("dotenv").config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const admin_Register = async (req, res) => {
  try {
    const  {name,email, mobile,password, address } = req.body;
    const dublicatedEmail = await Admin.findOne({ email: email });
    
    if (dublicatedEmail) {
      const message = 'البريد الإلكتروني موجود بالفعل!!' ;
      return res.status(400).send(message);
    }
    
    const newUser = new Admin( {name,email, mobile,password, address });
    await newUser.save();
    
    const successMessage = 'التسجيل ناجح !!' ;
    res.status(200).send(successMessage);
  } catch (error) {
    res.status(500).send(error.message);
  }
};


/////////////////////////////////////////////
const add_main_product = async (req, res) => {
  try {
    let { main_category, supported_list, comman_reapir, icon } = req.body;
    const main_photo = req.files?.find(f => f.fieldname === 'main_photo');

    if (typeof supported_list === 'string') supported_list = JSON.parse(supported_list);
    if (typeof comman_reapir === 'string') comman_reapir = JSON.parse(comman_reapir);

    const existdata = await Products.findOne({ main_category });
    if (existdata) return res.status(400).send('هذا المنتج موجود بالفعل');

    const newProduct = new Products({
      main_category,
      main_photo: main_photo ? `${BASE_URL}/uploads/${main_photo.filename}` : 'empty',
      supported_list,
      comman_reapir,
      icon
    });

    await newProduct.save();
    res.status(201).send({ message: 'تم إنشاء المنتج بنجاح!', product: newProduct });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const add_versions_and_models_in_product = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { versions } = req.body;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(400).send('هذا المنتج غير موجود');

    const versions_parsed = typeof versions === 'string' ? JSON.parse(versions) : versions;
    const toAdd = versions_parsed.map(v => ({
      version_id: new mongoose.Types.ObjectId(),
      version_name: v.version_name,
      model: Array.isArray(v.model) ? v.model.map(m => ({model_id: new mongoose.Types.ObjectId(), name: m.name, product_service: [] })) : [],
      product_service: []
    }));

    product.versions.push(...toAdd);
    await product.save();

    res.status(201).json({ message: 'تم إضافة الإصدارات بنجاح!' });
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
    if (!product) return res.status(400).send('هذا المنتج غير موجود');


    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(400).send('هذه النسخة غير موجودة');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(400).send('هذا الموديل غير موجود');

    
    const servicesToAdd = services.map((s, index) => {
      const photo = req.files?.find(f => f.fieldname === `service_photo_${index}`);
      return {
        service_id: new mongoose.Types.ObjectId(),
        service_name: s.service_name,
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

    res.status(201).send({ message: 'تم إضافة الخدمات بنجاح!' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};



const edit_main_product = async (req, res) => {
  try {
    const { product_id } = req.params;
    let { main_category, supported_list, comman_reapir, icon } = req.body;
    const newPhoto = req.files?.find(f => f.fieldname === 'main_photo');

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    if (main_category && main_category !== product.main_category) {
      const dup = await Products.findOne({ main_category });
      if (dup) return res.status(400).send('هذا المنتج موجود بالفعل');
      product.main_category = main_category;
    }
    if (supported_list) product.supported_list = JSON.parse(supported_list);
    if (comman_reapir) product.comman_reapir = JSON.parse(comman_reapir);
    if (icon) product.icon = icon;
    if (newPhoto) product.main_photo = `${BASE_URL}/uploads/${newPhoto.filename}`;

    await product.save();
    res.status(200).json({ message: 'تم تعديل المنتج بنجاح' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const edit_versions_in_product = async (req, res) => {
  try {
    const { product_id, version_id  } = req.params;
    const { versions } = req.body;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send('النسخة غير موجودة');
    
    if(versions.version_name){
       version.version_name = versions.version_name;
      }else{
        return res.status(404).send('لم يتم تحديد اسم النسخة');
      }
    
    await product.save();

    res.status(200).json({ message: 'تم تعديل الإصدار بنجاح' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const edit_model_and_service_in_version = async (req, res) => {
  try {
    const { product_id, version_id,model_id, service_id } = req.params;
    const {model_name, service_name, service_description, service_rate, service_type } = req.body;
    const newPhoto = req.files?.find(f => f.fieldname === 'service_photo');

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send('النسخة غير موجودة');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send('الموديل غير موجود');

    const service = model.product_service.find(s => s.service_id.toString() === service_id);
    if (!service) return res.status(404).send('الخدمة غير موجودة');

    

    if( model_name) model.name = model_name;
    if (service_name) service.service_name = service_name;
    if (service_description) service.service_description = service_description;
    if (service_rate) service.service_rate = service_rate;
    if (service_type) service.service_type = typeof service_type === 'string' ? JSON.parse(service_type) : service_type;
    if (newPhoto) service.service_photo = `${BASE_URL}/uploads/${newPhoto.filename}`;

    await product.save();
    res.status(200).json({ message: 'تم تعديل الخدمة بنجاح' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const get_all_supported_comman_reapir_devices = async (req, res) => {
  try {
    const products = await Products.find({}, 'product_id main_category main_photo supported_list comman_reapir icon');
    res.status(200).json(products);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const get_all_versions_in_product = async (req, res) => {
  try {
    const { product_id } = req.params;
    const products = await Products.findOne({ product_id }, 'versions');
    if (!products) return res.status(404).send('المنتج غير موجود');

    const versions_without_models = products.versions.map(v => ({
      version_id: v.version_id,
      version_name: v.version_name,
      
    }));

    res.status(200).json(versions_without_models);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const get_all_models_in_version = async (req, res) => {
  try {
    const { product_id, version_id } = req.params;
    const products = await Products.findOne({ product_id }, 'versions');
    if (!products) return res.status(404).send('المنتج غير موجود');

    const version = products.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send('النسخة غير موجودة');

    const models_without_services = version.model.map(model => ({
      model_id: model.model_id,
      name: model.name,
  
    }));

    res.status(200).json(models_without_services);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const get_all_services_in_model = async (req, res) => {
  try {
    const { product_id, version_id, model_id } = req.params;
    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send('النسخة غير موجودة');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send('الموديل غير موجود');
    

    res.status(200).json(model.product_service);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_product = async (req, res) => {
  try {
    const { product_id } = req.params;

    const product = await Products.findOneAndDelete({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    await User.updateMany(
      { "cart.product_id": product_id },
      { $pull: { cart: { product_id } } }
    );
    await User.updateMany(
      { "my_save_products.product_id": product_id },
      { $pull: { my_save_products: { product_id } } }
    );

    res.status(200).send('تم حذف المنتج بنجاح!');
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_all_products = async (req, res) => {
  try {
    await Products.deleteMany();

    await User.updateMany({}, { $pull: { cart: { product_id: { $exists: true } } } });
    await User.updateMany({}, { $pull: { my_save_products: { product_id: { $exists: true } } } });

    res.status(200).send('تم حذف جميع المنتجات بنجاح!');
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_version_from_product = async (req, res) => {
  try {
    const { product_id, version_id } = req.params;
    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    const version_exist_id = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version_exist_id) return res.status(404).send('النسخة غير موجودة');

    const updatedProduct = await Products.findOneAndUpdate(
      { product_id },
      { $pull: { versions: { version_id } } },
      { new: true }
    );

    if (!updatedProduct) return res.status(404).send('النسخة غير موجودة');

    await User.updateMany(
      { "cart.version_id": version_id },
      { $pull: { cart: { version_id } } }
    );
    await User.updateMany(
      { "my_save_products.version_id": version_id },
      { $pull: { my_save_products: { version_id } } }
    );

    res.status(200).json({ message: 'تم حذف النسخة بنجاح' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const delete_model_from_version = async (req, res) => {
  try {
    const { product_id, version_id, model_id } = req.params;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send('النسخة غير موجودة');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send('الموديل غير موجود');

    version.model.pull({model_id:model_id})

    await User.updateMany(
      { "cart.model_id": model_id },
      { $pull: { cart: { model_id } } }
    );
    await User.updateMany(
      { "my_save_products.model_id": model_id },
      { $pull: { my_save_products: { model_id } } }
    );

    await product.save();

    res.status(200).json({ message: 'تم حذف الموديل بنجاح' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
const delete_service_from_model = async (req, res) => {
  try {
    const { product_id, version_id,model_id, service_id } = req.params;

    const product = await Products.findOne({ product_id });
    if (!product) return res.status(404).send('المنتج غير موجود');

    const version = product.versions.find(v => v.version_id.toString() === version_id);
    if (!version) return res.status(404).send('النسخة غير موجودة');

    const model = version.model.find(m => m.model_id.toString() === model_id);
    if (!model) return res.status(404).send('الموديل غير موجود');

    const is_serviceExist= model.product_service.find(s => s.service_id.toString() === service_id);
    if (!is_serviceExist) return res.status(404).send('الخدمة غير موجودة');
    
    model.product_service.pull({service_id:service_id});

    await User.updateMany(
      { "cart.service_id": service_id },
      { $pull: { cart: { service_id } } }
    );
    await User.updateMany(
      { "my_save_products.service_id": service_id },
      { $pull: { my_save_products: { service_id } } }
    );

    await product.save();

    res.status(200).json({ message: 'تم حذف الخدمة بنجاح' });
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
    res.status(200).send('import deleted successfully!');
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const delete_all_imports = async (req, res) => {
  try {
    await Imports.deleteMany();
    res.status(200).send('تم حذف جميع الطلبات بنجاح!');
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

  delete_product,
  delete_all_products,
  delete_version_from_product,
  delete_model_from_version,
  delete_service_from_model,
 
  
  get_imports,
  delete_imports,
 delete_all_imports

};
