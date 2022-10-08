// import * as React from 'react';
// import Paper from '@mui/material/Paper';
// import { ViewState } from '@devexpress/dx-react-scheduler';
// import {
//   Scheduler,
//   DayView,
//   Appointments,
// } from '@devexpress/dx-react-scheduler-material-ui';
// import EventCalendar from './EventCalendar';

// const currentDate = '2022-09-30';
// const schedulerData = [
//   { startDate: '2022-09-30T09:45', endDate: '2022-09-30T11:00', title: 'Introduction' },
//   { startDate: '2022-09-30T12:00', endDate: '2022-09-30T13:30', title: 'Pictonary' },
// ];

// const EventSchedular = () => (
//   <Paper>
//     <Scheduler
//       data={schedulerData}
//     >
//       <ViewState
//         currentDate={currentDate}
//       />
//       <DayView
//         startDayHour={9}
//         endDayHour={14}
//       />
//       <Appointments />
//     </Scheduler>
//   </Paper>
// );
// export default EventSchedular;

import * as React from 'react';
import Paper from '@mui/material/Paper';
import { ViewState } from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  WeekView,
  Toolbar,
  DateNavigator,
  Appointments,
  TodayButton,
  ViewSwitcher,
} from '@devexpress/dx-react-scheduler-material-ui';

import appointments from './appointments';

const schedulerData = [
      { startDate: '2022-08-30T10:00', endDate: '2022-08-30T11:00', title: 'Introduction' },
      { startDate: '2022-08-30T11:00', endDate: '2022-08-30T12:30', title: 'Pictonary' },
      { startDate: '2022-08-30T12:30', endDate: '2022-08-30T14:00', title: 'Lunch Break' },
      { startDate: '2022-08-30T14:00', endDate: '2022-08-30T15:00', title: 'Quiz' },
      { startDate: '2022-08-30T15:00', endDate: '2022-08-30T16:00', title: 'closing note' },
    ];

const EventSchedular = class Demo extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      data: schedulerData,
      currentDate: '2022-08-30',
    };
    this.currentDateChange = (currentDate) => { this.setState({ currentDate }); };
  }

  render() {
    const { data, currentDate } = this.state;

    return (
      <Paper className='pt-2' style={{minHeight: "80vh", borderColor: "#ffc000", borderWidth:"5px"}}>
        <Scheduler
          data={data}
          height="700"
        >
          <ViewState
            currentDate={currentDate}
            onCurrentDateChange={this.currentDateChange}
          />
          <DayView
            startDayHour={9}
            endDayHour={18}
          />
          <WeekView
            startDayHour={10}
            endDayHour={19}
          />
          <Toolbar />
          <ViewSwitcher />
          <DateNavigator />
          <TodayButton />
          <Appointments />
        </Scheduler>
      </Paper>
    );
  }
}
export default EventSchedular;
