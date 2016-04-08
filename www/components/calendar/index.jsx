import React from 'react';
import Day from './day.jsx';
import '../../scss/calendar.scss';

class Calendar extends React.Component {
    constructor (props) {
        super (props);
        this.state = {

        };
    }
    render () {
        var wanted = {
            date: 1,
            month: 2,
            year: 2016
        };
        var wantedDate = new Date(wanted.year, wanted.month, wanted.date);
        wantedDate = new Date();
        wantedDate.setDate(wantedDate.getDate() + 7 - wantedDate.getDay());
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() == 0 ? -6 : 1));
        var temp = [];

        if (!startDate.getTime() || !wantedDate.getTime()) return console.error('Invalid start date/wanted date');

        if (startDate.getTime() > wantedDate.getTime()) {
            wanted = {
                date: startDate.getDate(),
                month: startDate.getMonth(),
                year: startDate.getFullYear()
            };
            startDate = new Date(wantedDate.getTime());
            wantedDate = new Date(wanted.year, wanted.month, wanted.date);
        }
        var date = new Date(startDate.getTime());
        date.setDate(date.getDate() - date.getDay() + (date.getDay() == 0 ? -6 : 1));

        while (date.getTime() <= wantedDate.getTime() || date.getDay() != 1) {
            temp.push(<Day startDate={new Date(startDate.getTime())} date={new Date(date.getTime())} wantedDate={new Date(wantedDate.getTime())} key={date.getTime()} />);
            date.setDate(date.getDate() + 1);
        }
        var temp2 = [];
        for (var i = 0; i < temp.length; i+= 7) {
            var a = [];
            for (var j = 0; j < 7; j++) {
                a.push(temp[i + j]);
            }
            temp2.push(<div className="week" key={'week' + i / 7}>{a}</div>);
        }

        return (
            <div className="month">
                {
                    temp2
                }
            </div>
        );
    }
}

export default Calendar;