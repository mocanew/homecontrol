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
            required: JSON.parse(this.props.required),
            message: this.props.message
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
    static defaultValidator(e, options) {
        var empty = (e.trim().length > 0) ? false : true;
        return {
            empty: empty,
            error: options && options.required && empty ? true : false
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
    onInput(e) {
        var input = this.refs.input.value;
        if (typeof this.props.onInput == 'function') this.props.onInput(input);

        if (typeof this.props.onChange == 'function' && this.value.trim() != input.trim()) this.props.onChange(input.trim());

        var validator = Input.defaultValidator(input, {
            required: this.state.required
        });
        if (typeof this.props.validator == 'function') {
            validator = this.props.validator(input, {
                required: this.state.required,
                artificial: typeof e == 'boolean' ? e : false
            });
        }
        if (typeof validator.message != 'string') {
            validator.message = this.props.message;
        }

        this.setState({
            empty: validator.empty,
            error: validator.error,
            message: validator.message
        });
        this.value = input;
        if (typeof validator.callback == 'function') {
            setTimeout(validator.callback);
        }
    }
    clear() {
        this.refs.input.value = '';
        this.setState({
            empty: true,
            error: false
        });
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
                <div className="message">{this.state.message}</div>
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