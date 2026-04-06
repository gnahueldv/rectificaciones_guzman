import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Ordenes, NuevaOrden, OrdenDetalle } from './pages/Ordenes.jsx';
import { Motores, MotorDetalle, Clientes, ClienteDetalle } from './pages/MotoresClientes.jsx';
import Caja from './pages/Caja.jsx';
import FastOrderForm from './components/orders/FastOrderForm.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"                  element={<Dashboard />} />
          <Route path="/ordenes"           element={<Ordenes />} />
          <Route path="/ordenes/nueva"     element={<FastOrderForm />} />
          <Route path="/ordenes/:id"       element={<OrdenDetalle />} />
          <Route path="/motores"           element={<Motores />} />
          <Route path="/motores/:id"       element={<MotorDetalle />} />
          <Route path="/clientes"          element={<Clientes />} />
          <Route path="/clientes/:id"      element={<ClienteDetalle />} />
          <Route path="/caja"              element={<Caja />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
