import React from 'react';
import MaterialButton from './materialButton.jsx';
import Input from './input.jsx';
import classNames from 'classnames';

class Card extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            power: this.props.power,
            ip: this.props.ip,
            mac: this.props.mac
        };
        this.wake = this.wake.bind(this);
        this.ping = this.ping.bind(this);
        this.save = this.save.bind(this);

        this.name = this.props.name ? this.props.name : 'Computer ' + this.props.id;
    }
    static get defaultProps() {
        return {
            power: false,
            name: '',
            ip: '',
            mac: '',
            image: '/images/general.jpg'
        };
    }
    componentWillReceiveProps(nextProps) {
        if (!nextProps.direct && nextProps.power == this.props.power) return;

        this.setState({
            power: nextProps.power
        });
    }
    wake() {
        this.setState({
            power: ''
        });
        socket.emit('WakeOnLan', {
            ip: this.state.ip,
            mac: this.state.mac
        });
    }
    ping() {
        this.setState({
            power: ''
        });
        socket.emit('WakeOnLan:ping', {
            ip: this.state.ip,
            mac: this.state.mac
        });
    }
    save() {
        var error = this.refs.ip.error || this.refs.mac.error;
        if (this.refs.ip.value.trim().length <= 0 && this.refs.mac.value.trim().length <= 0) {
            var temp = {
                error: true
            };
            error = true;
            this.refs.ip.setState(temp);
            this.refs.mac.setState(temp);
        }
        this.refs.ip.state.error ? this.refs.ip.highlightError() : true;
        this.refs.mac.state.error ? this.refs.mac.highlightError() : true;

        if (error) return;

        this.props.onSave({
            name: this.refs.name.value,
            ip: this.refs.ip.value,
            mac: this.refs.mac.value
        });
    }
    verifyIP(e) {
        console.log(e);
        return false;
    }
    verifyMAC(e) {
        console.log(e);
        return false;
    }
    render() {
        if (typeof this.props.onSave == 'function') {
            return (
                <div className="wolCard new">
                    <div className="wrapper">
                        <Input ref="name">Computer name</Input>
                        <Input validator={this.verifyIP} message="Introduceți o adresă IP validă" ref="ip">IP</Input>
                        <Input validator={this.verifyMAC} message="Introduceți o adresă MAC validă" ref="mac">MAC</Input>
                        <div className="buttonsRow">
                            <MaterialButton buttonStyle="flat" onClick={this.save}>Add</MaterialButton>
                            <MaterialButton buttonStyle="flat" onClick={this.ping}>Ping</MaterialButton>
                            <MaterialButton buttonStyle="flat" onClick={this.wake}>Wake</MaterialButton>
                        </div>
                    </div>
                </div>
            );
        }

        var power = classNames({
            power: true,
            pinging: typeof this.state.power != 'boolean' ? true : false,
            on: this.state.power === true ? true : false
        });
        var imageStyle = {
            backgroundImage: 'url("' + this.props.image + '")'
        };
        return (
            <div className="wolCard">
                <div className="wrapper">
                    <div title="Șterge" className="trash" onClick={this.props.remove(this.props) }><i className="fa fa-trash-o fa-fw"></i></div>
                    <div title={this.state.power === true ? 'Pornit' : this.state.power === false ? 'Oprit' : ''} className={power} onClick={this.ping}>{ typeof this.state.power != 'boolean' ? <i className="fa fa-refresh fa-spin fa-fw"></i> : ''}</div>
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
    id: React.PropTypes.number,
    name: React.PropTypes.string,
    ip: React.PropTypes.string,
    mac: React.PropTypes.string,
    image: React.PropTypes.string,
    power: React.PropTypes.bool,
    onSave: React.PropTypes.func,
    remove: React.PropTypes.func
};

export default Card;