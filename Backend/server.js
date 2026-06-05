/* ============================================================
   BASILICA BIOTECH - COMPLETE EXPRESS BACKEND SERVER
   ============================================================ */

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

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

app.get('/api/site-data', (req, res) => {

    try {

        const data = readSiteData();

        res.json(data);

    } catch (err) {

        res.status(500).json({

            error:
                'Failed to read site data.'

        });

    }

});

// ============================================================
// GET SINGLE PRODUCT
// ============================================================

app.get('/api/products/:category/:id', (req, res) => {

    try {

        const data = readSiteData();

        const {
            category,
            id
        } = req.params;

        if (!data.products || !data.products[category]) {

            return res.status(404).json({

                error:
                    'Category not found.'

            });

        }

        const product = data.products[
            category
        ].find(item => item.id === id);

        if (!product) {

            return res.status(404).json({

                error:
                    'Product not found.'

            });

        }

        res.json({
            ...product,
            keyIngredients: product.keyIngredients || [],
            keyBenefits: product.keyBenefits || []
        });

    } catch (err) {

        res.status(500).json({

            error:
                'Failed to fetch product.'

        });

    }

});

// ============================================================
// SLUG PRODUCT API
// ============================================================

app.get('/api/products/slug/:slug', (req, res) => {

    const data = readSiteData();

    let found = null;

    for (let category in data.products) {

        found = data.products[category].find(p => {

            const generatedSlug = String(p.name || '')
                .toLowerCase()
                .trim()
                .replace(/&/g, 'and')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            return generatedSlug === req.params.slug;

        });

        if (found) break;

    }

    if (!found) {

        return res.status(404).json({
            error: "Product not found"
        });

    }

    res.json(found);

});

// ============================================================
// ADD PRODUCT
// ============================================================

app.post(
    '/api/admin/products/:category',
    requireAuth,
    (req, res) => {

        try {

            const data = readSiteData();

            const { category } = req.params;

            if (!req.body.name || !String(req.body.name).trim()) {

                return res.status(400).json({
                    error: 'Product name is required.'
                });

            }

            if (!data.products) {
                data.products = {};
            }

            if (!data.products[category]) {
                data.products[category] = [];
            }

            const newId =
                category.substring(0, 2) +
                '-' +
                (data.products[category].length + 1);

            const productBody = buildProductBody(req.body);

            const newProduct = {
                id: newId,
                ...productBody
            };

            data.products[category].push(newProduct);

            writeSiteData(data);

            res.json({

                success: true,

                message:
                    'Product added successfully!',

                data: newProduct

            });

        } catch (err) {

            console.error('Add product error:', err);

            res.status(500).json({

                error:
                    'Failed to add product.'

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
    (req, res) => {

        try {

            const data = readSiteData();

            const {
                category,
                index
            } = req.params;

            const idx = parseInt(index);

            if (isNaN(idx)) {

                return res.status(400).json({
                    error: 'Invalid product index.'
                });

            }

            if (
                data.products &&
                data.products[category] &&
                idx >= 0 &&
                idx < data.products[category].length
            ) {

                const existing = data.products[category][idx];

                const productBody = buildProductBody(req.body);

                data.products[category][idx] = {

                    ...existing,
                    ...productBody,
                    id: existing.id

                };

                writeSiteData(data);

                res.json({

                    success: true,

                    message:
                        'Product updated successfully!',

                    data:
                        data.products[category][idx]

                });

            } else {

                res.status(404).json({

                    error:
                        'Product not found.'

                });

            }

        } catch (err) {

            console.error('Update product error:', err);

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
    (req, res) => {

        try {

            const data = readSiteData();

            const {
                category,
                index
            } = req.params;

            const idx = parseInt(index);

            if (
                !data.products ||
                !data.products[category]
            ) {

                return res.status(404).json({

                    success: false,

                    error: 'Category not found.'

                });

            }

            if (
                isNaN(idx) ||
                idx < 0 ||
                idx >= data.products[category].length
            ) {

                return res.status(404).json({

                    success: false,

                    error: 'Product not found.'

                });

            }

            const product =
                data.products[category][idx];

            if (
                product &&
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

                        console.log(
                            'Image deleted:',
                            imagePath
                        );

                    } catch (imgErr) {

                        console.error(
                            'Image delete error:',
                            imgErr
                        );

                    }

                }

            }

            const deletedProduct =
                data.products[category].splice(idx, 1);

            writeSiteData(data);

            res.json({

                success: true,

                message:
                    'Product and image deleted successfully!',

                data: deletedProduct[0]

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
