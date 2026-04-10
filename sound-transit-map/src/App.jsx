import './App.css'
import Map from "./Map";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="app">
      <Header />
      <div className="mapContainer">
        <Map />
      </div>
      <Footer />
    </div>
  );
}

export default App;

