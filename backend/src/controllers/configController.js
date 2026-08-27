const BusinessConfig = require('../models/BusinessConfig');

const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  isOpen: day >= 1 && day <= 5, // Lunes a Viernes por defecto
  startTime: '09:00',
  endTime: '18:00',
}));

const getOrCreateConfig = async () => {
  let config = await BusinessConfig.findOne();
  if (!config) {
    config = await BusinessConfig.create({
      businessName: process.env.BUSINESS_NAME || 'Mi Negocio',
      weeklySchedule: DEFAULT_SCHEDULE,
    });
  }
  return config;
};

// GET /api/config  (público)
const getConfig = async (req, res, next) => {
  try {
    const config = await getOrCreateConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
};

// PUT /api/config  (admin)
const updateConfig = async (req, res, next) => {
  try {
    const config = await getOrCreateConfig();
    Object.assign(config, req.body);
    await config.save();
    res.json(config);
  } catch (error) {
    next(error);
  }
};

module.exports = { getConfig, updateConfig, getOrCreateConfig };
