// frontend/src/App.tsx

import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationBar from "./components/layout/NavigationBar.tsx";
import Hero from "./components/ui/Hero.tsx";
import Showcase from "./components/ui/Showcase.tsx";
import SystemHighlights from "./components/ui/SystemHighlights.tsx";
import Footer from "./components/layout/Footer.tsx";
import MapView from "./components/ui/MapView.tsx";

// Home component that contains your main landing page content
const LandingPage = () => {
    return (
        <>
            <NavigationBar />
            <Hero />
            <Showcase />
            <SystemHighlights />
            <Footer />
        </>
    );
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/about" element={<div>About Page - Coming Soon</div>} />
                    <Route path="/features" element={<div>Features Page - Coming Soon</div>} />
                    <Route path="/live-map" element={<MapView />} />
                </Routes>

            </div>
        </Router>
    );
}

export default App;