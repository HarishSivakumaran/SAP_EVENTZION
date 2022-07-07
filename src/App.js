import logo from "./logo.svg";
import "./App.css";
import Navbar from "./Navbar";
import WelcomeBanner from "./WelcomeBanner";
import EventDashBoard from "./EventDashBoard";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  Outlet,
  useParams,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AddNewEvent from "./AddNewEvent";
import Home from "./Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/newEvent" element={<AddNewEvent />} />
      </Routes>
    </Router>
  );
}

export default App;
