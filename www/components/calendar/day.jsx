import React from 'react';
import Task from './task.jsx';
import classNames from 'classnames';

var months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
var days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

class Day extends React.Component {
    constructor (props) {
        super (props);
        this.state = {
            now: new Date()
        };
    }
    static get defaultProps () {
        return {
            date: new Date(),
            tasks: [{
                title: 'TestTestTestTestTestTestTestTestTestTestTestTestTest',
                checked: false
            },{
                title: 'Task2',
                checked: true
            }]
        };
    }
    render () {
        var disabled = this.state.now.getTime() < this.props.date.getTime();

        var temp = this.props.tasks ? this.props.tasks : [];
        var day = days[this.props.date.getDay()];
        var date = this.props.date.getDate() + ' ' + months[this.props.date.getMonth()];
        var classes = classNames({
            day: true,
            disabled: disabled,
            selected: this.state.now.toDateString() == this.props.date.toDateString()
        });
        return (
            <div className={classes}>
                <div className="dateHeader">{day + ', ' + date}</div>
                {
                    temp.map((e, i) => {
                        return <Task disabled={disabled} title={e.title} checked={false} key={'task' + i} zIndex={temp.length - i} />;
                    })
                }
            </div>
        );
    }
}
Day.propTypes = {
    tasks: React.PropTypes.array,
    date: React.PropTypes.object.isRequired,
    startDate: React.PropTypes.object,
    wantedDate: React.PropTypes.object
};

export default Day;