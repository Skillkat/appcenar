const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { engine } = require('express-handlebars');
const path = require('path');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'layout',
  helpers: {
    
    if_eq: function(a, b, options) {
        return a === b ? options.fn(this) : options.inverse(this);
    },
    multiply: (a, b) => a * b
}
}));
  

  

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const sessionStore = new SequelizeStore({
  db: sequelize,
});
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 día
}));
sessionStore.sync();

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/client');
const commerceRoutes = require('./routes/commerce');
const deliveryRoutes = require('./routes/delivery');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/commerce', commerceRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

sequelize.sync({ force: false }).then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
  });
});