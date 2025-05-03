const express = require('express');
const cors = require('cors');
const connection = require("./config/connection");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const bodyParser = require("body-parser");

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp')
const express_mongo_sanitize= require('express-mongo-sanitize');
const xss=require('xss-clean');
const compression = require('compression');
const path=require("path")

const swaggerUi = require("swagger-ui-express");


const user = require('./routers/user_router')
const admin = require('./routers/admin_router')
const {Login, logout , checkAuth} = require('./routers/login_router')
const payment = require('./routers/payment_router')

const app = express();

app.use(compression()); 
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(helmet());

app.set('trust proxy', 1);

const LIMIT = '1000kb'; //500//
app.use(bodyParser.json({ limit: LIMIT, extended: true }));
app.use(bodyParser.urlencoded({ limit: LIMIT, extended: true }));
app.use(express.json({ limit: LIMIT }));

app.use(cookieParser());

// const ratelimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, 
//     message: "Too many requests from this IP, please try again later.",
// });

 // app.use(ratelimiter); 
 app.use(hpp())
 app.use(express_mongo_sanitize())
 app.use(xss())


app.use('/app/user',user);
app.use('/app/secure_admin',admin);
app.use('/app/login_page', Login);
app.use('/app/logout_page', logout);
app.use('/app/check_auth', checkAuth);
app.use('/app/payments', payment);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connection();

const port = process.env.PORT || 3000 ;
app.listen(port, () => {
    console.log(`Connection on port ${port}`);
});
