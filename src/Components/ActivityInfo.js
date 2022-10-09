import React, { useContext, useState } from "react";
import Dialog from "@mui/material/Dialog";
import "../style.css";
import "../App.css";
import ActivityContext from "../Context/ActivityContext";

const ActivityInfo = ({
  image = "https://images.pexels.com/photos/4940096/pexels-photo-4940096.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  title = "♠ Poker Night ♦",
  desc = "Poker is a family of comparing card games in which players wager over which hand is best according to that specific game's rules in ways similar to these rankings.",
}) => {
  const [show, setShow] = useState(false);
  const { schedulerData, setSchedulerData, setOpen } =
    useContext(ActivityContext);
  var actScheduler = {
    startDate: "",
    endDate: "",
    title: title,
  };

  var date = "";

  return (
    <div className="Activity-Card m-5">
      <div className="ImageBox">
        <img src={image}></img>
      </div>
      <div className="details">
        <p>{title}</p>
        <div className="Actions">
          <h5 className="mx-3">{desc}</h5>
          <button
            className="btn btn-warning mt-2"
            onClick={() => {
              setShow(true);
            }}
          >
            Add
          </button>
        </div>
      </div>
      <Dialog
        maxWidth="xl"
        open={show}
        onClose={() => {
          setShow(false);
        }}
        aria-labelledby="responsive-dialog-title"
      >
        <div className="card mb-3" style={{ width: "700px", height: "500px" }}>
          <div className="row g-0">
            <div className="col-md-4">
              <img
                src={image}
                style={{ height: "500px" }}
                className="img-fluid rounded-start"
                alt="..."
              />
            </div>
            <div className="col-md-8">
              <div className="card-body">
                <h1 className="card-title">{title}</h1>
                <h5 className="ms-2" style={{ fontFamily: "cursive" }}>
                  {desc}
                </h5>
                <form className="px-2 py-4">
                  <label style={{ fontWeight: "bolder" }} for="EventDay">
                    Activity's Date:{" "}
                  </label>
                  <input
                    className="ms-2 Form-Input"
                    type="date"
                    id="EventDay"
                    name="EventDayDate"
                    onChange={(e) => {
                      date = e.target.value;
                    }}
                  />
                </form>
                <form className="px-2 py-4">
                  <label style={{ fontWeight: "bolder" }} for="EventDayTimeS">
                    Activity's From:{" "}
                  </label>
                  <input
                    className="ms-4 Form-Input"
                    type="time"
                    id="EventDayTimeS"
                    name="EventDayDate"
                    onChange={(e) => {
                      actScheduler.startDate = date + "T" + e.target.value;
                    }}
                  />
                </form>
                <form className="px-2 py-4">
                  <label style={{ fontWeight: "bolder" }} for="EventDayTimeE">
                    Activity's To:{" "}
                  </label>
                  <input
                    className="ms-4 Form-Input"
                    type="time"
                    id="EventDayTimeE"
                    name="EventDayDate"
                    onChange={(e) => {
                      actScheduler.endDate = date + "T" + e.target.value;
                    }}
                  />
                </form>
              </div>
              <div className="d-flex justify-content-end">
                <button
                  className="btn btn-primary mx-2"
                  onClick={() => {
                    setSchedulerData([...schedulerData, actScheduler]);
                    setShow(false);
                    setOpen(false);
                  }}
                >
                  Add
                </button>
                <button
                  className="btn btn-secondary ms-2 me-4"
                  onClick={() => {
                    setShow(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ActivityInfo;
