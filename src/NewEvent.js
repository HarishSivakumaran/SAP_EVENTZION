import React from "react";

const NewEvent = () => {
    return(
        <div className="card justify-content-center align-items-center p-5 m-2" style={{backgroundColor: "#edf4ff", borderRadius: "20px", borderStyle:"dashed", height: "95%"}}>
              <a className="bi bi-plus-circle h1 text-primary m-3"></a>
              <h2 className="text-primary">Add New Event</h2>
        </div>
    );
}

export default NewEvent;