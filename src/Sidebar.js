import React, { useState } from "react";
import {
  CDBBadge,
  CDBSidebar,
  CDBSidebarHeader,
  CDBSidebarMenuItem,
  CDBSidebarContent,
  CDBSidebarMenu,
  CDBSidebarSubMenu,
  CDBSidebarFooter,
} from "cdbreact";
import { NavLink, Link } from "react-router-dom";
import "./style.css";
import EventCalendar from "./EventCalendar";
import EventSchedular from "./Event schedular";
import EventSuggestions from "./EventSuggestions";
import ActivityContext from "./Context/ActivityContext";
import ActivitiesList from "./Components/ActivitiesList";

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  return (
    //this js contains sidebar component on activity screen.
    <ActivityContext.Provider value={{open, setOpen}}>
      <ActivitiesList />
      <div
        style={{ display: "flex", height: "35vh", overflow: "scroll initial" }}
      >
        <CDBSidebar textColor="#333" backgroundColor="#ffc000">
          <CDBSidebarHeader
            style={{ backgroundColor: "#252525", color: "white" }}
            prefix={<i className="fa fa-bars fa-large"></i>}
          >
            <a
              href="/"
              className="text-decoration-none h4"
              style={{ color: "white" }}
            >
              Activities
            </a>
          </CDBSidebarHeader>
          <CDBSidebarContent className="h5">
            <CDBSidebarMenu>
              <CDBSidebarMenuItem icon="home">
                <NavLink to="/">Home</NavLink>
              </CDBSidebarMenuItem>
              <CDBSidebarMenuItem icon="plus">
                <div
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  add
                </div>
              </CDBSidebarMenuItem>
              <CDBSidebarMenuItem icon="gamepad">Activities</CDBSidebarMenuItem>
            </CDBSidebarMenu>
          </CDBSidebarContent>
        </CDBSidebar>
        <div className="App px-5">
          <EventSchedular />
        </div>
        <div className="App px-10">
          <EventSuggestions />
        </div>
      </div>
    </ActivityContext.Provider>
  );
};

export default Sidebar;
