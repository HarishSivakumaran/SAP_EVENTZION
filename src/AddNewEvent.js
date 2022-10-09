import React from 'react';
import logo from './logo.svg';
import './App.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useParams } from 'react-router-dom';
const AddNewEvent = () => {
    const {EventName} = useParams();
    return(
        <div className="App px-5">
        <Navbar/>
        <h1 style={{fontFamily:'monospace', fontWeight: "bolder", fontSize: "70px", color: "#ffc000", textShadow: "2px 2px #000000"}}>{EventName}</h1>
        <Sidebar/>
     </div>
        
    );
}

export default AddNewEvent;