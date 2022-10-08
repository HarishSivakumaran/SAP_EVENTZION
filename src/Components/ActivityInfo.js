import React from "react";
import "../style.css";

const ActivityInfo = ({
  image = "https://images.pexels.com/photos/4940096/pexels-photo-4940096.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  title = "♠ Poker Night ♦",
  desc = "Poker is a family of comparing card games in which players wager over which hand is best according to that specific game's rules in ways similar to these rankings."
}) => {
  return (
    <div className="Activity-Card m-5">
      <div className="ImageBox">
        <img src={image}></img>
      </div>
      <div className="details">
        <p>{title}</p>
        <div className="Actions">
          <h5 className="mx-3">
            {desc}
          </h5>
          <button className="btn btn-warning mt-2">Add</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityInfo;
