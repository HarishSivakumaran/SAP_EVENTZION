import React from 'react';
import EventDashBoard from './EventDashBoard';
import Navbar from './Navbar';
import WelcomeBanner from './WelcomeBanner';

const Home = () => {
    return (
        <div className="App px-5">
        <Navbar/>
        <WelcomeBanner/>
        <EventDashBoard/>
      </div>
    );
}

export default Home;