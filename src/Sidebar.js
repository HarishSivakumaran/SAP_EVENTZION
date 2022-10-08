import React from "react";
import {
    CDBBadge,
    CDBSidebar,
    CDBSidebarHeader,
    CDBSidebarMenuItem,
    CDBSidebarContent,
    CDBSidebarMenu,
    CDBSidebarSubMenu,
    CDBSidebarFooter,
  } from 'cdbreact';
import { NavLink } from 'react-router-dom';
import "./style.css";
import EventCalendar from './EventCalendar';
import EventSchedular from "./Event schedular";
import EventSuggestions from "./EventSuggestions";

const Sidebar = () => {
    return (
//this js contains sidebar component on activity screen.
<div style={{ display: 'flex', height: '35vh', overflow: 'scroll initial' }}>
<CDBSidebar textColor="#333" backgroundColor="#ffc000">
  <CDBSidebarHeader style={{backgroundColor: "#252525", color: "white"}} prefix={<i className="fa fa-bars fa-large"></i>}>
    <a href="/" className="text-decoration-none h3" style={{ color: 'white' }}>
      Activities
    </a>
  </CDBSidebarHeader>
  <CDBSidebarContent>
    <CDBSidebarMenu>
    <CDBSidebarMenuItem icon="home" >
                <NavLink to="/">Home</NavLink>
              </CDBSidebarMenuItem>
              <CDBSidebarMenuItem icon="plus" >
                add
              </CDBSidebarMenuItem>
              <CDBSidebarMenuItem icon="gamepad">
                Activities
              </CDBSidebarMenuItem>
    </CDBSidebarMenu>
  </CDBSidebarContent>
  <CDBSidebarFooter style={{ textAlign: 'center' }}>
    <div
      className="sidebar-btn-wrapper"
      style={{
        padding: '20px 5px',
      }}
    >
    </div>
  </CDBSidebarFooter>
</CDBSidebar>
<div className="App px-5" >
<EventSchedular/>
</div>
<div className="App px-10">
<EventSuggestions/>
</div>
</div>

);
};

export default Sidebar;