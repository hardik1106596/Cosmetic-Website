const pool = require("./db");

async function test() {

    try {

        const result = await pool.query(
            "SELECT NOW()"
        );

        console.log(result.rows);

        process.exit();

    } catch(err) {

        console.error(err);
    }
}

test();
