# Budget + Behavior Analyzer

A full-stack financial management application with smart insights and analytics. Track your spending, set budgets, and receive intelligent recommendations based on your spending patterns.

## Features

✅ **User Authentication** - Secure signup/login with JWT tokens
✅ **Transaction Management** - Full CRUD for income and expense tracking
✅ **Budget Allocation** - Set monthly budgets by category
✅ **Smart Insights** - AI-powered behavior analysis:
  - Overspending detection
  - Spending trends analysis
  - Budget compliance alerts
  - Income vs expense ratios
  - Spending velocity monitoring

✅ **Analytics Dashboard** - Visualize your financial data
✅ **Category Tracking** - Monitor spending by category
✅ **Responsive UI** - Modern, mobile-friendly interface

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT Authentication
- RESTful API

**Frontend:**
- React 18
- React Router
- Axios
- Tailwind CSS

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/himanshuksd/budget-behavior-analyzer.git
cd budget-behavior-analyzer
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Setup Database

```bash
# Create PostgreSQL database
creatdb budget_analyzer

# Create .env file in server directory
cp server/.env.example server/.env

# Edit server/.env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/budget_analyzer
# JWT_SECRET=your_jwt_secret_key_here

# Run migrations
cd server
node migrations/migrate.js
cd ..
```

### 3. Start Development Servers

```bash
# From root directory - runs both server and client
npm run dev

# Or run separately:
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm start
```

### 4. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Demo Account:** 
  - Email: `demo@example.com`
  - Password: `demo123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Transactions
- `GET /api/transactions` - Get all transactions (paginated)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budget
- `GET /api/budget/:month` - Get budget for month
- `POST /api/budget/:month` - Set budget allocations
- `GET /api/budget` - Get all budgets

### Insights
- `GET /api/insights/:month` - Get insights for month
- `POST /api/insights/:month/regenerate` - Regenerate insights
- `GET /api/insights` - Get insights summary

### Analytics
- `GET /api/analytics/summary/:month` - Get month summary
- `GET /api/analytics/trends` - Get spending trends
- `GET /api/analytics/categories/:month` - Get category breakdown
- `GET /api/analytics/comparison` - Month-over-month comparison

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/password` - Change password

## Project Structure

```
budget-behavior-analyzer/
├── server/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── budget.js
│   │   ├── insights.js
│   │   ├── analytics.js
│   │   └── user.js
│   ├── middleware/
│   │   └── auth.js
│   ├── services/
│   │   └── insightsEngine.js
│   ├── migrations/
│   │   ├── schema.sql
│   │   └── migrate.js
│   ├── db.js
│   ├── index.js
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Transactions.js
│   │   │   ├── Budget.js
│   │   │   ├── Insights.js
│   │   │   ├── Profile.js
│   │   │   └── ProtectedRoute.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Card.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── NotificationBox.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── .env.example
├── package.json
└── .gitignore
```

## Insights Engine

The application includes a sophisticated insights engine that analyzes spending patterns:

### 1. Overspending Detection
Identifies categories where spending exceeds allocated budget and calculates the percentage over.
- **Severity:** HIGH if >20% over, MEDIUM if 10-20% over
- **Action:** Set stricter limits or reduce discretionary spending

### 2. Trend Analysis
Compares spending patterns month-over-month to detect significant changes.
- **Severity:** HIGH if >30% increase, MEDIUM if 15-30% increase
- **Action:** Investigate sudden spending increases

### 3. Spending Velocity
Monitors transaction frequency to identify high-velocity spending.
- **Threshold:** >2 transactions per day
- **Severity:** HIGH if >3 transactions/day
- **Action:** Review frequent small purchases

### 4. Budget Compliance
Tracks budget usage percentage for each category.
- **Warning:** >90% of budget used
- **Opportunity:** <20% of budget used (potential savings)

### 5. Income-to-Expense Ratio
Calculates savings rate and flags unsafe spending levels.
- **Safe:** Saving >20% of income
- **Warning:** Saving 10-20% of income
- **Critical:** Saving <10% or spending >100% of income

## Security Features

- 🔒 Password hashing with bcryptjs
- 🔑 JWT-based authentication & authorization
- 🛡️ Protected API routes with middleware
- 👤 User data isolation
- 🚫 CORS protection
- ⚠️ Helmet security headers
- ✅ Input validation & sanitization
- 📝 Rate limiting on auth endpoints

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  monthly_income DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(500),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id, transaction_date)
);
```

### Budget Table
```sql
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  allocated_amount DECIMAL(12, 2) NOT NULL,
  month DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, month)
);
```

### Insights Table
```sql
CREATE TABLE insights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  severity VARCHAR(20), -- 'low', 'medium', 'high'
  message TEXT NOT NULL,
  metric_value DECIMAL(12, 2),
  month DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Interview Talking Points

1. **Architecture & Design:**
   - RESTful API design principles
   - Separation of concerns (routes, services, middleware)
   - JWT authentication flow
   - Database normalization

2. **Backend Development:**
   - Express middleware usage
   - Route protection with authentication
   - Complex SQL queries for analytics
   - Error handling & validation

3. **Insights Engine:**
   - Multi-criteria analysis algorithm
   - Time-series data analysis
   - Severity determination logic
   - Performance optimization for large datasets

4. **Frontend Development:**
   - React hooks & state management
   - Context API for auth state
   - Protected routes implementation
   - Responsive design
   - API integration

5. **Security & Best Practices:**
   - Password hashing & salting
   - JWT token management
   - CORS policy
   - Input validation
   - User data isolation

## Future Enhancements

- [ ] Chart visualizations (Chart.js)
- [ ] Recurring transactions
- [ ] Goal tracking & progress
- [ ] Export to CSV/PDF
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Machine learning predictions
- [ ] Multi-currency support
- [ ] Data import from banks
- [ ] Social features (compare with friends)
- [ ] Webhooks for real-time updates
- [ ] Advanced reporting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open a GitHub issue.

---

**Made with ❤️ for smarter financial management**
