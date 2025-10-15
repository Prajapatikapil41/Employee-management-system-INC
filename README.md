# Employee-management-system-INC


````markdown
# 👨‍💼 Employee Management System (INC)

A full-stack web application for managing employee records efficiently.  
Built using **React** for the frontend, **Node.js** for the backend, and **MySQL** as the database.

---

## 🚀 Features

✅ Add, view, update, and delete employee records  
✅ Search and filter employees easily  
✅ Responsive and modern UI built with React  
✅ RESTful API powered by Node.js & Express  
✅ Secure CRUD operations with MySQL database  
✅ Error handling and input validation on both frontend & backend  

---

## 🧩 Tech Stack

| Layer               | Technology          |
|---------------------|---------------------|
| **Frontend**        | HTML, CSS, React    |
| **Backend**         | Node.js, Express.js |
| **Database**        | MySQL               |
| **Version Control** | Git & GitHub        |

---

## ⚙️ Project Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Prajapatikapil41/Employee-management-system-INC.git
cd Employee-management-system-INC
````

### 2️⃣ Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

---

### 3️⃣ Configure Database

1. Create a MySQL database (e.g., `employee_db`).
2. Update your database credentials in the backend `.env` file:

   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=employee_db
   PORT=5000
   ```
3. Run your MySQL server before starting the backend.

---

### 4️⃣ Start the Application

#### Start Backend

```bash
cd backend
npm start
```

#### Start Frontend

```bash
cd ../frontend
npm start
```

The frontend will typically run on [http://localhost:3000](http://localhost:3000)
The backend API runs on [http://localhost:5000](http://localhost:5000)

---

## 📁 Folder Structure

```
event-management-system/
├─ frontend/
│  ├─ package.json
│  ├─ public/
│  │  └─ index.html
│  └─ src/
│     ├─ index.js
│     ├─ App.js
│     ├─ api.js
│     ├─ styles.css
│     └─ components/
│        ├─ Login.js
│        ├─ Home.js
│        ├─ EventDetails.js
│        ├─ UpdateEvent.js
│        └─ AddEvent.js
├─ backend/
│  ├─ package.json
│  ├─ .env
│  ├─ index.js
│  ├─ db.js
│  ├─ routes/
│  │  ├─ auth.js
│  │  └─ events.js
│  └─ uploads/        (created at runtime; stores uploaded media)
└─ sql/
   └─ seed.sql
```

---

## 🧠 Future Improvements

* Authentication & role-based access (Admin/Employee)
* Employee performance tracking
* File upload for profile pictures
* Pagination and sorting in employee list

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch (`feature/your-feature`)
3. Commit your changes
4. Push and open a Pull Request

---
