import React from 'react';
import classNames from 'classnames';
import MaterialButton from '../components/materialButton.jsx';
import RangeSlider from '../components/slider.jsx';
import '../scss/radiopi.scss';

class RadioPi extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stations: [],
            lastPlayed: 0,
            playing: false,
            volume: 100
        };
        this.prev = this.prev.bind(this);
        this.next = this.next.bind(this);
        this.toggle = this.toggle.bind(this);
        this.stateUpdate = this.stateUpdate.bind(this);
        this.stationUpdate = this.stationUpdate.bind(this);
    }
    prev() {
        socket.emit('Radio:prev');
    }
    toggle() {
        this.setState({
            play: !this.state.play
        });
        socket.emit('Radio:toggle');
    }
    next() {
        socket.emit('Radio:next');
    }
    stateUpdate(e) {
        this.setState(e);
    }
    stationUpdate(e) {
        this.setState({
            stations: e
        });
    }
    stationClick(e) {
        socket.emit('Radio:start', e);
    }
    componentDidMount() {
        socket.on('Radio:state', this.stateUpdate);
        socket.on('Radio:stations', this.stationUpdate);
        socket.emit('Radio:state:request');
    }
    componentWillUnmount() {
        socket.off('Radio:state', this.stateUpdate);
        socket.off('Radio:stations', this.stationUpdate);
    }
    render() {
        var stations = this.state.stations.map((e, index) => {
            var classes = classNames({
                station: true,
                active: this.state.lastPlayed == index,
                faded: !this.state.playing && this.state.lastPlayed == index
            });
            return <div className={classes} onClick={this.stationClick.bind(this, e) } key={index} >{e.name}</div>;
        });
        var toggleClasses = classNames({
            pause: this.state.playing,
            play: !this.state.playing
        });
        var titleClasses = classNames({
            radioTitle: true,
            empty: !this.state.title || this.state.title.length == 0
        });
        return (
            <div className="radiopi">
                <div className="stations">
                    {
                        stations.length ? stations : <div className="loading">Loading</div>
                    }
                </div>
                <div className="controls">
                    <div className={titleClasses}>
                        {
                            this.state.title ? this.state.title : ''
                        }
                    </div>
                    <RangeSlider />
                    <MaterialButton buttonStyle="flat iconBtn leftArrow" onClick={this.prev} ></MaterialButton>
                    <MaterialButton buttonStyle="flat iconBtn" classes={toggleClasses} onClick={this.toggle} ref="toggle" ></MaterialButton>
                    <MaterialButton buttonStyle="flat iconBtn rightArrow" onClick={this.next} ></MaterialButton>
                </div>
            </div>
        );
    }
}

export default RadioPi;