import React from 'react';
import MaterialButton from './materialButton.jsx';
import '../scss/_card.scss';
import classNames from 'classnames';

class Card extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            power: false
        };
        this.wake = this.wake.bind(this);
    }
    wake () {
        var a = this.state.power;
        this.setState({
            power: ''
        });
        setTimeout(() => {
            this.setState({
                power: !a
            });
        }, Math.random() * 1000);
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
            <div className="card">
                <div className={power}>{ typeof this.state.power != 'boolean' ? <i className="fa fa-refresh fa-spin fa-fw"></i> : ''}</div>
                <div className="image" style={imageStyle}></div>
                <div className="titleRow">
                    <div className="title">{this.props.title}</div>
                    <div className="subtitle">{this.props.subtitle}</div>
                </div>
                <div className="buttonsRow">
                    <MaterialButton buttonStyle="flat">Ping</MaterialButton>
                    <MaterialButton buttonStyle="flat" onClick={this.wake} >Wake</MaterialButton>
                </div>
            </div>
        );
    }
}
Card.propTypes = {
    title: React.PropTypes.string,
    subtitle: React.PropTypes.string,
    image: React.PropTypes.string
};

export default Card;