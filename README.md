www.basilicabiotech.com

link : https://cosmetic-website-y351.onrender.com---------customer side
link of owner :https://cosmetic-website-y351.onrender.com/gaurav-------

# Cosmetic Website

A full-stack web application for showcasing and managing cosmetic products and services.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Project Details](#project-details)

## ✨ Features

- **Product Showcase**: Display various cosmetic product categories
  - Bath Soap
  - Hair Care
  - Skincare
  - Personal Care
  - Grooming Products
  - Private Label Options

- **Responsive Design**: Mobile-friendly interface
- **Admin Dashboard**: Manage products and orders (in `Frontend/gaurav/`)
- **User Authentication**: Login system for admin access
- **Contact Management**: Contact form for customer inquiries
- **File Upload Support**: Handle product images and documents
- **About & Info Pages**: Company information and manufacturing details

## 🗂️ Project Structure

```
Cosmetic-Website/
├── Backend/
│   ├── package.json
│   ├── server.js              # Express.js server
│   ├── data/
│   │   ├── data-loader.js
│   │   └── site-data.json
│   └── uploads/               # File storage
├── Frontend/
│   ├── index.html             # Homepage
│   ├── about.html
│   ├── contact-us.html
│   ├── bath-soap.html
│   ├── hair-care.html
│   ├── skincare.html
│   ├── personal-care.html
│   ├── grooming.html
│   ├── manufacturing.html
│   ├── private-label.html
│   ├── main.js
│   ├── style.css
│   ├── gaurav/                # Admin Dashboard
│   │   ├── admin.css
│   │   ├── admin.js
│   │   ├── dashboard.html
│   │   └── login.html
│   ├── image/
│   ├── public/
│   └── uploads/
```

## 🛠️ Tech Stack

- **Frontend**
  - HTML5
  - CSS3
  - JavaScript (Vanilla)

- **Backend**
  - Node.js
  - Express.js 4.18.2
  - Express Session (for authentication)
  - Multer (for file uploads)

- **Other**
  - Git/GitHub (Version Control)

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/hardik1106596/Cosmetic-Website.git
cd Cosmetic-Website
```

2. **Install Backend Dependencies**

```bash
cd Backend
npm install
```

3. **Start the Backend Server**

```bash
npm start
```

The server will run on `http://localhost:5000` (or the port specified in your environment)

4. **Open the Frontend**

Navigate to the `Frontend/` folder and open `index.html` in your browser, or serve it with a static file server:

```bash
cd ../Frontend
# Using Python
python -m http.server 8000
# Or using Node.js
npx http-server
```

Access the frontend at `http://localhost:8000` (or appropriate port)

## 📖 Usage

### Regular User

1. Navigate through different product categories (Bath Soap, Hair Care, Skincare, etc.)
2. View product details
3. Use the Contact Us page to send inquiries
4. Learn about the company on About and Manufacturing pages

### Admin

1. Navigate to `Frontend/gaurav/login.html`
2. Login with admin credentials
3. Access the admin dashboard to manage products and orders

## 📁 Project Details

### Backend (`Backend/`)

- **server.js**: Main Express server with route handlers and middleware
- **package.json**: Dependencies and scripts
- **data/**: Contains data loaders and site data
- **uploads/**: Directory for storing uploaded files

### Frontend (`Frontend/`)

- **index.html**: Landing page
- **Product Pages**: Individual category pages
- **main.js**: Client-side JavaScript logic
- **style.css**: Global styles
- **gaurav/**: Admin panel with login and dashboard
- **uploads/**: Directory for client uploads

## 🔧 Configuration

- Backend runs on port `5000` (can be configured via `PORT` environment variable)
- Session secret is configured in `server.js`
- Session expiration: 24 hours

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

- Hardik ([GitHub](https://github.com/hardik1106596))

## 📧 Contact

For inquiries, use the Contact Us form on the website or reach out through the GitHub repository.

---

**Status**: Active Development

**Last Updated**: 2026-06-05
