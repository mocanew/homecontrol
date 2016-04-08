import React from 'react';
import Header from '../components/header.jsx';
import Calendar from '../components/calendar/';
import 'expose?$!expose?jQuery!jquery';
import 'bootstrap-webpack';
import MaterialButton from '../components/materialButton.jsx';

class Home extends React.Component {
    constructor (props) {
        super (props);
        this.state = {
            menu: false
        };
    }
    componentWillUpdate (newProps, newState) {
        this.refs.header.setState({
            menu: newState.menu
        });
    }
    render () {
        document.title = 'FiiCode';
        return (
            <div>
                <Header ref="header" />
                <main>
                    <Calendar />
                </main>
                <div className="floatingButtonWrapper">
                    <MaterialButton buttonStyle="raised iconBtn plus" classes=""></MaterialButton>
                </div>
            </div>
        );
    }
}

export default Home;