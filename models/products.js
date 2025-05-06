const mongoose = require('mongoose');


const serviceSchema = new mongoose.Schema({
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  service_arabic_name: {
    type: String,
    required: true
  },
  service_english_name: {
    type: String,
    required: true
  },
  service_description: {
    type: String,
  },
  service_photo: {
    type: String,
    default: 'empty'
  },
  service_rate: {
    type: Number,
    default: 10
  },
  service_type: [{
    arabic_name: { type: String },
    english_name: { type: String },
    price: { type: Number }
  }]
  
}, { _id: false }); 

const versionSchema = new mongoose.Schema({
  version_id: { type: mongoose.Schema.Types.ObjectId },
  version_arabic_name:{ type: String},
  version_english_name:{ type: String},
  model: [{
    model_id: { type: mongoose.Schema.Types.ObjectId },
    arabic_name: { type: String },
    english_name: { type: String },
    product_service: [serviceSchema]
}],
  
}, { _id: false });


const productsSchema = new mongoose.Schema({
  product_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: () => new mongoose.Types.ObjectId(),
      unique: true
  },
  
  arabic_main_category: {
    type: String,
    required: true
  },
  english_main_category: {
    type: String,
    required: true
  },
  main_photo: {
    type: String,
    default: 'empty'
  },
  icon:{
    type: String,
    default: 'empty'
  },
  arabic_supported_list: [{
    
      type: String,
      required: true
  
    
}],
english_supported_list: [{
    
  type: String,
  required: true


}],
  arabic_comman_reapir: [{
   
      type: String,
      
}],
english_comman_reapir: [{
   
  type: String,
  
}],

  versions: [versionSchema],

},
{
  timestamps: true
}
);

module.exports = mongoose.model('Products', productsSchema);
