import React, { useContext, useState } from "react";
import Dialog from "@mui/material/Dialog";
import ActivityContext from "../Context/ActivityContext";
import "../style.css";
import ActivityInfo from "./ActivityInfo";

const ActivitiesList = () => {
  const { open, setOpen } = useContext(ActivityContext);
  return (
    <Dialog
      maxWidth="xl"
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      aria-labelledby="responsive-dialog-title"
    >
      <div className="Activ-List px-2">
        <div className="row row-cols-3">
        <div className="col">
            <ActivityInfo
              title="Custom Activity 🔧"
              image="https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=1600"
              desc="Build your own activity. SAP EventZion provisions you with the tools to customize and create your activity along with many out of the box activities."
              custom = "true"
            />{" "}
          </div>
          <div className="col">
            <ActivityInfo />
          </div>
          <div className="col">
            <ActivityInfo
              title="Chess"
              image="https://images.pexels.com/photos/839428/pexels-photo-839428.jpeg?auto=compress&cs=tinysrgb&w=1600"
              desc="Chess is a board game for two players. It is sometimes called Western chess or international chess to distinguish it from related games, such as xiangqi and shogi."
            />
          </div>
          <div className="col">
            <ActivityInfo
              title="Video Game Night"
              image="https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1600"
              desc="FIFA, also known as FIFA Football and set to be known as EA Sports FC from 2023, is a series of association football video games EA Sports."
            />{" "}
          </div>
          <div className="col">
            <ActivityInfo
              title="Ludo"
              image="https://images.pexels.com/photos/37534/cube-six-gambling-play-37534.jpeg?auto=compress&cs=tinysrgb&w=1600"
              desc="Ludo is a strategy board game for two to four players, in which the players race their four tokens from start to finish according to the rolls of a single die."
            />{" "}
          </div>
          <div className="col">
            <ActivityInfo
              title="Pictionary"
              image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAhemFKDFCKZnkxTR75T4_hM8bKav2opnc7w&usqp=CAU"
              desc="Pictionary is a charades-inspired word-guessing game. The team chooses one person to begin drawing; this position rotates with each word. "
            />{" "}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ActivitiesList;
