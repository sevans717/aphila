const express = require('express');
const app = express();

// Test each route module individually to find the problematic one
console.log('Testing routes...');

try {
  console.log('Testing auth routes...');
  const authRoutes = require('./dist/routes/auth.js');
  app.use('/auth', authRoutes.default);
  console.log('Auth routes OK');
} catch (error) {
  console.error('Auth routes failed:', error.message);
}

try {
  console.log('Testing categories routes...');
  const categoriesRoutes = require('./dist/routes/categories.routes.js');
  app.use('/categories', categoriesRoutes.default);
  console.log('Categories routes OK');
} catch (error) {
  console.error('Categories routes failed:', error.message);
}

try {
  console.log('Testing communities routes...');
  const communitiesRoutes = require('./dist/routes/communities.routes.js');
  app.use('/communities', communitiesRoutes.default);
  console.log('Communities routes OK');
} catch (error) {
  console.error('Communities routes failed:', error.message);
}

try {
  console.log('Testing discovery routes...');
  const discoveryRoutes = require('./dist/routes/discovery.routes.js');
  app.use('/discovery', discoveryRoutes.default);
  console.log('Discovery routes OK');
} catch (error) {
  console.error('Discovery routes failed:', error.message);
}

try {
  console.log('Testing messaging routes...');
  const messagingRoutes = require('./dist/routes/messaging.routes.js');
  app.use('/messaging', messagingRoutes.default);
  console.log('Messaging routes OK');
} catch (error) {
  console.error('Messaging routes failed:', error.message);
}

try {
  console.log('Testing subscription routes...');
  const subscriptionRoutes = require('./dist/routes/subscription.routes.js');
  app.use('/subscription', subscriptionRoutes.default);
  console.log('Subscription routes OK');
} catch (error) {
  console.error('Subscription routes failed:', error.message);
}

try {
  console.log('Testing moderation routes...');
  const moderationRoutes = require('./dist/routes/moderation.routes.js');
  app.use('/moderation', moderationRoutes.default);
  console.log('Moderation routes OK');
} catch (error) {
  console.error('Moderation routes failed:', error.message);
}

try {
  console.log('Testing mobile routes...');
  const mobileRoutes = require('./dist/routes/mobile.routes.js');
  app.use('/mobile', mobileRoutes.default);
  console.log('Mobile routes OK');
} catch (error) {
  console.error('Mobile routes failed:', error.message);
}

try {
  console.log('Testing geospatial routes...');
  const geospatialRoutes = require('./dist/routes/geospatial.routes.js');
  app.use('/geospatial', geospatialRoutes.default);
  console.log('Geospatial routes OK');
} catch (error) {
  console.error('Geospatial routes failed:', error.message);
}

try {
  console.log('Testing notifications routes...');
  const notificationsRoutes = require('./dist/routes/notifications.routes.js');
  app.use('/notifications', notificationsRoutes.default);
  console.log('Notifications routes OK');
} catch (error) {
  console.error('Notifications routes failed:', error.message);
}

try {
  console.log('Testing media routes...');
  const mediaRoutes = require('./dist/routes/media.routes.js');
  app.use('/media', mediaRoutes.default);
  console.log('Media routes OK');
} catch (error) {
  console.error('Media routes failed:', error.message);
}

try {
  console.log('Testing analytics routes...');
  const analyticsRoutes = require('./dist/routes/analytics.routes.js');
  app.use('/analytics', analyticsRoutes.default);
  console.log('Analytics routes OK');
} catch (error) {
  console.error('Analytics routes failed:', error.message);
}

try {
  console.log('Testing config routes...');
  const configRoutes = require('./dist/routes/config.routes.js');
  app.use('/config', configRoutes.default);
  console.log('Config routes OK');
} catch (error) {
  console.error('Config routes failed:', error.message);
}

console.log('Route testing complete!');
