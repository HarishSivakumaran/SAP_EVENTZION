import React from "react";
import EventCard from "./EventCard";
import NewEvent from "./NewEvent";

const EventDashBoard = () => {
  return (
    <section>
      <div className="d-flex mt-5 align-items-center justify-content-between ps-4 pe-5">
        <div>
          <ul className="nav">
            <li className="nav-item">
              <h2 className="nav-link text-warning active">My Events</h2>
            </li>
            <li className="nav-item">
              <h2 className="nav-link text-secondary">Invites</h2>
            </li>
            <li className="nav-item">
              <h2 className="nav-link text-secondary">Archives</h2>
            </li>
          </ul>
        </div>
        <div>
          <div
            className="btn btn-outline-secondary"
            style={{ borderRadius: "16px" }}
          >
            <span className="h4">Sort By:</span>{" "}
            <span className="h4 text-warning">Activity </span>
            <span className="bi bi-caret-down-fill h5"></span>
          </div>
        </div>
      </div>
      <div className="row mx-3">
        <div className="col">
          <NewEvent />
        </div>
        <div className="col">
          <EventCard title="Edward Spencer &" subtitle="Jessica Wedding Party" partCount="50" icon="https://www.svgrepo.com/show/402898/wedding.svg" dueDate="25th July" progress="25%"/>
        </div>
        <div className="col">
          <EventCard title="Basketball match" subtitle="MetLife Stadium" partCount="7" icon="https://www.svgrepo.com/show/3161/basketball.svg" dueDate="16th September" progress="70%"/>
        </div>
        <div className="col">
          <EventCard />
        </div>
      </div>
      <div className="row mx-3">
        <div className="col">
          <EventCard />
        </div>
        <div className="col">
          <EventCard />
        </div>
        <div className="col">
          <EventCard />
        </div>
        <div className="col">
          <EventCard />
        </div>
      </div>
    </section>
  );
};

export default EventDashBoard;
