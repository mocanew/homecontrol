'use strict';
import 'expose?$!expose?jQuery!jquery';
import 'imports?this=>window!./js/throttle.js';
import io from 'socket.io-client';
window.socket = io();
import './font-awesome-4.5.0/css/font-awesome.min.css';
import 'bootstrap-webpack';

import React from 'react';
import ReactDOM from 'react-dom';
import Hammer from 'hammerjs';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';
import Header from './components/header.jsx';
import RadioPi from './routes/radiopi.jsx';
import WakeOnLan from './routes/wakeonlan.jsx';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.swipeLeft = this.swipeLeft.bind(this);
        this.swipeRight = this.swipeRight.bind(this);

        this.state = {
            menu: false,
            title: 'Home Control'
        };
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
    }
    componentWillUnmount() {
        this.hammer.off('swipeleft');
        this.hammer.off('swiperight');
    }
    render() {
        document.title = this.state.title;
        return (
            <div>
                <Header ref="header" documentTitle={this.state.title} />
                <main>
                    {this.props.children}
                </main>
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
            <Route path="/radiopi" component={RadioPi}/>
            <Route path="/wakeonlan" component={WakeOnLan}/>
        </Route>
    </Router>,
    document.getElementById('root')
);