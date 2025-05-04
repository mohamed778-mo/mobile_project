const mongoose = require("mongoose")
require("dotenv").config()


const URL='mongodb+srv://moelmala086:cxHq8hqBayLyNuKj@clusteric.pkcjzzn.mongodb.net/?retryWrites=true&w=majority&appName=ClusterIC'
const DBconnection =()=>{ 
mongoose.connect('mongodb+srv://moelmala086:cxHq8hqBayLyNuKj@clusteric.pkcjzzn.mongodb.net/?retryWrites=true&w=majority&appName=ClusterIC')
.then(()=>{console.log('done connection !!')})
.catch((e)=>{console.log(e.message)})
}


module.exports= DBconnection;


