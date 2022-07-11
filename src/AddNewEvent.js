import React from 'react';
import logo from './logo.svg';
import './App.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
const AddNewEvent = () => {
    return(
        <div className="App px-5">
        <Navbar/>
        <Sidebar/>
     </div>
        
    );
}

export default AddNewEvent;