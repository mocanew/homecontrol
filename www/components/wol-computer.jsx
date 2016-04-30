import React from 'react';
import MaterialButton from './materialButton.jsx';
import '../scss/_card.scss';
import classNames from 'classnames';

class Card extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            power: this.props.power
        };
        this.wake = this.wake.bind(this);
        this.ping = this.ping.bind(this);
        
        this.name = this.props.name ? this.props.name : 'Computer ' + this.props.id;
    }
    static get defaultProps () {
        return {
            power: false,
            name: '',
            ip: '',
            mac: '',
            image: 'images/general.jpg'
        };
    }
    componentWillReceiveProps (nextProps) {
        this.setState({
            power: nextProps.power
        });
    }
    wake () {
        this.setState({
            power: ''
        });
        socket.emit('WakeOnLan', {
            ip: this.props.ip,
            mac: this.props.mac
        });
    }
    ping () {
        this.setState({
            power: ''
        });
        socket.emit('WakeOnLan:ping', {
            ip: this.props.ip,
            mac: this.props.mac
        });
    }
    render () {
        var power = classNames({
            power: true,
            pinging: typeof this.state.power != 'boolean' ? true : false,
            on: this.state.power === true ? true : false
        });
        var imageStyle = {
            backgroundImage: 'url("' + this.props.image + '")'
        };
        return (
            <div className="card col-xs-12 col-sm-4 col-md-4">
            <div className="wrapper">
                <div className={power}>{ typeof this.state.power != 'boolean' ? <i className="fa fa-refresh fa-spin fa-fw"></i> : ''}</div>
                <div className="image" style={imageStyle}></div>
                <div className="titleRow">
                    <div className="title">{this.name}</div>
                    <div className="subtitle">{this.props.ip && this.props.ip.length ? (this.props.mac && this.props.mac.length ? this.props.ip + ' - ' + this.props.mac : this.props.ip) : this.props.mac}</div>
                </div>
                <div className="buttonsRow">
                    <MaterialButton buttonStyle="flat" onClick={this.ping}>Ping</MaterialButton>
                    <MaterialButton buttonStyle="flat" onClick={this.wake}>Wake</MaterialButton>
                </div>
            </div>
            </div>
        );
    }
}
Card.propTypes = {
    id: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]),
    name: React.PropTypes.string,
    ip: React.PropTypes.string,
    mac: React.PropTypes.string,
    image: React.PropTypes.string,
    power: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.boolean
    ])
};

export default Card;