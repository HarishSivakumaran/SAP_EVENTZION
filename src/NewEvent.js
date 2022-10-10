import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { DesktopDateRangePicker } from "@mui/x-date-pickers-pro";
import { LocalizationProvider } from "@mui/x-date-pickers-pro";
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';

const NewEvent = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const [value, setValue] = React.useState([30, 60]);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [EvenName, setEventName] = useState("");
  const [date, setDate] = useState([null, null]);

  return (
    <div
      style={{
        backgroundColor: "#edf4ff",
        borderRadius: "20px",
        borderStyle: "dashed",
        height: "87%",
      }}
    >
      <div
        className="card btn justify-content-center align-items-center"
        onClick={handleShow}
        style={{
          backgroundColor: "#edf4ff",
          borderRadius: "20px",
          borderStyle: "dashed",
          height: "100%",
        }}
      >
        <a className="bi bi-plus-circle h1 text-primary m-3"></a>
        <h2 className="text-primary">Add New Event</h2>
      </div>

      <Modal show={show} centered>
        <Modal.Header closeButton>
          <Modal.Title
            className="text-warning text-center"
            style={{ fontSize: "25px", fontWeight: "bolder" }}
          >
            Plan your event
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          // style={{ backgroundColor: "grey" }}
          className="text-dark h5"
        >
          <Form className="px-2">
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Event Name</Form.Label>
              <Form.Control
                required
                style={{
                  border: 0,
                  outline: 0,
                  borderBottom: "2px solid #1890ff",
                }}
                placeholder="Event Name"
                autoFocus
                onChange={(e) => {
                  setEventName(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                required
                style={{
                  border: 0,
                  outline: 0,
                  borderBottom: "2px solid #1890ff",
                }}
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
                <div className="container" style={{ fontWeight: "normal" }}>
                  <input type="radio" value="Crp" name="gender" /> Corporate
                  Event (Formal)
                </div>
                <div className="container" style={{ fontWeight: "normal" }}>
                  <input type="radio" value="fp" name="gender" /> Funparty
                </div>
                <div className="container" style={{ fontWeight: "normal" }}>
                  <input type="radio" value="TBA" name="gender" /> Team building
                  Activity
                </div>
                <div className="container" style={{ fontWeight: "normal" }}>
                  <input type="radio" value="Other" name="gender" /> Other
                </div>
              </div>
            </Form.Group>
            <Form.Group className="my-4" controlId="exampleForm.ControlInput1">
              <Form.Label className="mb-4">Event Dates: </Form.Label>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                localeText={{ start: "Event start", end: "Event end" }}
              >
                <DesktopDateRangePicker
                  value={date}
                  onChange={(newValue) => {
                    setDate(newValue);
                  }}
                  renderInput={(startProps, endProps) => (
                    <React.Fragment>
                      <TextField {...startProps} />
                      <Box sx={{ mx: 2 }}> to </Box>
                      <TextField {...endProps} />
                    </React.Fragment>
                  )}
                />
              </LocalizationProvider>
            </Form.Group>
            <Form.Group className="my-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Age Group</Form.Label>
              <Slider
                getAriaLabel={() => "Temperature range"}
                value={value}
                onChange={handleChange}
                valueLabelDisplay="on"
                className="mx-1"
                sx={{
                  color: "#1890ff",
                }}
                // getAriaValueText={valuetext}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShow(false);
            }}
          >
            Close
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={() => {
              if (EvenName === "") {
                alert("Please give a name to the event !");
                return;
              }
              navigate("/newEvent/" + EvenName);
            }}
          >
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewEvent;
