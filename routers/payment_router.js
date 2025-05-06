const express = require('express');
const router = express.Router();
const createInvoice = require('../controllers/invoice');
const getInvoice = require('../controllers/getInvoice');
const handleInvoiceStatus = require('../controllers/handleInvoiceStatus');

const { auth } = require('../middleware/auth');
const Imports = require('../models/imports');
const User = require('../models/user');
require('dotenv').config();
const nodemailer = require("nodemailer");



router.post('/create-payment',auth, async (req, res) => {
    try {
        const {  currency, services ,delivery_fee ,deliveryTime   } = req.body;
    
        const user = req.user;

    
        const user_data = await User.findById(user._id);
        if (!user_data) {
            return res.status(400).send('User not found');
        }

      
        
        let totalAmount = 0;
        const services_names = [];
        const products = [];
        
        services.forEach(service => {
            totalAmount += service.service_price * service.quantity;
            services_names.push(service.service_name);
        
            products.push({
                title: service.service_name,
                price: service.service_price,
                qty: service.quantity,
            });
        });
        
        totalAmount += delivery_fee;

        let service_full_name =[]
        services.forEach(service => {
            service_full_name.push(`${service.product_name}-${service.model_name}-${service.service_name}-${service.service_type}`)
           
        });
        
        const paymentUrl = await createInvoice({
            orderNumber:`ORDER-${Date.now()}`,
            amount: totalAmount,
            callBackUrl: "http://localhost:3000/app/payments/payment-success",
            cancelUrl: "http://localhost:3000/app/payments/payment-cancel",
            clientName: user_data.name,
            clientEmail: user_data.email,
            clientMobile: user_data.mobile,
            currency,
            products,
            smsMessage:"thanks",
            supportedCardBrands:["mada", "visaMastercard", "amex", "tabby", "tamara", "stcpay", "urpay"],
            displayPending:true,
            note:"See You Soon",
        });
        
       const transactionNo = paymentUrl.split('/').pop()
     const newImport = new Imports({
            client_id: user._id,
            client_name: user_data.name,
            client_mobile: user_data.mobile,
            services_names: service_full_name,
            totalAmount: totalAmount,
            delivery_fee: delivery_fee,
            transactionNo:transactionNo,
            is_buy: false, 
            deliveryTime:deliveryTime,
            
        });

        await newImport.save();

        res.json({ payment_url: paymentUrl });
    } catch (error) {
        res.status(500).send('Payment error: ' + error.message);
    }
});

router.get('/get-invoice/:transactionNo', async (req, res) => {
    try {
        const transactionNo = req.params.transactionNo;
        const invoiceDetails = await getInvoice(transactionNo);
        handleInvoiceStatus(invoiceDetails);
        res.json(invoiceDetails);
    } catch (error) {
        res.status(500).send('Error getting invoice: ' + error.message);
    }
});



router.post('/cash-payment',auth, async (req, res) => {
    try {
        const { services, delivery_fee , deliveryTime , location} = req.body;
        const user = req.user;

        const user_data = await User.findById(user._id);
        if (!user_data) {
            return res.status(400).send('User not found');
        }

        let totalAmount = 0;
       

        totalAmount += delivery_fee;

        let service_full_name =[]
        services.forEach(service => {
            service_full_name.push(`${service.product_name}-${service.model_name}-${service.service_name}-${service.service_type}`)
           
        });

        const newImport = new Imports({
            client_id: user._id,
            client_name: user_data.name,
            client_mobile: user_data.mobile,
            services_names: service_full_name,
            totalAmount: totalAmount,
            delivery_fee: delivery_fee,
            is_buy: false,
            deliveryTime:deliveryTime,
            location:location
        });

        await newImport.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            service: process.env.SERVICE,
            secure: true,
            auth: {
              user:'icmobile.company@gmail.com',
              pass: process.env.USER_PASS,
            },
          });
      
          async function main() {
            const info = await transporter.sendMail({
              from: 'icmobile.company@gmail.com',
              to: 'ninetwo2030@gmail.com',
              subject: "NOTIFICATION CASH PAYMENT",
              html: `<P> السلام عليكم استاذ احمد .هناك عميل طلب شراء منتج "كاش"، برجاء تفقد موقعك الالكترونى!!</P>`,
            });
      
            console.log("Message sent");
          }
      
          main().catch(console.error);
        
        res.status(200).send('Your request has been saved. We will contact you.');
    } catch (error) {
        res.status(500).send('Payment error: ' + error.message);
    }
});


router.get('/payment-success', async (req, res) => {
    try {
       
        const orderNumber = req.query.orderNumber;
        const transactionNo = req.query.transactionNo;

        if (!orderNumber || !transactionNo) {
            return res.status(400).send('Missing orderNumber or transactionNo');
        }

        const order = await Imports.findOne({ transactionNo: transactionNo });

        if (!order) {
            return res.status(404).send('Order not found');
        }

        order.is_buy = true;
        await order.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            service: process.env.SERVICE,
            secure: true,
            auth: {
              user: 'icmobile.company@gmail.com',
              pass: process.env.USER_PASS,
            },
          });
      
          async function main() {
            const info = await transporter.sendMail({
              from: 'icmobile.company@gmail.com',
              to: 'ninetwo2030@gmail.com',
              subject: "NOTIFICATION BUY PAYMENT",
              html: `<P> السلام عليكم استاذ احمد .هناك عميل اتم شراء منتج. برجاء تفقد موقعك الالكترونى!!</P>`,
            });
      
            console.log("Message sent");
          }
      
          main().catch(console.error);

 res.send(`
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #ffffff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        direction: rtl;
                    }
                    .container {
                        text-align: center;
                        background-color: #ffffff;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 15px 25px #00000019;
                        width: 50%;
                    }
                    ._success {
                        border-bottom: solid 4px #28a745;
                        padding: 45px;
                        text-align: center;
                        margin: 40px auto;
                    }
                    ._success i {
                        font-size: 160px;
                        color: #28a745;
                        display: block;
                        padding:10px;
                    }
                    ._success h2 {
                        margin-bottom: 12px;
                        font-size: 55px;
                        font-weight: 500;
                        line-height: 1.2;
                        margin-top: 10px;
                    }
                    ._success p {
                        margin-bottom: 0px;
                        font-size: 30px;
                        color: #495057;
                        font-weight: 500;
                    }
                    .home-button {
                        margin-top: 30px;
                        padding: 15px 30px;
                        background-color: #007bff;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 20px;
                        border-radius: 8px;
                        transition: background-color 0.3s ease;
                        display: inline-block;
                    }
                    .home-button:hover {
                        background-color: #0056b3;
                    }

                </style>
            </head>
            <body>
                <div class="container">
                    <div class="message-box _success">
                        <i class="fa fa-check-circle" aria-hidden="true">
                          ☑
                         </i>
                        <h2>تمت عملية الدفع بنجاح</h2>
                        <p>شكرا لدفعك.</p>
                    </div>
                    <a href="https://www.nine2030.com" class="home-button">الرجوع للصفحة الرئيسية</a>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        res.status(500).send('Error processing payment: ' + error.message);
    }
});

router.get('/payment-cancel', (req, res) => {
      res.send(`
        <html>
        <head>
            <style>
                body {
                    font-family: Handjet;
                    background-color: #ffffff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    direction: rtl;
                }
                .container {
                    text-align: center;
                    background-color: #ffffff;
                    padding: 50px;
                    border-radius: 10px;
                    box-shadow: 0 15px 25px #00000019;
                    width: 50%;
                }
                ._failed {
                    border-bottom: solid 4px red !important;
                    padding: 45px;
                    text-align: center;
                    margin: 40px auto;
                }
                ._failed i {
                    font-size: 160px;
                    color: red !important;
                    display: block;
                    padding:20px
                }
                ._failed h2 {
                    margin-bottom: 33px;
                    font-size: 55px;
                    font-weight: 500;
                    line-height: 1.2;
                    margin-top: 10px;
                }
                ._failed p {
                    margin-bottom: 0px;
                    font-size: 30px;
                    color: #495057;
                    font-weight: 500;
                }
                .home-button {
                    margin-top: 30px;
                    padding: 15px 30px;
                    background-color: #007bff;
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 20px;
                    border-radius: 8px;
                    transition: background-color 0.3s ease;
                    display: inline-block;
                }
                .home-button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="message-box _success _failed">
                    <i class="fa fa-times-circle" aria-hidden="true">
                 ☒
                   </i>
                    <h2>فشلت عملية الدفع</h2>
                    <p>حاول مرة أخرى لاحقًا.</p>
                </div>
                <a href="https://www.nine2030.com" class="home-button">الرجوع للصفحة الرئيسية</a>
            </div>
        </body>
        </html>
    `);
});


module.exports = router;


