import mysql from 'mysql2'

// console.log(mysql)

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'mysql#8983',
    database: 'mano_db'
}).promise()

const result = await pool.query("SELECT * FROM users")[0]
console.log(result)