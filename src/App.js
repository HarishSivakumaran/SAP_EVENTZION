import logo from './logo.svg';
import './App.css';
import Navbar from './Navbar';
import WelcomeBanner from './WelcomeBanner';

function App() {
  return (
    <div className="App px-5">
      <Navbar/>
      <WelcomeBanner/>
    </div>
  );
}

export default App;
