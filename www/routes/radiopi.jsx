import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import sortable from 'sortablejs';
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
        this.updateStations = this.updateStations.bind(this);
        this.removeStation = this.removeStation.bind(this);
        this.mantainOrder = this.mantainOrder.bind(this);
        this.addEmpty = this.addEmpty.bind(this);
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
        this.setState(e, () => this.mantainOrder());
    }
    stationUpdate(e) {
        if (this.state.edit && this.state.stations && this.state.stations.length) return;

        this.setState({
            stations: e
        }, () => this.mantainOrder());
    }
    stationClick(e) {
        socket.emit('Radio:start', e);
    }
    enterEditMode(e) {
        this.setState({
            edit: e
        });
        this.mantainOrder(false);
        if (e) this.updateStations();
        if (!e) socket.emit('Radio:state:request');
    }
    save() {
        console.log(_.clone(this.state.stations));
        this.mantainOrder();
        console.log(_.clone(this.state.stations));
        socket.emit('Radio:replaceStations', this.state.stations);
    }
    mantainOrder(sort = true, regenerateOrder, cb = () => { }) {
        var stations = this.state.stations;
        if (sort) stations = _.sortBy(stations, 'order');

        stations.forEach((station, index) => {
            if (!station.name && !station.url) {
                stations.splice(index, 1);
            }
            if (regenerateOrder || !_.isNumber(station.order)) {
                station.order = index;
            }
        });
        if (this.state.edit) {
            this.addEmpty(stations);
        }
        if (sort) {
            this.setState({
                stations: stations
            }, cb);
        }
        else {
            this.forceUpdate();
        }
    }
    componentDidMount() {
        socket.on('Radio:state', this.stateUpdate);
        socket.on('Radio:stations', this.stationUpdate);
        socket.emit('Radio:state:request');

        window.HomeControl.on('edit', this.enterEditMode);
        window.HomeControl.on('save', this.save);

        this.sortable = new sortable(this.stationsNode, {
            group: {
                name: 'stations',
                put: false,
                pull: 'clone'
            },
            dataIdAttr: 'data-id',
            animation: 150,
            filter: '.visible',
            handle: '.handle',
            draggable: '.editedStation',
            onEnd: this.onEnd.bind(this)
        });
    }
    onEnd(e) {
        var stationsList = this.state.stations;
        stationsList.splice(e.newIndex, 0, stationsList.splice(e.oldIndex, 1)[0]);
        this.mantainOrder(false, true);
        this.updateStations();
    }
    componentWillUnmount() {
        socket.off('Radio:state', this.stateUpdate);
        socket.off('Radio:stations', this.stationUpdate);

        window.HomeControl.off('edit', this.enterEditMode);
        window.HomeControl.off('save', this.save);
        this.sortable.destroy();
    }
    updateStations(station, nameOrURL, newValue) {
        var last = this.state.stations[this.state.stations.length - 1];
        if (_.isObject(station)) station[nameOrURL] = newValue;

        if (last.name || last.url) {
            this.addEmpty(this.state.stations);
            this.forceUpdate();
        }
    }
    removeStation(station) {
        this.state.stations.splice(this.state.stations.indexOf(station), 1);
        this.mantainOrder();
    }
    addEmpty(stations) {
        stations.push({
            _id: _.uniqueId('station'),
            name: '',
            url: '',
            order: stations.length
        });
    }
    render() {
        var stations;
        if (this.state.edit) {
            stations = this.state.stations.map((e) => {
                return <div className="editedStation" key={e._id}>
                    <div className="handle"><i className="fa fa-fw fa-bars" /></div>
                    <Input value={e.name} onChange={this.updateStations.bind(this, e, 'name') } required={true} message="Câmp obligatoriu" title="Nume post radio" />
                    <Input value={e.url} onChange={this.updateStations.bind(this, e, 'url') } required={true} message="Câmp obligatoriu" title="URL" />
                    <div className="remove" onClick={this.removeStation.bind(this, e) }><i className="fa fa-fw fa-trash" /></div>
                </div>;
            });
        }
        else {
            stations = this.state.stations.map((e) => {
                var classes = classnames({
                    station: true,
                    active: this.state.lastPlayed == e.order,
                    faded: !this.state.playing && this.state.lastPlayed == e.order
                });
                return <div className={classes} onClick={this.stationClick.bind(this, e) } key={e._id} >{e.name}</div>;
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
                <div className="stations" ref={node => this.stationsNode = node}>
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