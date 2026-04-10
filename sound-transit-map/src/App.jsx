import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Map from "./Map";
import Header from "./components/Header";

function App() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Header />
      <Map />
    </div>
  );
}

export default App;

