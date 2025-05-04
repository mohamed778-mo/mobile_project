
const Bookappointment = require('../models/Book_service_appointment');


const create_book_appointment = async (req, res) => {
    try {
        const {full_name,email,mobile,device_model,date,time,problem_description,notes} = req.body
        const appointment = new Bookappointment({full_name,email,mobile,device_model,date,time,problem_description,notes});
        await appointment.save();
        res.status(201).json(appointment);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

const get_all_book_appointment =async (req, res) => {
    try {
        const appointments = await Bookappointment.find();
        res.status(200).json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const get_one_book_appointment = async (req, res) => {
    try {
        const book_id = req.params.book_id;
        const appointment = await Bookappointment.findById(book_id);
        if (!appointment) return res.status(404).json({ message: 'الموعد غير موجود' });
        res.status(200).json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const edit_book_appointment = async (req, res) => {
    try {
        const {full_name,email,mobile,device_model,date,time,problem_description,notes} = req.body

        const book_id = req.params.book_id;
        const appointment = await Bookappointment.findByIdAndUpdate(book_id, {full_name,email,mobile,device_model,date,time,problem_description,notes}, { new: true });
        if (!appointment) return res.status(404).json({ message: 'الموعد غير موجود' });
        res.status(200).json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const delete_book_appointment = async (req, res) => {
    try {
        const book_id = req.params.book_id;
        const appointment = await Bookappointment.findByIdAndDelete(book_id);
        if (!appointment) return res.status(404).json({ message: 'الموعد غير موجود' });
        res.status(200).json({ message: 'تم حذف الموعد بنجاح' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const delete_all_book_appointment = async (req, res) => {
    try {
        await Bookappointment.deleteMany();
        res.status(200).json({ message: 'تم حذف جميع التذاكر بنجاح' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


module.exports = {
    create_book_appointment,
    get_all_book_appointment,
    get_one_book_appointment,
    edit_book_appointment,
    delete_book_appointment,
    delete_all_book_appointment
}
