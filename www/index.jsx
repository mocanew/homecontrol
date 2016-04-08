'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import Swipeable from 'react-swipeable';
import Home from './routes/home.jsx';

class Index extends React.Component {
    constructor (props) {
        super(props);
        this.swipedRight = this.swipedRight.bind(this);
        this.swipedLeft = this.swipedLeft.bind(this);
    }
    swipedRight () {
        this.refs.home.setState({
            menu: true
        });
    }
    swipedLeft () {
        this.refs.home.setState({
            menu: false
        });
    }
    render () {
        return (
            <Swipeable
                onSwipedRight={this.swipedRight}
                onSwipedLeft={this.swipedLeft}>
                <Home ref="home" />
            </Swipeable>
        );
    }
}
ReactDOM.render(
    <Index />,
    document.getElementById('app')
);