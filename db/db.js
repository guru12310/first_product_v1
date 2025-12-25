const {Pool} = require('pg')

const pool  = new Pool({
    user:'postgres',
    host:'localhost',
    database:'task_management',
    password:'guru90039',
    port:'5432'
})

pool.connect().then(()=>{
    console.log("Db Connected")
}).catch((err)=>{
    console.log("Erro in Db Connection",err)
})

module.exports = pool