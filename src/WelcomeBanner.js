import React from "react";
import "./style.css";

const WelcomeBanner = () => {
  return (
    <section className="px-4">
      <div
        className="container-fluid text-light text-start ps-5"
        style={{ borderRadius: "50px", backgroundColor: "#2a6ac8" }}
      >
        <div className="row align-items-center justify-content-center text-center">
          <div className="col-3">
            <img
              className="img-fluid"
              style={{ width: "30rem", borderRadius: "50px" }}
              src="https://freesvg.org/img/boy5.png"
            ></img>
          </div>
          <div className="col-6">
            <h1 className="Banner-Text mb-2">Welcome Back, Johnathan !</h1>
            <span className="text-light text-start Banner-subtext">
              You have <span className="text-warning">2 Events</span> in Process
            </span>
            <div className="Banner-subtext">Let's get the fun started</div>
          </div>
          <div className="col-3">
            <img
              className="img-fluid"
              style={{ width: "30rem", borderRadius: "50px" }}
              src="https://freesvg.org/img/jonata_Boy_with_headphone.png"
            ></img>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeBanner;
