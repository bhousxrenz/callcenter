import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar  from './components/Navbar.jsx';
import Home       from './pages/Home.jsx';
import Simulation from './pages/Simulation.jsx';
import Results    from './pages/Results.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"           element={<Home />}       />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/results"    element={<Results />}    />
        <Route path="*"           element={<Home />}       />
      </Routes>
    </BrowserRouter>
  );
}
