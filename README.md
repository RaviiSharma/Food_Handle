# Food Center - MERN QR Menu

Architecture:
- Frontend: React + Vite (deploy on Vercel)
- Backend: Node.js + Express MVC (deploy on Render)
- Database: MongoDB Atlas
- Admin authentication: JWT
- Orders: Customer can order with or without table number
- Table QR: `/menu?table=8`
- Admin can create/edit/delete menu items and manage order status

## Local setup

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-long-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
CLIENT_URL=http://localhost:5173

On first server start, an admin user is created from ADMIN_EMAIL/ADMIN_PASSWORD.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:5000/api` in frontend/.env.

## Deployment

### Render
Root directory: `backend`
Build command: `npm install`
Start command: `npm start`
Environment:
MONGODB_URI
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
CLIENT_URL=https://YOUR-VERCEL-APP.vercel.app

### Vercel
Root directory: `frontend`
Build command: `npm run build`
Output directory: `dist`
Environment:
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api

After deployment, generate table QR URLs:
https://YOUR-VERCEL-APP.vercel.app/menu?table=1
...
https://YOUR-VERCEL-APP.vercel.app/menu?table=10

Important: the QR contains only the frontend URL + table number. Menu edits and orders are stored in MongoDB, so changing menu items does not require new QR codes.
