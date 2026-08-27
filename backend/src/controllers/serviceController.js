const Service = require('../models/Service');

// GET /api/services  (público: solo activos, admin: todos si ?all=true)
const getServices = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const services = await Service.find(filter).sort({ name: 1 });
    res.json(services);
  } catch (error) {
    next(error);
  }
};

// GET /api/services/:id
const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });
    res.json(service);
  } catch (error) {
    next(error);
  }
};

// POST /api/services  (admin)
const createService = async (req, res, next) => {
  try {
    const { name, description, duration, price, color } = req.body;
    if (!name || !duration) {
      return res.status(400).json({ message: 'Nombre y duración son requeridos' });
    }
    const service = await Service.create({ name, description, duration, price, color });
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

// PUT /api/services/:id  (admin)
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });
    res.json(service);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/services/:id  (admin) - baja lógica
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });
    res.json({ message: 'Servicio desactivado', service });
  } catch (error) {
    next(error);
  }
};

module.exports = { getServices, getService, createService, updateService, deleteService };
