import React from 'react';
import _ from 'lodash';
import '../scss/slider.scss';

class Slider extends React.Component {
    constructor(props) {
        super(props);
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.remap = this.remap.bind(this);
        this.socketState = this.socketState.bind(this);
        this.updateVolumeSlider = this.updateVolumeSlider.bind(this);
        this.sendVolume = this.sendVolume();

        this.mouse = {
            down: false
        };

        this.state = {
            handlePosition: '50%',
            value: this.props.defaultValue,
            min: this.props.min,
            max: this.props.max
        };
    }
    static get defaultProps() {
        return {
            defaultValue: 50,
            min: 0,
            max: 100,
            onChange: () => { }
        };
    }
    componentDidMount() {
        window.addEventListener('resize', this.updateVolumeSlider);
        window.addEventListener('mouseup', this.mouseUp);
        document.addEventListener('mousedown', this.mouseDown);
        document.addEventListener('mousemove', this.mouseMove);
        document.addEventListener('touchmove', this.mouseMove);
        document.addEventListener('touchstart', this.mouseDown);
        document.addEventListener('touchend', this.mouseUp);
        this.handleHeight = this.refs.handle.getClientRects()[0].height;
        socket.on('Radio:state', this.socketState);
        setTimeout(() => socket.emit('Radio:state:request'), 500); // the menu's transition duration
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateVolumeSlider);
        window.removeEventListener('mouseup', this.mouseUp);
        document.removeEventListener('mousedown', this.mouseDown);
        document.removeEventListener('mousemove', this.mouseMove);
        document.removeEventListener('touchmove', this.mouseMove);
        document.removeEventListener('touchstart', this.mouseDown);
        document.removeEventListener('touchend', this.mouseUp);
        socket.off('Radio:state');
    }
    socketState(e) {
        if (this.mouse.down) return;
        this.updateVolumeSlider({
            volume: e.volume
        });
    }
    updateVolumeSlider(e) {
        var rect = this.refs.slider.getClientRects()[0];
        var value;

        if (e.type == 'resize') {
            value = this.state.value;
        }
        else if (e.volume) {
            value = e.volume;
        }
        else if (!window.menu) {
            if (e.type == 'touchmove') e = e.touches[0];

            if (!window.volumeSlider && e.type == 'touchmove') return;

            value = this.state.max - this.remap(rect.left + rect.width - e.clientX, 0, rect.width, this.state.min, this.state.max);
        }
        this.setState({
            value: value,
            handlePosition: Math.min(rect.width - 40, Math.max(40, this.remap(value, this.state.min, this.state.max, 0, rect.width))) + 'px'
        });
        return value;
    }
    mouseDown(e) {
        var rect = this.refs.slider.getClientRects()[0];
        var touch = e.type == 'touchstart';
        if (touch) {
            e = e.touches[0];
        }
        if (e.clientX >= rect.left && e.clientX <= rect.left + rect.width && e.clientY >= rect.top && e.clientY <= rect.top + rect.height) {
            this.mouse.down = true;
            if (touch) window.volumeSlider = true;
        }
        this.mouseMove(e);
    }
    mouseMove(e) {
        if (this.mouse.down) {
            this.sendVolume(this.updateVolumeSlider(e));
        }
    }
    sendVolume() {
        return _.throttle((value) => socket.emit('Radio:volume', value), 100);
    }
    mouseUp() {
        this.mouse.down = false;
        window.volumeSlider = false;
    }
    remap(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }
    render() {
        var handleStyle = {
            left: this.state.handlePosition,
            width: this.handleHeight
        };
        var sliderStyle = {
            borderRadius: this.handleHeight
        };

        return (
            <div className="slider" ref="slider" style={sliderStyle}>
                <div className="background"></div>
                <div className="foreground"></div>
                <div className="handle" style={handleStyle} ref="handle"></div>
                <div className="leftIcon"><i className="fa fa-fw fa-volume-off"></i></div>
                <div className="rightIcon"><i className="fa fa-fw fa-volume-up"></i></div>
                <div className="overlay"></div>
            </div>
        );
    }
}
Slider.propTypes = {
    onChange: React.PropTypes.func,
    defaultValue: React.PropTypes.number,
    min: React.PropTypes.number,
    max: React.PropTypes.number
};

export default Slider;