import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Slider from "@mui/material/Slider";

const NewEvent = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [value, setValue] = React.useState([20, 70]);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <div
      className="card btn justify-content-center align-items-center p-5 m-2"
      onClick={handleShow}
      style={{
        backgroundColor: "#edf4ff",
        borderRadius: "20px",
        borderStyle: "dashed",
        height: "95%",
      }}
    >
      <a className="bi bi-plus-circle h1 text-primary m-3"></a>
      <h2 className="text-primary">Add New Event</h2>

      <Modal show={show} onHide={handleClose} centered >
        <Modal.Header closeButton> 
          <Modal.Title className="text-warning">Plan your event</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{backgroundColor: '#2a6ac8'}} className="text-light h5">
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Event Name</Form.Label>
              <Form.Control type="input" placeholder="Event Name" autoFocus />
            </Form.Group>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="name@example.com"
                autoFocus
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>What type of event do you want to host ?</Form.Label>
              <div
                className="container justify-content-around"
                onChange={(test) => 1}
              >
                <div className="container" style={{fontWeight: 'normal'}}>
                  <input type="radio" value="Crp" name="gender" /> Corporate
                  Event(Formal)
                </div>
                <div className="container" style={{fontWeight: 'normal'}}>
                  <input type="radio" value="fp" name="gender" /> Funparty
                </div>
                <div className="container" style={{fontWeight: 'normal'}}>
                  <input type="radio" value="TBA" name="gender" /> Team building
                  Activity
                </div>
                <div className="container" style={{fontWeight: 'normal'}}>
                  <input type="radio" value="Other" name="gender" /> Other
                </div>
              </div>
            </Form.Group>
            <Form.Group className="my-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Age Group</Form.Label>
              <Slider
                getAriaLabel={() => "Temperature range"}
                value={value}
                onChange={handleChange}
                valueLabelDisplay="auto"
                className="mx-1"
                sx={{
                    color: 'white',
                  }}
                // getAriaValueText={valuetext}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {navigate('/newEvent');}}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewEvent;
