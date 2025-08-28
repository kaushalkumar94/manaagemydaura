# Manage My Daura 📱

Built and deployed a cross-platform mobile app used for scheduling and updates in real time.
The application helps in managing visits, streamlining scheduling, and improving team coordination.
It leverages contact sync from device directories to automate updates, reducing manual communication effort by 80%.

Built with **React Native** and **Node.js + Express.js**, the app enables real-time updates, secure authentication, and smooth data handling with a modern tech stack.  

---

## 🚀 Features

- **Cross-platform Mobile App**: Works seamlessly on both Android and iOS.  
- **Authentication & Security**: JWT-based authentication with access/refresh tokens.  
- **Automated Communication**: Send 500+ personalized updates daily through contact synchronization from device directories, reducing manual effort by **80%**.  
- **Scheduling System**: Create, manage, and update schedules stored securely in Firebase using date-based keys.  
- **Visits Management**: Store and display upcoming visits (with time, date, and location).  
- **Unified Timeline**: Merges schedules and visits in chronological order for easy navigation.  
- **Persistent Storage**: Offline-first experience using Redux Persist & AsyncStorage.  
- **Analytics-ready Backend**: Data structured in Firebase for easy expansion into analytics and insights.  

---

## 🛠 Tech Stack

**Frontend:**  
- React Native
- Redux Toolkit & Redux Persist (state management)  
- Axios with interceptors (API calls, token refresh)  
- React Navigation  

**Backend:**  
- Node.js + Express.js   
- Firebase (schedule + visit storage)  
- JWT Authentication  

**Deployment & Tools:**  
- Render (Backend hosting)  
- GitHub for version control  

---

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/kartikey004/managemydaura.git
cd managemydaura
