// server.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware para cookies
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const adminRouter = require('./routes/adminRouter');
const unidadeRouter = require('./routes/unidadeRouter');
const gestorRouter = require('./routes/gestorRouter');
const departamentoRouter = require('./routes/departamentoRouter');
const pessoaRouter = require('./routes/pessoaRouter');
const tecnicoRouter = require('./routes/tecnicoRouter');
const equipeRouter = require('./routes/equipeRouter');
const tipoSuporteRouter = require('./routes/tipoSuporteRouter');
const chamadoRouter = require('./routes/chamadoRouter');
const atividadeChamadoRouter = require('./routes/atividadeChamadoRouter');

app.use('/api/admin', adminRouter);
app.use('/api/unidade', unidadeRouter);
app.use('/api/gestor', gestorRouter);
app.use('/api/departamento', departamentoRouter);
app.use('/api/pessoa', pessoaRouter);
app.use('/api/tecnico', tecnicoRouter);
app.use('/api/equipe', equipeRouter);
app.use('/api/tiposuporte', tipoSuporteRouter);
app.use('/api/chamado', chamadoRouter);
app.use('/api/atividadechamado', atividadeChamadoRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`📖 Servidor rodando na porta ${PORT}`);
});