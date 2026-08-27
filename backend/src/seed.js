require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Service = require('./models/Service');
const BusinessConfig = require('./models/BusinessConfig');

const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  isOpen: day >= 1 && day <= 5,
  startTime: '09:00',
  endTime: '18:00',
}));

const run = async () => {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@negocio.com').toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Administrador',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'admin1234',
    });
    console.log(`Usuario admin creado: ${adminEmail}`);
  } else {
    console.log('Usuario admin ya existe, se omite creación');
  }

  let config = await BusinessConfig.findOne();
  if (!config) {
    config = await BusinessConfig.create({
      businessName: process.env.BUSINESS_NAME || 'Mi Negocio',
      weeklySchedule: DEFAULT_SCHEDULE,
    });
    console.log('Configuración inicial del negocio creada');
  } else {
    console.log('La configuración del negocio ya existe, se omite creación');
  }

  const count = await Service.countDocuments();
  if (count === 0) {
    await Service.insertMany([
      { name: 'Corte de cabello', description: 'Corte clásico', duration: 30, price: 4000 },
      { name: 'Coloración', description: 'Color completo', duration: 90, price: 12000 },
      { name: 'Manicura', description: 'Manicura tradicional', duration: 45, price: 5000 },
    ]);
    console.log('Servicios de ejemplo creados');
  } else {
    console.log('Ya existen servicios, se omite creación de ejemplos');
  }

  console.log('Seed completo.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
