import React from 'react';
import '../scss/_input.scss';
import classNames from 'classnames';

class Input extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: false,
            empty: true,
            name: this.props.children ? this.props.children : this.props.name,
            title: this.props.children ? this.props.children : this.props.title,
            required: JSON.parse(this.props.required)
        };
        this.value = '';
        this.onInput = this.onInput.bind(this);
    }
    static get defaultProps() {
        return {
            name: '',
            title: '',
            required: false,
            message: 'This field is required'
        };
    }
    highlightError() {
        if (!this.state.error) return;
        this.setState({
            error: false
        });
        setTimeout(() => this.setState({
            error: true
        }), 500);
    }
    onInput() {
        var input = this.refs.input.value;
        if (typeof this.props.onInput == 'function') this.props.onInput(input);

        if (typeof this.props.onChange == 'function' && this.value.trim() != input.trim()) this.props.onChange(input.trim());
        var error;
        if (typeof this.props.validator == 'function') {
            error = this.props.validator(input);
        }

        this.setState({
            empty: input.trim().length > 0 ? false : true,
            error: error !== undefined ? !error : (!this.state.required || input.trim().length > 0 ? false : true)
        });
        this.value = input;
    }
    render() {
        var parentClasses = classNames({
            materialInput: true,
            error: this.state.error,
            empty: this.state.empty
        });
        return (
            <div className={parentClasses} ref="parent">
                <input type="text" name={this.state.name} onInput={this.onInput} onBlur={this.onInput} ref="input" required={this.state.required} />
                <span className="highlight"></span>
                <span className="bar"></span>
                <label htmlFor="name">{this.state.title + (this.state.required ? '*' : '') }</label>
                <div className="message">{this.props.message}</div>
            </div>
        );
    }
}

Input.propTypes = {
    name: React.PropTypes.string,
    children: React.PropTypes.string,
    title: React.PropTypes.string,
    required: React.PropTypes.bool,
    message: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onInput: React.PropTypes.func,
    validator: React.PropTypes.func
};

export default Input;