import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import CreateAuction from './pages/CreateAuction';
import ViewAuction from './pages/ViewAuction';
import FinalizeAuction from './pages/FinalizeAuction';

const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateAuction />} />
        <Route path="/auction/:auctionId" element={<ViewAuction />} />
        <Route path="/auction/:auctionId/finalize" element={<FinalizeAuction />} />
      </Routes>
    </div>
  );
};

export default App;

