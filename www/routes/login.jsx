import React from 'react';
// import classNames from 'classnames';
import Input from '../components/input.jsx';
import MaterialButton from '../components/materialButton.jsx';
import '../scss/login.scss';
import _ from 'lodash';

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.onLogin = _.isFunction(this.props.onLogin) ? this.props.onLogin : () => { };
        this.send = this.send.bind(this);
    }
    send(e) {
        if (e) e.preventDefault();
        var inputs = this.refs.form.getElementsByTagName('input');
        var data = {};
        _.each(inputs, (input) => {
            if (!input || input.type.toLowerCase() == 'submit') return;

            data[input.name.toLowerCase()] = input.value;
        });

        $.post({
            url: '/api/login',
            data: data,
            dataType: 'json'
        }, this.onLogin);
    }
    componentDidMount() {
        this.refs.form.addEventListener('submit', this.send);
    }
    componentWillUnmount() {
        this.refs.form.removeEventListener('submit', this.send);
    }
    render() {
        return (
            <div className="loginWrapper">
                <div className="backdrop"></div>
                <form action="#" className="loginForm" ref="form">
                    <Input name="username" required="true">Username</Input>
                    <Input name="password" required="true" type="password">Password</Input>
                    <MaterialButton onClick={this.send} buttonStyle="flat">Login</MaterialButton>
                    <input type="submit" className="hidden" />
                </form>
            </div>
        );
    }
}
Login.propTypes = {
    onLogin: React.PropTypes.func
};

export default Login;