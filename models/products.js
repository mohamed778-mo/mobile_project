const mongoose = require('mongoose');


const serviceSchema = new mongoose.Schema({
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  service_name: {
    type: String,
    required: true
  },
  service_description: {
    type: String,
    required: true
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
    name: { type: String },
    price: { type: Number }
  }]
  
}, { _id: false }); 

const versionSchema = new mongoose.Schema({
  version_id: { type: mongoose.Schema.Types.ObjectId },
  version_name:{ type: String},
  model: [{
    model_id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
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
  
  main_category: {
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
  supported_list: [{
    
      type: String,
      required: true
  
    
}],
  comman_reapir: [{
   
      type: String,
      
}],

  versions: [versionSchema],

},
{
  timestamps: true
}
);

module.exports = mongoose.model('Products', productsSchema);
