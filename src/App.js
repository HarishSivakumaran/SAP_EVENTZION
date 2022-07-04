import logo from './logo.svg';
import './App.css';
import Navbar from './Navbar';
import WelcomeBanner from './WelcomeBanner';
import EventDashBoard from './EventDashBoard';

function App() {
  return (
    <div className="App px-5">
      <Navbar/>
      <WelcomeBanner/>
      <EventDashBoard/>
    </div>
  );
}

export default App;
