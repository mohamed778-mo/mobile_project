const mongoose = require('mongoose');

const BookappointmentSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    mobile: {
        type: String,
        required: true
    },
    device_model:{
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    problem_description: {
        type: String,
        required: true
    },
    notes:{
        type: String
    }
})

module.exports = mongoose.model('Bookappointment', BookappointmentSchema);