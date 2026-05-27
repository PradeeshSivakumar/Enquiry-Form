const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');

const { testConnection } = require('./config/db');
const dashboardRoutes = require('./routes/dashboard.routes');
const visitorsRoutes = require('./routes/visitors.routes');
const productsRoutes = require('./routes/products.routes');
const venueRoutes = require('./routes/venue.routes');
const employeeRoutes = require('./routes/employee.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const departmentRoutes = require('./routes/department.routes');
const leadCategoryRoutes = require('./routes/lead-category.routes');
const authRoutes = require('./routes/auth.routes');
const sidebarRoutes = require('./routes/sidebar.routes');
const rolesRoutes = require('./routes/roles.routes');
const modulesRoutes = require('./routes/modules.routes');
const campaignsRoutes = require('./routes/campaigns.routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api', (_req, res) => {
  res.json({
    message: 'NiralTek Enquiry Form API Server',
    version: '1.0.0',
    status: 'running',
    documentation: 'Visit /api for endpoint documentation'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/visitors', visitorsRoutes);
app.use('/api/visiting-cards', visitorsRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/lead-categories', leadCategoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sidebar', sidebarRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/campaigns', campaignsRoutes);

const frontendDistPath = path.join(__dirname, '..', 'dist', 'niraltek-enquiry', 'browser');
if (fs.existsSync(frontendDistPath)) {
  console.log(`Serving frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.use(errorMiddleware);

const { startScheduler } = require('./services/scheduler.service');

testConnection();
startScheduler();

app.listen(port, () => {
  console.log(`API server running at port ${port}`);
});
