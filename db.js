const Pool = require("pg").Pool;

// to be modified
const pool = new Pool({
    user: "postgres",
    database: "facebook",
    host: "localhost",
    port: 5432
})

module.exports = pool;