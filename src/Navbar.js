import React from "react";
import "./style.css";
const Navbar = () => {
  return (
    // Navbar will be in expanded, till it hits the large breakpoint
    <div className="navbar navbar-expand-lg navbar-light">
      <div className="container-fluid justify-content-start">
        <img
          src="https://media.istockphoto.com/photos/ice-cube-picture-id157694271?b=1&k=20&m=157694271&s=170667a&w=0&h=8tt3X0QPWDRUq43kL4d5h01dedyE7JnujI23aKKjTEM="
          style={{ width: "100px" }}
        ></img>
        <a class="navbar-brand title_bold text-warning me-5" href="#">
          SAP EventZion
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#SearchBar"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="SearchBar" className="collapse navbar-collapse">
          <form class="d-flex align-items-center">
          <span className="bi bi-search h5" style={{position: 'relative', left: '35px'}}></span>
            <input
              class="form-control me-2 ps-5"
              type="search"
              style={{width: '400px', borderRadius : '15px'}}
              placeholder="Search for Event"/>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
