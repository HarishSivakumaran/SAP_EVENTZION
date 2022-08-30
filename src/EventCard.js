import React from "react";

const EventCard = ({
  title = "Escape Room",
  subtitle = "know your peers",
  partCount = "10",
  icon = "https://www.svgrepo.com/show/307794/exit-door-run-escape.svg",
  // icon = "https://www.svgrepo.com/show/241586/popcorn.svg",
  dueDate = "Tomorrow",
  progress = "75%"
}) => {
  return (
    <div className="card p-3 m-2" style={{ borderRadius: "20px" }}>
      <img
        className="img-fluid mb-5"
        src={icon}
        style={{ width: "50px" }}
      ></img>
      <h3
        className="text-start"
        style={{ color: "#3e485b", fontWeight: "bold" }}
      >
        {title}
      </h3>
      <h3
        className="text-start"
        style={{ color: "#3e485b", fontWeight: "bold" }}
      >
        {subtitle}
      </h3>
      <div className="d-flex justify-content-between">
        <div className="d-flex mt-2">
          <img
            className="img-fluid mb-5"
            src="https://www.svgrepo.com/show/275200/man-people.svg"
            style={{ width: "30px" }}
          ></img>
          <img
            className="img-fluid mb-5"
            src="https://www.svgrepo.com/show/275198/man-people.svg"
            style={{ width: "30px" }}
          ></img>
          <img
            className="img-fluid mb-5"
            src="https://www.svgrepo.com/show/210997/user-people.svg"
            style={{ width: "30px" }}
          ></img>
          <button
            className="mb-5"
            style={{
              borderRadius: "50px",
              backgroundColor: "#edf4ff",
              fontSize: "12px",
              borderColor: "#edf4ff",
            }}
          >
            {partCount}+
          </button>
        </div>
        <h5 className="mt-2 text-secondary">{dueDate}</h5>
      </div>
      <div class="progress">
        <div
          class="progress-bar bg-warning"
          style={{width: progress}}
        >{progress}</div>
      </div>
    </div>
  );
};

export default EventCard;
