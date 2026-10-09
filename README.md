# 🏠 Verified Student Flatmate App (VFA)

A mobile application designed to help students find compatible flatmates and accommodation more safely. VFA provides a platform for discovering rooms, connecting with other students, communicating with potential flatmates, and managing housing-related activities.

## 📌 Project Overview

Finding reliable accommodation and suitable flatmates can be challenging for students moving to a new city for education. The **Verified Student Flatmate App (VFA)** aims to simplify this process by providing a centralized platform for student housing and flatmate connections.

The application includes student profiles, verification features, room listings, favorites, connection requests, messaging, notifications, and safety tools.

## ✨ Features

### 👤 Authentication & Student Profiles
- Student registration and login.
- Secure authentication using JWT.
- Student profile creation and editing.
- Student ID verification workflow.
- Profile photo selection.

### 🏡 Room Listings
- Browse available rooms and flats.
- View detailed accommodation information.
- Search and filter listings.
- Create and manage personal listings.
- View rent, location, amenities, and room details.

### ❤️ Favorites
- Save preferred room listings.
- View saved listings in the Favorites section.
- Remove listings from favorites.

### 🤝 Flatmate Connections
- Send connection requests to other students.
- Accept or reject incoming requests.
- Cancel pending requests.
- Manage connections with other students.

### 💬 Messaging
- Communicate with connected students.
- Send and receive messages.
- View conversations.
- Access message history.

### 🔔 Notifications
- Receive notifications for relevant activities.
- View read and unread notifications.
- Navigate to related app sections.

### 🛡️ Safety Center & Administration
- Access safety-related features.
- Submit reports about users or listings.
- Admin dashboard and student management.
- Manage student verification requests.
- Review reports and administrative audit logs.
- Apply role-based access controls.

### 🎨 Additional Features
- Dark and Light themes.
- Campus housing map.
- Rent-splitting calculator with sharing functionality.
- Mobile-friendly interface.
- Loading, validation, and error states.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Mobile frontend | React Native |
| Development framework | Expo |
| Backend | Node.js |
| API framework | Express.js |
| Database | MySQL |
| Authentication | JSON Web Tokens (JWT) |
| Password security | bcrypt |
| Database connectivity | mysql2 |
| Backend hosting | Render |
| Database hosting | Amazon RDS |
| Version control | Git and GitHub |

## 🏗️ System Architecture

The application uses a client-server architecture.

1. **Mobile application:** Provides the interface for students and administrators.
2. **REST API:** Handles authentication, listings, connections, messages, notifications, and other application operations.
3. **MySQL database:** Stores application data, including users, profiles, listings, connections, messages, and notifications.
4. **Cloud deployment:** The backend is hosted on Render, and the database is hosted on Amazon RDS.

   React Native + Expo Mobile App
              |
              | HTTPS / REST API
              v
       Node.js + Express
              |
              | MySQL Connection
              v
        Amazon RDS MySQL
        

## 📂 Project Structure

The project is organized into frontend and backend components.

VFA/
├── src/
│   ├── constants/
│   ├── components/
│   ├── screens/
│   ├── services/
│   └── ...
├── assets/
├── app.json
├── package.json
├── .env.example
├── .gitignore
└── README.md

The exact frontend structure may vary according to the current implementation.

The backend is maintained separately in the VFA backend repository.

## ⚙️ Prerequisites

Before running the application locally, install:

- Node.js 18 or later.
- npm.
- Expo Go or an appropriate Android development environment.
- Git.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Azima-Bee/VFA.git
```

Replace the repository URL if your frontend repository uses a different name.

### 2. Open the Project Directory

```bash
cd VFA
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure the API URL

Create a `.env` file in the frontend project root and configure the deployed backend URL:

```env
EXPO_PUBLIC_API_URL=https://vfa-backend.onrender.com/api
```

Use the actual backend URL configured for your deployment.

**Security:** Do not commit private credentials, database passwords, JWT secrets, or production `.env` files to GitHub.

### 5. Start the Application

```bash
npx expo start
```

To restart Expo and clear its cache when troubleshooting:

```bash
npx expo start -c
```

Open the project in Expo Go or an appropriate emulator. Ensure your device has internet access to reach the deployed backend.

## 🌐 Deployment

The application uses cloud-hosted services:

- **Backend:** Render
- **Database:** Amazon RDS for MySQL
- **Source code:** GitHub

The mobile frontend can be tested using Expo. For standalone Android distribution, create an appropriate production build using Expo Application Services (EAS) after configuring the application for release.

Backend URL:

https://vfa-backend.onrender.com

## 🔐 Security Considerations

- JWT-based authentication.
- Password hashing with bcrypt.
- Role-based access restrictions for administrative functionality.
- Authorization checks for protected operations.
- Restricted access to sensitive student information.
- Environment variables for deployment configuration.
- Validation of user inputs and access to listings and messaging features.

Do not include real student identity documents, personal information, database dumps, or secret credentials in the public repository.

## 🔮 Future Enhancements

- Push notifications.
- Improved flatmate matching based on preferences and budget.
- Real-time messaging.
- Enhanced student verification.
- Map-based accommodation discovery.
- Image uploads with secure cloud storage.
- Additional testing and performance improvements.

## 🎯 Project Objective

The primary objective of VFA is to make student accommodation discovery more convenient by bringing room listings, flatmate connections, communication, and safety-related features into a single mobile application.
