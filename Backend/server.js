/* ============================================================
   BASILICA BIOTECH - COMPLETE EXPRESS BACKEND SERVER
   ============================================================ */
require('dotenv').config();

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS);

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./db');
const nodemailer = require('nodemailer');


const app = express();
const PORT = process.env.PORT || 5000;


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(session({

    secret: 'basilica-biotech-secret-key-2024',

    resave: false,

    saveUninitialized: false,

    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }

}));

// ============================================================
// STATIC FILES
// ============================================================

// Root static files

app.use(express.static(path.join(__dirname, "../Frontend")));

// Gaurav Admin static files
app.use('/gaurav', express.static(
    path.join(__dirname, '../Frontend/gaurav')
));

// Uploads static files
app.use('/uploads', express.static(
    path.join(__dirname, 'uploads')
));

// Public static files
app.use('/public', express.static(
    path.join(__dirname, 'public')
));

// ============================================================
// HOME PAGE
// ============================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

// ============================================================
// PRODUCT DETAILS PAGE
// ============================================================

app.get('/personal-care-details/:slug.html', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'public',
            'product-details.html'
        )
    );

});

// ============================================================
// UPLOADS FOLDER
// ============================================================

const uploadsDir = path.join(
    __dirname,
    'uploads'
);

if (!fs.existsSync(uploadsDir)) {

    fs.mkdirSync(uploadsDir, {
        recursive: true
    });

}

// ============================================================
// MULTER
// ============================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, uploadsDir);

    },

    filename: function (req, file, cb) {

        const uniqueSuffix =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1E9);

        const ext = path.extname(
            file.originalname
        );

        cb(
            null,
            file.fieldname +
            '-' +
            uniqueSuffix +
            ext
        );

    }

});

const upload = multer({

    storage: storage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowedTypes =
            /jpeg|jpg|png|gif|webp|svg/;

        const extname = allowedTypes.test(
            path.extname(file.originalname)
                .toLowerCase()
        );

        const mimetype = allowedTypes.test(
            file.mimetype
        );

        if (extname && mimetype) {

            cb(null, true);

        } else {

            cb(new Error(
                'Only image files are allowed!'
            ));

        }

    }

});

// ============================================================
// DATA FILE
// ============================================================

const DATA_FILE = path.join(
    __dirname,
    'data',
    'site-data.json'
);

// ============================================================
// HELPERS
// ============================================================

function readSiteData() {

    const raw = fs.readFileSync(
        DATA_FILE,
        'utf8'
    );

    return JSON.parse(raw);

}

function writeSiteData(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2),
        'utf8'
    );

}

async function getAllProductsFromDB() {

    const result = await pool.query(`
        SELECT *
        FROM products
        ORDER BY id
    `);

    const grouped = {
        skincare: [],
        haircare: [],
        personalcare: [],
        bathsoap: [],
        grooming: []
    };

    result.rows.forEach(row => {

        grouped[row.category].push({
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            image: row.image,
            keyIngredients: row.keyingredients || [],
            keyBenefits: row.keybenefits || []
        });

    });

    return grouped;
}

// ============================================================
// SANITIZE ARRAY FIELD
// ============================================================

function sanitizeItemArray(input) {

    if (input === undefined || input === null) {
        return [];
    }

    if (typeof input === 'string') {

        try {

            input = JSON.parse(input);

        } catch (_) {

            return [];

        }

    }

    if (!Array.isArray(input)) {
        return [];
    }

    return input
        .filter(item => item && typeof item === 'object')
        .map(item => ({
            title: String(item.title || '').trim(),
            description: String(item.description || '').trim()
        }))
        .filter(item => item.title.length > 0);

}

// ============================================================
// BUILD PRODUCT BODY
// ============================================================

function buildProductBody(body) {

    const name = String(body.name || '').trim();

    return {

        name,

        slug: name
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),

        description: String(body.description || '').trim(),

        image: String(body.image || '').trim(),

        keyIngredients: sanitizeItemArray(
            body.keyIngredients
        ),

        keyBenefits: sanitizeItemArray(
            body.keyBenefits
        )

    };

}

// ============================================================
// ADMIN LOGIN
// ============================================================

const ADMIN_USER = 'Gaurav';
const ADMIN_PASS = 'Basilica139@';

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function requireAuth(req, res, next) {

    if (
        req.session &&
        req.session.isAdmin
    ) {

        next();

    } else {

        res.status(401).json({

            error:
                'Unauthorized. Please login.'

        });

    }

}

// ============================================================
// LOGIN API
// ============================================================

app.post('/api/login', (req, res) => {

    const {
        username,
        password
    } = req.body;

    if (
        username === ADMIN_USER &&
        password === ADMIN_PASS
    ) {

        req.session.isAdmin = true;

        res.json({

            success: true,

            message: 'Login successful!'

        });

    } else {

        res.status(401).json({

            success: false,

            message:
                'Invalid username or password.'

        });

    }

});

// ============================================================
// AUTH CHECK
// ============================================================

app.get('/api/auth-check', (req, res) => {

    res.json({

        isAuthenticated:
            !!(
                req.session &&
                req.session.isAdmin
            )

    });

});

// ============================================================
// LOGOUT
// ============================================================

app.post('/api/logout', (req, res) => {

    req.session.destroy();

    res.json({

        success: true,

        message: 'Logged out successfully.'

    });

});

// ============================================================
// GET FULL SITE DATA
// ============================================================

app.get('/api/site-data', async (req, res) => {

    try {

        const products =
            await getAllProductsFromDB();

        const data = {
            categories: [],
            products
        };

        res.json(data);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Database error'
        });

    }

});

// ============================================================
// GET SINGLE PRODUCT
// ============================================================

app.get('/api/products/:category/:id', async (req, res) => {

    try {

        const { category, id } = req.params;

        const result = await pool.query(
            `
            SELECT *
            FROM products
            WHERE category = $1
            AND id = $2
            `,
            [category, id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: 'Product not found.'
            });

        }

        const product = result.rows[0];

        res.json({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            image: product.image,
            keyIngredients: product.keyingredients || [],
            keyBenefits: product.keybenefits || []
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch product.'
        });

    }

});

// ============================================================
// SLUG PRODUCT API
// ============================================================
app.get('/api/products/slug/:slug', async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM products
            WHERE slug = $1
            `,
            [req.params.slug]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: 'Product not found'
            });

        }

        const product = result.rows[0];

        res.json({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            image: product.image,
            keyIngredients: product.keyingredients || [],
            keyBenefits: product.keybenefits || []
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: 'Database error'
        });

    }

});

// ============================================================
// ADD PRODUCT
// ============================================================

app.post(
    '/api/admin/products/:category',
    requireAuth,
    async(req, res) => {

        try {

    const category = req.params.category;

    const {
        name,
        description,
        image,
        keyIngredients,
        keyBenefits
    } = req.body;

    const result = await pool.query(
        `
        SELECT COUNT(*) as count
        FROM products
        WHERE category = $1
        `,
        [category]
    );

    const id =
        category.substring(0, 2) +
        '-' +
        (parseInt(result.rows[0].count) + 1);

    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');

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
            id,
            category,
            name,
            slug,
            description || '',
            image || '',
            JSON.stringify(keyIngredients || []),
            JSON.stringify(keyBenefits || [])
        ]
    );

    res.json({
        success: true,
        data: {
            id,
            name,
            slug,
            description,
            image,
            keyIngredients,
            keyBenefits
        }
    });

} catch (err) {

    console.error(err);

    res.status(500).json({
        success: false,
        error: 'Failed to add product'
    });
}

    }
);

// ============================================================
// UPDATE PRODUCT
// ============================================================

app.put(
    '/api/admin/products/:category/:index',
    requireAuth,
    async (req, res) => {

        try {

            const { category, index } = req.params;
            const idx = parseInt(index);

            if (isNaN(idx)) {

                return res.status(400).json({
                    error: 'Invalid product index.'
                });

            }

            const result = await pool.query(
                `
                SELECT *
                FROM products
                WHERE category = $1
                ORDER BY id
                `,
                [category]
            );

            if (
                idx < 0 ||
                idx >= result.rows.length
            ) {

                return res.status(404).json({
                    error: 'Product not found.'
                });

            }

            const existing =
                result.rows[idx];

            const productBody =
                buildProductBody(req.body);

            await pool.query(
                `
                UPDATE products
                SET
                    name = $1,
                    slug = $2,
                    description = $3,
                    image = $4,
                    keyingredients = $5,
                    keybenefits = $6
                WHERE id = $7
                `,
                [
                    productBody.name,
                    productBody.slug,
                    productBody.description,
                    productBody.image,
                    JSON.stringify(
                        productBody.keyIngredients || []
                    ),
                    JSON.stringify(
                        productBody.keyBenefits || []
                    ),
                    existing.id
                ]
            );

            res.json({

                success: true,

                message:
                    'Product updated successfully!'

            });

        } catch (err) {

            console.error(
                'Update product error:',
                err
            );

            res.status(500).json({

                error:
                    'Failed to update product.'

            });

        }

    }
);

// ============================================================
// DELETE PRODUCT
// ============================================================

app.delete(
    '/api/admin/products/:category/:index',
    requireAuth,
    async (req, res) => {

        try {

            const { category, index } = req.params;

            const idx = parseInt(index);

            const result = await pool.query(
                `
                SELECT *
                FROM products
                WHERE category = $1
                ORDER BY id
                `,
                [category]
            );

            if (
                isNaN(idx) ||
                idx < 0 ||
                idx >= result.rows.length
            ) {

                return res.status(404).json({
                    success: false,
                    error: 'Product not found.'
                });

            }

            const product =
                result.rows[idx];

            // delete uploaded image if exists

            if (
                product.image &&
                product.image.startsWith('uploads/')
            ) {

                const imagePath = path.join(
                    __dirname,
                    product.image
                );

                if (fs.existsSync(imagePath)) {

                    try {

                        fs.unlinkSync(imagePath);

                    } catch (imgErr) {

                        console.error(
                            'Image delete error:',
                            imgErr
                        );

                    }

                }

            }

            await pool.query(
                `
                DELETE FROM products
                WHERE id = $1
                `,
                [product.id]
            );

            res.json({

                success: true,

                message:
                    'Product deleted successfully!'

            });

        } catch (err) {

            console.error(err);

            res.status(500).json({

                success: false,

                error:
                    'Failed to delete product.'

            });

        }

    }
);

// ============================================================
// IMAGE UPLOAD
// ============================================================

app.post(
    '/api/admin/upload',
    requireAuth,
    upload.single('image'),
    (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({

                    error:
                        'No file uploaded.'

                });

            }

            const filePath =
                'uploads/' +
                req.file.filename;

            res.json({

                success: true,

                message:
                    'Image uploaded successfully!',

                path: filePath,

                filename:
                    req.file.filename

            });

        } catch (err) {

            console.log(err);

            res.status(500).json({

                error:
                    'Failed to upload image.'

            });

        }

    }
);



app.post('/api/subscribe', async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({
                success: false,
                error: 'Email required'
            });

        }

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: 'basilicabiotech@gmail.com',

            subject: 'New Basilica Subscription',

            text: `${email} subscribed to Basilica Biotech website`

        });

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});


app.post('/api/contact', async (req, res) => {

    try {

        const {
            name,
            email,
            company,
            phone,
            city,
            country
        } = req.body;

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: 'basilicabiotech@gmail.com',

            subject: 'New Contact Form Submission',

            html: `
                <h2>New Contact Request</h2>

                <p><b>Name:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Company:</b> ${company}</p>
                <p><b>Phone:</b> ${phone}</p>
                <p><b>City:</b> ${city}</p>
                <p><b>Country:</b> ${country}</p>
            `
        });

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});



// ============================================================
// GAURAV ADMIN ROUTES
// ============================================================

app.get('/gaurav', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../Frontend/gaurav/login.html'
        )
    );

});


app.get('/gaurav/dashboard', (req, res) => {

    if (
        !req.session ||
        !req.session.isAdmin
    ) {

        return res.redirect('/gaurav');

    }

    res.sendFile(
        path.join(
            __dirname,
            '../Frontend/gaurav/dashboard.html'
        )
    );

});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {

    console.log(`
==================================================
🧴 BASILICA BIOTECH SERVER RUNNING
==================================================

Website:
http://localhost:${PORT}

Admin Login:
http://localhost:${PORT}/gaurav

Username: Gaurav
Password: Basilica139@

==================================================
`);

});
