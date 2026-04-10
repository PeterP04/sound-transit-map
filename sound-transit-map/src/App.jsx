import './App.css'
import Map from "./Map";
import Header from "./components/Header";

function App() {
  return (
    <div className="app">
      <Header />
      <div className="mapContainer">
        <Map />
      </div>
    </div>
  );
}

export default App;

