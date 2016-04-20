import React from 'react';
import classNames from 'classnames';
import MaterialButton from '../components/materialButton.jsx';
import RangeSlider from '../components/slider.jsx';
import '../scss/radiopi.scss';

class RadioPi extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            play: false,
            stations: [],
            state: {
                lastPlayed: 0,
                playing: false,
                volume: 100
            }
        };
        this.prev = this.prev.bind(this);
        this.next = this.next.bind(this);
        this.toggle = this.toggle.bind(this);
        this.stationsUpdate = this.stationsUpdate.bind(this);
        this.stateUpdate = this.stateUpdate.bind(this);
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
    stationsUpdate(e) {
        this.setState({
            stations: e
        });
    }
    stateUpdate(e) {
        this.setState({
            state: e,
            play: e.playing
        });
    }
    stationClick(e) {
        socket.emit('Radio:start', {
            stream: e
        });
    }
    componentDidMount() {
        socket.on('Radio:stations', this.stationsUpdate);
        socket.on('Radio:state', this.stateUpdate);
        socket.emit('Radio:state:request');
    }
    componentWillUnmount() {
        socket.off('Radio:stations', this.stationsUpdate);
        socket.off('Radio:state', this.stateUpdate);
    }
    changeVolume(e) {
        console.log(e);
    }
    render() {
        var stations = this.state.stations.map((e, index) => {
            var classes = classNames({
                station: true,
                active: this.state.state.lastPlayed == index,
                faded: !this.state.state.playing && this.state.state.lastPlayed == index
            });
            return <div className={classes} onClick={this.stationClick.bind(this, e.stream) } key={index} >{e.name}</div>;
        });
        var toggleClasses = classNames({
            pause: this.state.play,
            play: !this.state.play
        });
        return (
            <div className="radiopi">
                <div className="stations">
                    {
                        stations.length ? stations : <div className="loading">Loading</div>
                    }
                </div>
                <div className="controls">
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