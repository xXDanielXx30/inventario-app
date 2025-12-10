const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ======================================
// Archivo de datos
// ======================================
const DATA_FILE = path.join(__dirname, 'data.json');

// Leer DB
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { equipment: [], devices: [], assignments: [] };
  }
}

// Guardar DB
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let db = readData();

// ======================================
// ENDPOINTS EQUIPMENT
// ======================================
app.get('/equipment', (req, res) => {
  res.json(db.equipment);
});

app.post('/equipment', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = db.equipment.length ? Math.max(...db.equipment.map(e => e.id)) + 1 : 1;
  const newEquipment = { id, name };
  db.equipment.push(newEquipment);
  writeData(db);
  res.status(201).json(newEquipment);
});

app.delete('/equipment/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.equipment.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Equipment not found' });

  const removed = db.equipment.splice(idx, 1)[0];
  db.assignments = db.assignments.filter(a => a.equipmentId !== id);
  writeData(db);
  res.json(removed);
});

// ======================================
// ENDPOINTS DEVICES
// ======================================
app.get('/devices', (req, res) => {
  res.json(db.devices);
});

app.post('/devices', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = db.devices.length ? Math.max(...db.devices.map(d => d.id)) + 1 : 1;
  const newDevice = { id, name };
  db.devices.push(newDevice);
  writeData(db);
  res.status(201).json(newDevice);
});

app.delete('/devices/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.devices.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Device not found' });

  const removed = db.devices.splice(idx, 1)[0];
  db.assignments = db.assignments.filter(a => a.deviceId !== id);
  writeData(db);
  res.json(removed);
});

// ======================================
// ENDPOINTS ASSIGNMENTS
// ======================================
app.get('/assignments', (req, res) => {
  const enriched = db.assignments.map(a => {
    const eq = db.equipment.find(e => e.id === a.equipmentId);
    const dev = db.devices.find(d => d.id === a.deviceId);
    return {
      ...a,
      equipmentName: eq?.name || 'Unknown',
      deviceName: dev?.name || 'Unknown'
    };
  });
  res.json(enriched);
});

app.post('/assignments', (req, res) => {
  const { equipmentId, deviceId, quantity } = req.body;
  if (!equipmentId || !deviceId) {
    return res.status(400).json({ error: 'equipmentId and deviceId are required' });
  }

  const id = db.assignments.length ? Math.max(...db.assignments.map(a => a.id)) + 1 : 1;

  const newAssignment = {
    id,
    equipmentId: Number(equipmentId),
    deviceId: Number(deviceId),
    quantity: Number(quantity || 1)
  };

  db.assignments.push(newAssignment);
  writeData(db);
  res.status(201).json(newAssignment);
});

app.delete('/assignments/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = db.assignments.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Assignment not found' });

  const removed = db.assignments.splice(idx, 1)[0];
  writeData(db);
  res.json(removed);
});

// ======================================
// SERVIR ARCHIVOS DEL PROYECTO (sin carpeta public)
// ======================================
app.use(express.static(__dirname));

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// ======================================
// INICIAR SERVIDOR
// ======================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando correctamente 🚀 en puerto ${PORT}`);
});
