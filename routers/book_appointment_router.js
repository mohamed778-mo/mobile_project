const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const{
    create_book_appointment,
    get_all_book_appointment,
    get_one_book_appointment,
    edit_book_appointment,
    delete_book_appointment,
    delete_all_book_appointment
}=require('../controllers/book_appointment')

router.post('/create', auth, create_book_appointment);
router.get('/get_all', auth, get_all_book_appointment);
router.get('/get/:book_id', auth, get_one_book_appointment);
router.patch('/edit/:book_id', auth, edit_book_appointment);
router.delete('/delete/:book_id', auth, delete_book_appointment);
router.delete('/delete_all', auth, delete_all_book_appointment);

module.exports = router