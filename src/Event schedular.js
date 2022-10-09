import React, { useContext, useState } from "react";
import Paper from "@mui/material/Paper";
import { ViewState } from "@devexpress/dx-react-scheduler";
import {
  Scheduler,
  DayView,
  WeekView,
  Toolbar,
  DateNavigator,
  Appointments,
  TodayButton,
  ViewSwitcher,
} from "@devexpress/dx-react-scheduler-material-ui";
import ActivityContext from "./Context/ActivityContext";


const EventSchedular = () => {
  const {schedulerData, setSchedulerData} = useContext(ActivityContext);
  var currDate = new Date();
  const currentDate = `${currDate.getFullYear()}-${currDate.getMonth()+1}-${currDate.getDate()}`;
  const [eventDate, setEventDate] = useState(currentDate);

  return (
    <Paper
      className="pt-2"
      style={{ minHeight: "80vh", borderColor: "#ffc000", borderWidth: "5px" }}
    >
      <Scheduler data={schedulerData} height="700">
        <ViewState
          currentDate={eventDate}
          // onCurrentDateChange={this.currentDateChange}
        />
        <DayView startDayHour={9} endDayHour={18} />
        <WeekView startDayHour={10} endDayHour={19} />
        <Toolbar />
        <ViewSwitcher />
        <DateNavigator />
        <TodayButton />
        <Appointments/>
      </Scheduler>
    </Paper>
  );
};
export default EventSchedular;
