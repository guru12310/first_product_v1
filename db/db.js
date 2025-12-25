const {Pool} = require('pg')
require('dotenv').config();


const pool  = new Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_NAME,
    password:process.env.DB_PASSWORD,
    port:process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
  family: 4 // force IPv4

    // user:'postgres',
    // host:'localhost',
    // database:'task_management',
    // password:'guru90039',
    // port:'5432'
})

pool.connect().then(()=>{
    console.log("Db Connected")
}).catch((err)=>{
    console.log("Erro in Db Connection",err)
})

module.exports = pool