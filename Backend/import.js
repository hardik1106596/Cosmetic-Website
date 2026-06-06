const fs = require("fs");
const path = require("path");
const pool = require("./db");

const DATA_FILE = path.join(
    __dirname,
    "data",
    "site-data.json"
);

async function importProducts() {

    const data = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
    );

    for (const category in data.products) {

        for (const product of data.products[category]) {

            await pool.query(
                `
                INSERT INTO products
                (
                    id,
                    category,
                    name,
                    slug,
                    description,
                    image,
                    keyingredients,
                    keybenefits
                )
                VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8)
                `,
                [
                    product.id,
                    category,
                    product.name || "",
                    product.slug || "",
                    product.description || "",
                    product.image || "",
                    JSON.stringify(
                        product.keyIngredients || []
                    ),
                    JSON.stringify(
                        product.keyBenefits || []
                    )
                ]
            );

            console.log(
                "Imported:",
                product.name
            );
        }
    }

    console.log("DONE");
    process.exit();
}

importProducts();
