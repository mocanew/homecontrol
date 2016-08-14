'use strict';
import 'expose?$!expose?jQuery!jquery';
import 'imports?this=>window!./js/throttle.js';
import io from 'socket.io-client';
function newSocket() {
    window.socket = io.connect(location.protocol == 'http:' || location.protocol == 'https:' ? '//' + window.location.host : 'http://rontav.go.ro:80');
}
newSocket();
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap-webpack';

import React from 'react';
import ReactDOM from 'react-dom';
import Hammer from 'hammerjs';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';
import Header from './components/header.jsx';
import RadioPi from './routes/radiopi.jsx';
import WakeOnLan from './routes/wakeonlan.jsx';
import Login from './routes/login.jsx';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.swipeLeft = this.swipeLeft.bind(this);
        this.swipeRight = this.swipeRight.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);

        this.state = {
            loggedIn: false,
            menu: false,
            title: 'Home Control'
        };
    }
    login(e) {
        console.log(e);
        if (!e || !e.success) return;

        newSocket();
        this.setState({
            loggedIn: true
        });
    }
    logout() {
        newSocket();
        this.setState({
            loggedIn: false
        });
    }
    swipeLeft(e) {
        if (e.pointerType == 'mouse' || window.volumeSlider) return;
        this.setState({
            menu: false
        });
    }
    swipeRight(e) {
        if (e.pointerType == 'mouse' || window.volumeSlider) return;
        this.setState({
            menu: true
        });
    }
    componentWillUpdate(newProps, newState) {
        if (newProps.location.pathname != this.props.location.pathname) {
            newState.menu = false;
        }
        this.refs.header.setState({
            menu: newState.menu
        });
    }
    componentDidMount() {
        this.hammer = new Hammer(document.getElementById('root'), {});
        this.hammer.on('swipeleft', this.swipeLeft);
        this.hammer.on('swiperight', this.swipeRight);

        var elem = document.createElement('meta');
        elem.name = 'theme-color';
        elem.content = getComputedStyle(document.querySelector('nav.horizontal')).backgroundColor;
        document.getElementsByTagName('head')[0].appendChild(elem);

        socket.on('logStatus', (e) => {
            e ? this.login({ success: true }) : this.logout();
        });
    }
    componentWillUnmount() {
        this.hammer.off('swipeleft');
        this.hammer.off('swiperight');
    }
    render() {
        document.title = this.state.title;
        var loginPage = <Login onLogin={this.login} />;
        var content = <main>{this.props.children}</main>;
        return (
            <div>
                <Header ref="header" documentTitle={this.state.title} />
                {this.state.loggedIn ? content : loginPage}
            </div>
        );
    }
}
App.propTypes = {
    children: React.PropTypes.node,
    location: React.PropTypes.object
};

ReactDOM.render(
    <Router history={browserHistory}>
        <Route path="/" component={App}>
            <IndexRoute component={RadioPi} />
            <Route path="/index.html" component={RadioPi}/>
            <Route path="/android_asset/www/index.html" component={RadioPi}/>
            <Route path="/radiopi" component={RadioPi}/>
            <Route path="/wakeonlan" component={WakeOnLan}/>
        </Route>
    </Router>,
    document.getElementById('root')
);