import React from "react";
import { useNavigate  } from 'react-router-dom'


const NewEvent = () => {
    const navigate = useNavigate ();
    return(
        <div className="card btn justify-content-center align-items-center p-5 m-2" 
        onClick={() => {navigate('/newEvent');}}
        style={{backgroundColor: "#edf4ff", borderRadius: "20px", borderStyle:"dashed", height: "95%"}}>
              <a className="bi bi-plus-circle h1 text-primary m-3"></a>
              <h2 className="text-primary">Add New Event</h2>
        </div>
    );
}

export default NewEvent;