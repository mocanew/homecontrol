import React from 'react';
import classnames from 'classnames';
import {Button, Input} from 'material-react';
import RangeSlider from '../components/slider.jsx';
import '../scss/radiopi.scss';

class RadioPi extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stations: [],
            lastPlayed: 0,
            playing: false,
            volume: 100,
            edit: false
        };
        this.prev = this.prev.bind(this);
        this.next = this.next.bind(this);
        this.toggle = this.toggle.bind(this);
        this.stateUpdate = this.stateUpdate.bind(this);
        this.stationUpdate = this.stationUpdate.bind(this);

        this.save = this.save.bind(this);
        this.enterEditMode = this.enterEditMode.bind(this);
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
    enterEditMode(e) {
        this.setState({
            edit: e
        });
    }
    save() {
        console.log('save');
    }
    componentDidMount() {
        socket.on('Radio:state', this.stateUpdate);
        socket.on('Radio:stations', this.stationUpdate);
        socket.emit('Radio:state:request');

        window.HomeControl.on('edit', this.enterEditMode);
        window.HomeControl.on('save', this.save);
    }
    componentWillUnmount() {
        socket.off('Radio:state', this.stateUpdate);
        socket.off('Radio:stations', this.stationUpdate);

        window.HomeControl.off('edit', this.enterEditMode);
        window.HomeControl.off('save', this.save);
    }
    render() {
        var stations;
        if (this.state.edit) {
            stations = this.state.stations.map((e, index) => {
                return <div className="editedStation" key={index}>
                    <Input value={e.name} title="Nume post radio" />
                    <Input value={e.url} title="URL" />
                </div>;
            });
        }
        else {
            stations = this.state.stations.map((e, index) => {
                var classes = classnames({
                    station: true,
                    active: this.state.lastPlayed == index,
                    faded: !this.state.playing && this.state.lastPlayed == index
                });
                return <div className={classes} onClick={this.stationClick.bind(this, e) } key={index} >{e.name}</div>;
            });
        }
        var toggleClasses = classnames({
            pause: this.state.playing,
            play: !this.state.playing
        });
        var titleClasses = classnames({
            radioTitle: true,
            empty: !this.state.title || this.state.title.length == 0
        });
        var wrapperClasses = classnames({
            radiopi: true,
            noPadding: this.state.edit,
            titleShown: this.state.title && this.state.title.length != 0
        });
        var controlClasses = classnames({
            controls: true,
            out: this.state.edit
        });
        return (
            <div className={wrapperClasses}>
                <div className="stations">
                    {
                        stations.length ? stations : <div className="loading">Loading</div>
                    }
                </div>
                <div className={controlClasses}>
                    <div className={titleClasses}>
                        {
                            this.state.title ? this.state.title : ''
                        }
                    </div>
                    <RangeSlider />
                    <Button buttonStyle="flat iconBtn leftArrow" onClick={this.prev} ></Button>
                    <Button buttonStyle="flat iconBtn" classes={toggleClasses} onClick={this.toggle} ref="toggle" ></Button>
                    <Button buttonStyle="flat iconBtn rightArrow" onClick={this.next} ></Button>
                </div>
            </div>
        );
    }
}

export default RadioPi;