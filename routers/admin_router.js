const router = require('express').Router();
const { adminAuth } = require('../middleware/auth');
const {Upload} = require('../middleware/uploads')
    
const { 
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

    } = require('../controllers/dashboard_control');




router.post('/admin_register',admin_Register)

router.post('/add_main_product',adminAuth,Upload.any(),add_main_product)
router.post('/add_versions_and_models_in_product/:product_id',adminAuth,add_versions_and_models_in_product)
router.post('/add_services_in_model/:product_id/:version_id/:model_id',adminAuth,Upload.any(),add_services_in_model)

router.patch('/edit_main_product/:product_id',adminAuth,Upload.any(),edit_main_product)
router.patch('/edit_versions_in_product/:product_id/:version_id',adminAuth,edit_versions_in_product)
router.patch('/edit_model_and_service_in_version/:product_id/:version_id/:model_id/:service_id',adminAuth,Upload.any(),edit_model_and_service_in_version)

router.get('/get_all_supported_comman_reapir_devices',adminAuth,get_all_supported_comman_reapir_devices)
router.get('/get_all_versions_and_models_in_product/:product_id',adminAuth,get_all_versions_and_models_in_product)
router.get('/get_all_versions_in_product/:product_id',adminAuth,get_all_versions_in_product)
router.get('/get_all_models_in_version/:product_id/:version_id',adminAuth,get_all_models_in_version)
router.get('/get_all_services_in_model/:product_id/:version_id/:model_id',adminAuth,get_all_services_in_model)

router.delete('/delete_product/:product_id',adminAuth,delete_product)
router.delete('/delete_all_products',adminAuth,delete_all_products)
router.delete('/delete_version_from_product/:product_id/:version_id',adminAuth,delete_version_from_product)
router.delete('/delete_model_from_version/:product_id/:version_id/:model_id',adminAuth,delete_model_from_version)
router.delete('/delete_service_from_model/:product_id/:version_id/:model_id/:service_id',adminAuth,delete_service_from_model)

// لسه
router.get('/get_imports',adminAuth,get_imports)
router.delete('/delete_imports/:import_id',adminAuth,delete_imports)
router.delete('/delete_all_imports',adminAuth,delete_all_imports)



module.exports = router
