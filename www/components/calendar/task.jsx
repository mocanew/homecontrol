import React from 'react';
import classNames from 'classnames';
import MaterialButton from '../materialButton.jsx';

function cutToWord (e, maxLength) {
    e = e.trim();
    if (e.length < maxLength) return e;
    maxLength -= 3;
    var trimmedToSpace = e.substr(0, maxLength);
    trimmedToSpace = trimmedToSpace.substr(0, Math.min(trimmedToSpace.length, trimmedToSpace.lastIndexOf(' ')));
    return (trimmedToSpace ? trimmedToSpace : e.substr(0, maxLength)) + '...';
}

class Task extends React.Component {
    constructor (props) {
        super (props);
        this.state = {
            checked: this.props.checked,
            hover: false,
            hoverEnabled: true
        };
        this.onClick = this.onClick.bind(this);
        this.mouseOut = this.mouseOut.bind(this);
        this.mouseOver = this.mouseOver.bind(this);
        this.viewFull = this.viewFull.bind(this);
    }
    viewFull () {

    }
    onClick (e) {
        if (e.target.className.indexOf('check') == -1) {
            if (e.target.className.indexOf('title') >= 0) {
                if (this.state.hoverEnabled) this.mouseOver();
                else this.mouseOut(null, null, null, true);
                var self = this;
                self.setState({
                    hoverEnabled: !this.state.hoverEnabled
                });
            }
            return;
        }
        if (this.props.disabled) return;

        this.setState({
            checked: !this.state.checked
        });
    }
    mouseOver () {
        clearTimeout(this.timeout);
        this.setState({
            hover: true
        });
    }
    mouseOut (e, f, g, t) {
        if (!t && !this.state.hoverEnabled) return;

        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.setState({
                hover: false
            });
        }, t ? 0 : 500);
    }
    render () {
        var temp = classNames({
            task: true,
            checked: this.state.checked,
            hover: this.state.hover
        });
        var style = {
            zIndex: this.props.zIndex
        };
        return (
            <div style={style} className={temp} onClick={this.onClick} onMouseOver={this.mouseOver} onMouseLeave={this.mouseOut}>
                <div className="firstLine">
                    <div className="checkbox">
                        <i className="fa fa-check"></i>
                    </div>
                    <div className="title">
                        { cutToWord(this.props.title, 255) }
                    </div>
                </div>
                <div className="buttons">
                    <MaterialButton buttonStyle="flat" classes="details">Vezi detalii</MaterialButton>
                    <MaterialButton buttonStyle="flat" classes="remind">Amintește-mi!</MaterialButton>
                </div>
            </div>
        );
    }
}
Task.propTypes = {
    title: React.PropTypes.string.isRequired,
    checked: React.PropTypes.bool,
    disabled: React.PropTypes.bool,
    zIndex: React.PropTypes.number.isRequired
};

export default Task;